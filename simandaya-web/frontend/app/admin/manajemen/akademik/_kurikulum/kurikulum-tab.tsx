"use client";

import { useEffect, useState } from "react";
import {
  useListTahunAjaranQuery,
  useListKurikulumByTahunAjaranQuery,
  useListMapelQuery,
  useListKategoriKelasQuery,
  useBulkAssignKurikulumMutation,
  useDeleteKurikulumMapelMutation,
  useUpdateKurikulumMapelMutation,
} from "@/api/shared/akademik";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { KurikulumMapelResponse } from "@/types/akademik/kurikulum";
import type { MapelResponse } from "@/types/akademik/mapel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { SelectionAssignDialog } from "@/app/components/admin/selection-assign-dialog";
import {
  setMapelKelompokFilter,
  setMapelSearch,
  setKelompokFilterByTingkat,
  setSelectedTahunAjaranId,
  type KurikulumKelompokFilter,
} from "@/store/slices/kurikulum";
import { notifyError, notifySuccess } from "@/lib/app-notify";

const TINGKAT_LIST = ["X", "XI", "XII"] as const;
const KELOMPOK_ORDER = ["Keagamaan", "Wajib", "Peminatan", "Muatan Lokal"];
const MAPEL_PICKER_LIMIT = 20;
const PICKER_KELOMPOK_TABS: KurikulumKelompokFilter[] = [
  "ALL",
  "Wajib",
  "Peminatan",
  "Muatan Lokal",
  "Keagamaan",
];

function groupByKelompok(items: KurikulumMapelResponse[]) {
  const grouped: Record<string, KurikulumMapelResponse[]> = {};
  for (const item of items) {
    const key = item.kelompok || "Lainnya";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  const sorted: [string, KurikulumMapelResponse[]][] = [];
  for (const key of KELOMPOK_ORDER) {
    if (grouped[key]) sorted.push([key, grouped[key]]);
  }
  for (const [key, value] of Object.entries(grouped)) {
    if (!KELOMPOK_ORDER.includes(key)) sorted.push([key, value]);
  }
  return sorted;
}

export default function KurikulumTab() {
  const dispatch = useAppDispatch();
  const {
    selectedTahunAjaranId,
    mapelSearch,
    mapelKelompokFilter,
    kelompokFilterByTingkat,
  } = useAppSelector(
    (state) => state.kurikulum,
  );

  const { data: tahunAjarans } = useListTahunAjaranQuery();
  const { data: kategoriKelas = [] } = useListKategoriKelasQuery({
    status: "available",
    tahunAjaranId: selectedTahunAjaranId || undefined,
  });
  const { data: allMapels } = useListMapelQuery({
    status: "available",
    tahunAjaranId: selectedTahunAjaranId || undefined,
  });
  const [selectedKategoriKelasId, setSelectedKategoriKelasId] = useState<string>("");
  const { data: kurikulumItems, isLoading } = useListKurikulumByTahunAjaranQuery(
    { taId: selectedTahunAjaranId, kategoriKelasId: selectedKategoriKelasId || undefined },
    { skip: !selectedTahunAjaranId },
  );

  const [bulkAssign] = useBulkAssignKurikulumMutation();
  const [deleteKM] = useDeleteKurikulumMapelMutation();
  const [updateKM] = useUpdateKurikulumMapelMutation();

  const [deleteTarget, setDeleteTarget] = useState<KurikulumMapelResponse | null>(null);
  const [addDialogTingkat, setAddDialogTingkat] = useState<string | null>(null);
  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>([]);
  const [mapelPickerSkip, setMapelPickerSkip] = useState(0);
  const [toggleTarget, setToggleTarget] = useState<KurikulumMapelResponse | null>(null);

  useEffect(() => {
    if (selectedTahunAjaranId || !tahunAjarans?.length) return;
    const active = tahunAjarans.find((ta) => ta.is_active);
    dispatch(setSelectedTahunAjaranId(active?.tahun_ajaran_id ?? tahunAjarans[0].tahun_ajaran_id));
  }, [dispatch, selectedTahunAjaranId, tahunAjarans]);

  useEffect(() => {
    if (selectedKategoriKelasId || !kategoriKelas.length) return;
    const active = kategoriKelas.find((k) => k.is_active);
    setSelectedKategoriKelasId(active?.kategori_kelas_id ?? kategoriKelas[0].kategori_kelas_id);
  }, [kategoriKelas, selectedKategoriKelasId]);

  const getItemsByTingkat = (tingkat: string) =>
    kurikulumItems?.filter((item) => item.tingkat === tingkat) || [];

  const getUnassignedMapels = (tingkat: string): MapelResponse[] => {
    const assigned = new Set(getItemsByTingkat(tingkat).map((item) => item.mapel_id));
    const search = mapelSearch.trim().toLowerCase();

    return (allMapels || []).filter((mapel) => {
      if (!mapel.is_active || assigned.has(mapel.mapel_id)) return false;
      if (mapelKelompokFilter !== "ALL" && mapel.kelompok !== mapelKelompokFilter) return false;
      if (!search) return true;
      return (
        mapel.nama_mapel.toLowerCase().includes(search) ||
        mapel.kode_mapel.toLowerCase().includes(search)
      );
    });
  };

  const handleBulkAssign = async () => {
    if (!addDialogTingkat || !selectedTahunAjaranId || selectedMapelIds.length === 0) return;
    try {
      await bulkAssign({
        tahun_ajaran_id: selectedTahunAjaranId,
        tingkat: addDialogTingkat,
        kategori_kelas_id: selectedKategoriKelasId,
        mapel_ids: selectedMapelIds,
        is_wajib: true,
      }).unwrap();
      setAddDialogTingkat(null);
      setSelectedMapelIds([]);
      setMapelPickerSkip(0);
      notifySuccess("Mata pelajaran berhasil ditambahkan ke struktur kurikulum.");
    } catch {
      notifyError("Gagal menambahkan mata pelajaran ke struktur kurikulum.");
    }
  };

  const handleToggleWajib = async () => {
    if (!toggleTarget) return;
    try {
      await updateKM({
        id: toggleTarget.kurikulum_mapel_id,
        body: { is_wajib: !toggleTarget.is_wajib },
      }).unwrap();
      notifySuccess("Status mapel kurikulum berhasil diperbarui.");
    } catch {
      notifyError("Gagal memperbarui status mapel kurikulum.");
    }
    setToggleTarget(null);
  };

  const taName = tahunAjarans?.find((t) => t.tahun_ajaran_id === selectedTahunAjaranId)?.nama;
  const unassignedMapels = addDialogTingkat ? getUnassignedMapels(addDialogTingkat) : [];
  const pagedUnassignedMapels = unassignedMapels.slice(
    mapelPickerSkip,
    mapelPickerSkip + MAPEL_PICKER_LIMIT,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedTahunAjaranId}
          onValueChange={(value) => dispatch(setSelectedTahunAjaranId(value))}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            {tahunAjarans?.map((ta) => (
              <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                {ta.nama} {ta.is_active ? "(Aktif)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedKategoriKelasId} onValueChange={setSelectedKategoriKelasId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih Kategori Kelas" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            {kategoriKelas.map((k) => (
              <SelectItem key={k.kategori_kelas_id} value={k.kategori_kelas_id}>
                {k.nama} ({k.kode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {taName ? (
          <p className="text-sm text-muted-foreground">
            Menampilkan struktur kurikulum untuk <strong>{taName}</strong>
          </p>
        ) : null}
      </div>

      {kategoriKelas.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          Isi General Settings kategori kelas dulu sebelum mengatur struktur kurikulum.
        </div>
      ) : null}

      {!selectedTahunAjaranId && kategoriKelas.length > 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          Pilih tahun ajaran untuk melihat dan mengelola struktur kurikulum.
        </div>
      ) : null}

      {selectedTahunAjaranId && selectedKategoriKelasId && isLoading ? <p className="text-muted-foreground">Memuat...</p> : null}

      {selectedTahunAjaranId && selectedKategoriKelasId && !isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TINGKAT_LIST.map((tingkat) => {
            const items = getItemsByTingkat(tingkat);
            const currentFilter = kelompokFilterByTingkat[tingkat] ?? "ALL";
            const filteredItems =
              currentFilter === "ALL"
                ? items
                : items.filter((item) => item.kelompok === currentFilter);
            const grouped = groupByKelompok(filteredItems);

            return (
              <div key={tingkat} className="rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
                  <h3 className="text-lg font-semibold">Kelas {tingkat}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{items.length} mapel</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddDialogTingkat(tingkat);
                        setSelectedMapelIds([]);
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Tambah
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="overflow-x-auto">
                    <div className="flex min-w-max gap-2">
                      {PICKER_KELOMPOK_TABS.map((tab) => (
                        <Button
                          key={`${tingkat}-${tab}`}
                          type="button"
                          size="sm"
                          variant={currentFilter === tab ? "default" : "outline"}
                          onClick={() =>
                            dispatch(setKelompokFilterByTingkat({ tingkat, filter: tab }))
                          }
                        >
                          {tab === "ALL" ? "Semua" : tab}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {grouped.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Tidak ada mata pelajaran pada kategori ini.
                    </p>
                  ) : null}

                  <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
                    {grouped.map(([kelompok, mapels]) => (
                      <div key={kelompok}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {kelompok}
                      </h4>
                      <div className="space-y-1">
                        {mapels.map((item) => (
                          <div
                            key={item.kurikulum_mapel_id}
                            className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {item.kode_mapel}
                              </span>
                              <span className="truncate">{item.mapel_nama}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Badge
                                variant={item.is_wajib ? "default" : "outline"}
                                className="cursor-pointer text-xs"
                                onClick={() => setToggleTarget(item)}
                              >
                                {item.is_wajib ? "Wajib" : "Pilihan"}
                              </Badge>
                              {item.jam_override ? (
                                <span className="text-xs text-muted-foreground">
                                  {item.jam_override} jp
                                </span>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                                onClick={() => setDeleteTarget(item)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SelectionAssignDialog
        open={!!addDialogTingkat}
        onOpenChange={(open) => {
          if (open) return;
          setAddDialogTingkat(null);
          setMapelPickerSkip(0);
        }}
        title={`Tambah Mata Pelajaran - Kelas ${addDialogTingkat ?? ""}`}
        items={pagedUnassignedMapels.map((mapel) => ({ ...mapel, id: mapel.mapel_id }))}
        selectedIds={selectedMapelIds}
        onToggle={(id) =>
          setSelectedMapelIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
          )
        }
        onSubmit={handleBulkAssign}
        submitLabel={`Tambah${selectedMapelIds.length > 0 ? ` (${selectedMapelIds.length})` : ""}`}
        submitDisabled={selectedMapelIds.length === 0}
        emptyText="Tidak ada mapel yang cocok dengan filter saat ini."
        searchValue={mapelSearch}
        onSearchChange={(value) => {
          dispatch(setMapelSearch(value));
          setMapelPickerSkip(0);
        }}
        searchPlaceholder="Cari mapel (nama/kode)..."
        topContent={
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {PICKER_KELOMPOK_TABS.map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  variant={mapelKelompokFilter === tab ? "default" : "outline"}
                  onClick={() => {
                    dispatch(setMapelKelompokFilter(tab));
                    setMapelPickerSkip(0);
                  }}
                >
                  {tab === "ALL" ? "Semua" : tab}
                </Button>
              ))}
            </div>
          </div>
        }
        bottomContent={
          addDialogTingkat && unassignedMapels.length > MAPEL_PICKER_LIMIT ? (
            <EntityTablePagination
              skip={mapelPickerSkip}
              limit={MAPEL_PICKER_LIMIT}
              total={unassignedMapels.length}
              itemLabel="mapel"
              onSkipChange={setMapelPickerSkip}
            />
          ) : null
        }
        renderItem={(mapel) => (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{mapel.kode_mapel}</span>
              <span className="truncate text-sm">{mapel.nama_mapel}</span>
            </div>
            <div className="mt-0.5 flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {mapel.kelompok}
              </Badge>
            </div>
          </div>
        )}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={() => setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah ke {toggleTarget?.is_wajib ? "Pilihan" : "Wajib"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Mata pelajaran <strong>{toggleTarget?.mapel_nama}</strong> akan diubah menjadi{" "}
              {toggleTarget?.is_wajib
                ? "mata pelajaran pilihan (siswa dapat memilih)"
                : "mata pelajaran wajib (semua siswa harus mengambil)"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleWajib}>
              Ubah ke {toggleTarget?.is_wajib ? "Pilihan" : "Wajib"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Hapus dari Kurikulum?</AlertDialogTitle>
            <AlertDialogDescription>
              Mata pelajaran <strong>{deleteTarget?.mapel_nama}</strong> akan dihapus dari Kelas{" "}
              {deleteTarget?.tingkat} untuk tahun ajaran ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (deleteTarget) await deleteKM(deleteTarget.kurikulum_mapel_id).unwrap();
                  notifySuccess("Mapel berhasil dihapus dari struktur kurikulum.");
                } catch {
                  notifyError("Gagal menghapus mapel dari struktur kurikulum.");
                }
                setDeleteTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
