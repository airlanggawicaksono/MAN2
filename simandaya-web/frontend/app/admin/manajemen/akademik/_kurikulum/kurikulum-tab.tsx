"use client";

import { useState } from "react";
import {
  useListTahunAjaranQuery,
  useListKurikulumByTahunAjaranQuery,
  useListMapelQuery,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { KurikulumMapelResponse } from "@/types/akademik/kurikulum";
import type { MapelResponse } from "@/types/akademik/mapel";

const TINGKAT_LIST = ["X", "XI", "XII"] as const;
const KELOMPOK_ORDER = ["Keagamaan", "Wajib", "Peminatan", "Muatan Lokal"];

function groupByKelompok(items: KurikulumMapelResponse[]) {
  const grouped: Record<string, KurikulumMapelResponse[]> = {};
  for (const item of items) {
    const key = item.kelompok || "Lainnya";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  // Sort by kelompok order
  const sorted: [string, KurikulumMapelResponse[]][] = [];
  for (const k of KELOMPOK_ORDER) {
    if (grouped[k]) sorted.push([k, grouped[k]]);
  }
  for (const [k, v] of Object.entries(grouped)) {
    if (!KELOMPOK_ORDER.includes(k)) sorted.push([k, v]);
  }
  return sorted;
}

export default function KurikulumTab() {
  const { data: tahunAjarans } = useListTahunAjaranQuery();
  const { data: allMapels } = useListMapelQuery();
  const [selectedTA, setSelectedTA] = useState<string>("");
  const { data: kurikulumItems, isLoading } = useListKurikulumByTahunAjaranQuery(
    selectedTA,
    { skip: !selectedTA }
  );

  const [bulkAssign] = useBulkAssignKurikulumMutation();
  const [deleteKM] = useDeleteKurikulumMapelMutation();
  const [updateKM] = useUpdateKurikulumMapelMutation();

  const [deleteTarget, setDeleteTarget] = useState<KurikulumMapelResponse | null>(null);
  const [addDialogTingkat, setAddDialogTingkat] = useState<string | null>(null);
  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>([]);
  const [toggleTarget, setToggleTarget] = useState<KurikulumMapelResponse | null>(null);

  // Filter items by tingkat
  const getItemsByTingkat = (tingkat: string) =>
    kurikulumItems?.filter((km) => km.tingkat === tingkat) || [];

  // Get mapels not yet assigned to this tingkat
  const getUnassignedMapels = (tingkat: string): MapelResponse[] => {
    const assigned = new Set(
      getItemsByTingkat(tingkat).map((km) => km.mapel_id)
    );
    return (allMapels || []).filter(
      (m) => !assigned.has(m.mapel_id) && m.is_active
    );
  };

  const handleBulkAssign = async () => {
    if (!addDialogTingkat || !selectedTA || selectedMapelIds.length === 0) return;
    await bulkAssign({
      tahun_ajaran_id: selectedTA,
      tingkat: addDialogTingkat,
      mapel_ids: selectedMapelIds,
      is_wajib: true,
    });
    setAddDialogTingkat(null);
    setSelectedMapelIds([]);
  };

  const handleToggleWajib = async () => {
    if (!toggleTarget) return;
    await updateKM({
      id: toggleTarget.kurikulum_mapel_id,
      body: { is_wajib: !toggleTarget.is_wajib },
    });
    setToggleTarget(null);
  };

  const taName = tahunAjarans?.find((t) => t.tahun_ajaran_id === selectedTA)?.nama;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedTA} onValueChange={setSelectedTA}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {tahunAjarans?.map((ta) => (
              <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                {ta.nama} {ta.is_active ? "(Aktif)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {taName && (
          <p className="text-sm text-muted-foreground">
            Menampilkan struktur kurikulum untuk <strong>{taName}</strong>
          </p>
        )}
      </div>

      {!selectedTA && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          Pilih tahun ajaran untuk melihat dan mengelola struktur kurikulum.
        </div>
      )}

      {selectedTA && isLoading && <p className="text-muted-foreground">Memuat...</p>}

      {selectedTA && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TINGKAT_LIST.map((tingkat) => {
            const items = getItemsByTingkat(tingkat);
            const grouped = groupByKelompok(items);

            return (
              <div key={tingkat} className="rounded-lg border bg-card">
                <div className="flex items-center justify-between p-4 border-b">
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
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {grouped.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada mata pelajaran yang ditugaskan.
                    </p>
                  )}

                  {grouped.map(([kelompok, mapels]) => (
                    <div key={kelompok}>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {kelompok}
                      </h4>
                      <div className="space-y-1">
                        {mapels.map((km) => (
                          <div
                            key={km.kurikulum_mapel_id}
                            className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-xs text-muted-foreground">
                                {km.kode_mapel}
                              </span>
                              <span className="truncate">{km.mapel_nama}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge
                                variant={km.is_wajib ? "default" : "outline"}
                                className="cursor-pointer text-xs"
                                onClick={() => setToggleTarget(km)}
                              >
                                {km.is_wajib ? "Wajib" : "Pilihan"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {km.jam_override || km.jam_per_minggu}jp
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                onClick={() => setDeleteTarget(km)}
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
            );
          })}
        </div>
      )}

      {/* Add Mapel Dialog */}
      <Dialog open={!!addDialogTingkat} onOpenChange={() => setAddDialogTingkat(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Tambah Mata Pelajaran — Kelas {addDialogTingkat}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {addDialogTingkat &&
              getUnassignedMapels(addDialogTingkat).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Semua mata pelajaran sudah ditugaskan ke tingkat ini.
                </p>
              )}
            {addDialogTingkat &&
              getUnassignedMapels(addDialogTingkat).map((mapel) => {
                const isSelected = selectedMapelIds.includes(mapel.mapel_id);
                return (
                  <label
                    key={mapel.mapel_id}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedMapelIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== mapel.mapel_id)
                            : [...prev, mapel.mapel_id]
                        )
                      }
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {mapel.kode_mapel}
                        </span>
                        <span className="text-sm truncate">{mapel.nama_mapel}</span>
                      </div>
                      <div className="flex gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {mapel.kelompok}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {mapel.jam_per_minggu} jp/minggu
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogTingkat(null)}>
              Batal
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={selectedMapelIds.length === 0}
            >
              Tambah {selectedMapelIds.length > 0 ? `(${selectedMapelIds.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Wajib/Pilihan Dialog */}
      <AlertDialog open={!!toggleTarget} onOpenChange={() => setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ubah ke {toggleTarget?.is_wajib ? "Pilihan" : "Wajib"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mata pelajaran <strong>{toggleTarget?.mapel_nama}</strong> akan diubah
              menjadi{" "}
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Hapus dari Kurikulum?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mata pelajaran <strong>{deleteTarget?.mapel_nama}</strong> akan dihapus
              dari Kelas {deleteTarget?.tingkat} untuk tahun ajaran ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await deleteKM(deleteTarget.kurikulum_mapel_id);
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
