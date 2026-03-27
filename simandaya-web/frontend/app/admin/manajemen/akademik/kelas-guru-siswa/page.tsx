"use client";

import { Trash2, Plus, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectionAssignDialog } from "@/app/components/admin/selection-assign-dialog";
import {
  KelasCard,
  ManageKelasStudents,
} from "@/app/components/admin/kelas-management-cards";
import { useKelasGuruSiswaController } from "./use-kelas-guru-siswa-controller";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { SearchableSelect } from "@/components/ui/searchable-select";

const TINGKAT_OPTIONS = ["X", "XI", "XII"];

type KelasGuruSiswaPageProps = {
  embedded?: boolean;
};

export default function KelasGuruSiswaPage({
  embedded = false,
}: KelasGuruSiswaPageProps) {
  const {
    addCandidateStudents,
    addSiswaKelasId,
    allStudents,
    applyRosterChanges,
    classes,
    closeAddSiswaDialog,
    createKategoriKelas,
    createWaliKelasOptions,
    deleteGMTarget,
    editGMTarget,
    editGmForm,
    deleteGuruMapel,
    deleteKelas,
    deleteKelasTarget,
    editKelasForm,
    editWaliKelasOptions,
    filteredClasses,
    filteredGM,
    filteredStudents,
    gmForm,
    gmSearch,
    handleCreateGM,
    handleCreateKelas,
    handleSaveKelasEdit,
    handleSaveGMEdit,
    hasSelectionChanges,
    hasTahunAjaran,
    initialSelectedSiswaIds,
    kategoriForm,
    kategoriKelas,
    kelasForm,
    kelasSearch,
    loadingKelas,
    manageKelas,
    mapels,
    removeSiswa,
    removeSiswaTarget,
    selectedSiswaIds,
    selectedTA,
    setAddSiswaKelasId,
    setDeleteGMTarget,
    setEditGMTarget,
    setEditGmForm,
    setDeleteKelasTarget,
    setEditKelasForm,
    setGmForm,
    setGmSearch,
    setInitialSelectedSiswaIds,
    setKategoriForm,
    setKelasForm,
    setKelasSearch,
    setManageKelas,
    setRemoveSiswaTarget,
    setSelectedSiswaIds,
    setSelectedTA,
    setSelectionInitializedForKelasId,
    setSiswaSearch,
    siswaAssignedOtherClassIds,
    siswaSearch,
    taName,
    tahunAjarans,
    teachers,
    activeKategori,
  } = useKelasGuruSiswaController();

  return (
    <div className={embedded ? "space-y-8" : "space-y-8 p-8"}>
      <div className="flex flex-col gap-2">
        <h1
          className={
            embedded
              ? "text-2xl font-semibold tracking-tight"
              : "text-3xl font-bold tracking-tight"
          }
        >
          Kelas, Guru & Siswa
        </h1>
        <p className="text-muted-foreground">
          Kelola kelas, penugasan guru mata pelajaran, dan pengelolaan siswa per
          tahun ajaran. Pastikan Periode Akademik sudah dibuat dulu.
        </p>
      </div>

      {!hasTahunAjaran && (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Belum ada tahun ajaran. Buat dulu di tab{" "}
          <span className="font-medium">Periode Akademik</span>, lalu kembali ke
          tab ini untuk assign kelas dan siswa.
        </div>
      )}

      {/* ── Tahun Ajaran Selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <SearchableSelect
          value={selectedTA}
          onValueChange={(v) => setSelectedTA(v)}
          options={(tahunAjarans || []).map((ta) => ({
            value: ta.tahun_ajaran_id,
            label: `${ta.nama}${ta.is_active ? " (Aktif)" : ""}`,
          }))}
          placeholder="Pilih Tahun Ajaran"
          searchPlaceholder="Cari tahun ajaran..."
          emptyText="Tahun ajaran tidak ditemukan."
          className="w-[280px]"
          disabled={!hasTahunAjaran}
        />
        {taName && <Badge variant="outline">Tahun Ajaran: {taName}</Badge>}
      </div>

      {!selectedTA && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          Pilih tahun ajaran untuk mengelola kelas, guru, dan siswa.
        </div>
      )}

      {selectedTA && (
        <>
          {/* ── Section 1: Daftar Kelas ──────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Daftar Kelas</h2>

            <form
              onSubmit={handleCreateKelas}
              className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
            >
              <div className="grid gap-1">
                <Label className="text-xs">Kategori Kelas</Label>
                <Select
                  value={kelasForm.kategoriKelasId}
                  onValueChange={(v) =>
                    setKelasForm((p) => ({ ...p, kategoriKelasId: v }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeKategori.map((k) => (
                      <SelectItem
                        key={k.kategori_kelas_id}
                        value={k.kategori_kelas_id}
                      >
                        {k.nama} ({k.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Tingkat</Label>
                <Select
                  value={kelasForm.tingkat}
                  onValueChange={(v) =>
                    setKelasForm((p) => ({ ...p, tingkat: v }))
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TINGKAT_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">No.</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={kelasForm.nomor}
                  onChange={(e) =>
                    setKelasForm((p) => ({ ...p, nomor: e.target.value }))
                  }
                  className="w-[70px]"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Wali Kelas</Label>
                <SearchableSelect
                  value={kelasForm.waliKelasId}
                  onValueChange={(v) =>
                    setKelasForm((p) => ({ ...p, waliKelasId: v }))
                  }
                  options={[
                    { value: "null", label: "-" },
                    ...createWaliKelasOptions.map((t) => ({
                      value: t.user_id,
                      label: t.nama_lengkap,
                    })),
                  ]}
                  placeholder="Pilih Wali Kelas"
                  searchPlaceholder="Cari guru wali kelas..."
                  emptyText="Guru tidak ditemukan."
                  className="w-[200px]"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!kelasForm.kategoriKelasId}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                {"Preview Label Kelas: "} {kelasForm.tingkat}{" "}
                {kategoriKelas.find(
                  (k) => k.kategori_kelas_id === kelasForm.kategoriKelasId,
                )?.kode || "KAT"}{" "}
                {kelasForm.nomor}
              </span>
            </form>

            {kategoriKelas.length === 0 && (
              <div className="rounded-lg border border-dashed p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Isi pengaturan kategori kelas dulu sebelum membuat kelas.
                </p>
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!kategoriForm.kode.trim() || !kategoriForm.nama.trim())
                      return;
                    try {
                      await createKategoriKelas({
                        kode: kategoriForm.kode.trim().toUpperCase(),
                        nama: kategoriForm.nama.trim(),
                        is_active: true,
                      }).unwrap();
                      setKategoriForm({ kode: "", nama: "" });
                      notifySuccess("Kategori kelas berhasil ditambahkan.");
                    } catch {
                      notifyError("Gagal menambahkan kategori kelas.");
                    }
                  }}
                >
                  <div className="grid gap-1">
                    <Label className="text-xs">Kode</Label>
                    <Input
                      value={kategoriForm.kode}
                      onChange={(event) =>
                        setKategoriForm((prev) => ({
                          ...prev,
                          kode: event.target.value,
                        }))
                      }
                      placeholder="IPA"
                      className="w-[120px]"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Nama</Label>
                    <Input
                      value={kategoriForm.nama}
                      onChange={(event) =>
                        setKategoriForm((prev) => ({
                          ...prev,
                          nama: event.target.value,
                        }))
                      }
                      placeholder="Ilmu Pengetahuan Alam"
                      className="w-[260px]"
                    />
                  </div>
                  <Button type="submit" size="sm">
                    Tambah Kategori
                  </Button>
                </form>
              </div>
            )}

            <div className="max-w-xs">
              <Label className="text-xs">Cari Kelas</Label>
              <Input
                value={kelasSearch}
                onChange={(event) => setKelasSearch(event.target.value)}
                placeholder="Cari nama kelas / wali kelas..."
              />
            </div>

            {loadingKelas && <p className="text-muted-foreground">Memuat...</p>}

            <div className="max-h-[540px] space-y-2 overflow-y-auto rounded-lg border p-2">
              {filteredClasses.map((kelas) => (
                <KelasCard
                  key={kelas.kelas_id}
                  kelas={kelas}
                  onDelete={() => setDeleteKelasTarget(kelas)}
                  onManage={() => setManageKelas(kelas)}
                />
              ))}
              {filteredClasses.length === 0 && (
                <p className="text-muted-foreground text-center py-6">
                  Belum ada kelas untuk tahun ajaran ini.
                </p>
              )}
            </div>
          </section>

          {/* ── Section 2: Penugasan Guru ─────────────────────────────────── */}
          {/* ── Section 3: Penugasan Guru ──────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Penugasan Guru Mata Pelajaran
            </h2>

            <form
              onSubmit={handleCreateGM}
              className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
            >
              <div className="grid gap-1">
                <Label className="text-xs">Guru</Label>
                <SearchableSelect
                  value={gmForm.user_id}
                  onValueChange={(v) =>
                    setGmForm((p) => ({ ...p, user_id: v }))
                  }
                  options={(teachers?.items || []).map((t) => ({
                    value: t.user_id,
                    label: t.nama_lengkap || t.nip || t.user_id,
                  }))}
                  placeholder="Pilih Guru"
                  searchPlaceholder="Cari guru..."
                  emptyText="Guru tidak ditemukan."
                  className="w-[200px]"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Mata Pelajaran</Label>
                <SearchableSelect
                  value={gmForm.mapel_id}
                  onValueChange={(v) =>
                    setGmForm((p) => ({ ...p, mapel_id: v }))
                  }
                  options={(mapels || []).map((m) => ({
                    value: m.mapel_id,
                    label: `${m.nama_mapel}${
                      m.kode_mapel ? ` (${m.kode_mapel})` : ""
                    }`,
                    keywords: `${m.nama_mapel || ""} ${m.kode_mapel || ""}`,
                  }))}
                  placeholder="Pilih Mapel"
                  searchPlaceholder="Cari mapel atau kode..."
                  emptyText="Mapel tidak ditemukan."
                  className="w-[200px]"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Kelas</Label>
                <SearchableSelect
                  value={gmForm.kelas_id}
                  onValueChange={(v) =>
                    setGmForm((p) => ({ ...p, kelas_id: v }))
                  }
                  options={(classes || []).map((c) => ({
                    value: c.kelas_id,
                    label: c.nama_kelas,
                  }))}
                  placeholder="Pilih Kelas"
                  searchPlaceholder="Cari kelas..."
                  emptyText="Kelas tidak ditemukan."
                  className="w-[160px]"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !gmForm.user_id || !gmForm.mapel_id || !gmForm.kelas_id
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </form>

            <div className="max-w-xs">
              <Label className="text-xs">Cari Penugasan</Label>
              <Input
                value={gmSearch}
                onChange={(event) => setGmSearch(event.target.value)}
                placeholder="Cari guru / mapel / kelas..."
              />
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                    <tr className="border-b">
                    <th className="p-3 text-left font-medium">Guru</th>
                    <th className="p-3 text-left font-medium">
                      Mata Pelajaran
                    </th>
                    <th className="p-3 text-left font-medium">Kelas</th>
                    <th className="p-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGM.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-muted-foreground"
                      >
                        Belum ada penugasan guru.
                      </td>
                    </tr>
                  )}
                  {filteredGM.map((gm) => (
                    <tr
                      key={gm.guru_mapel_id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3">{gm.guru_nama || "—"}</td>
                      <td className="p-3">{gm.mapel_nama || "—"}</td>
                      <td className="p-3">{gm.kelas_nama || "—"}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditGMTarget(gm)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteGMTarget(gm)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}

      <Dialog
        open={!!manageKelas}
        onOpenChange={(open) => !open && setManageKelas(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Kelas</DialogTitle>
            <DialogDescription>
              Edit data kelas dan kelola siswa di sini.
            </DialogDescription>
          </DialogHeader>
          {manageKelas ? (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
                <div className="grid gap-1">
                  <Label className="text-xs">Kategori</Label>
                  <Select
                    value={editKelasForm.kategoriKelasId}
                    onValueChange={(v) =>
                      setEditKelasForm((p) => ({ ...p, kategoriKelasId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeKategori.map((k) => (
                        <SelectItem
                          key={k.kategori_kelas_id}
                          value={k.kategori_kelas_id}
                        >
                          {k.nama} ({k.kode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Tingkat</Label>
                  <Select
                    value={editKelasForm.tingkat}
                    onValueChange={(v) =>
                      setEditKelasForm((p) => ({ ...p, tingkat: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TINGKAT_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Nomor Kelas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editKelasForm.nomor}
                    onChange={(event) =>
                      setEditKelasForm((p) => ({
                        ...p,
                        nomor: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Wali Kelas</Label>
                  <SearchableSelect
                    value={editKelasForm.waliKelasId}
                    onValueChange={(v) =>
                      setEditKelasForm((p) => ({ ...p, waliKelasId: v }))
                    }
                    options={[
                      { value: "null", label: "-" },
                      ...editWaliKelasOptions.map((t) => ({
                        value: t.user_id,
                        label: t.nama_lengkap,
                      })),
                    ]}
                    placeholder="Pilih Wali Kelas"
                    searchPlaceholder="Cari guru wali kelas..."
                    emptyText="Guru tidak ditemukan."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Nama kelas:{" "}
                  <span className="font-medium text-foreground">
                    {editKelasForm.tingkat}{" "}
                    {kategoriKelas.find(
                      (k) =>
                        k.kategori_kelas_id === editKelasForm.kategoriKelasId,
                    )?.kode || "KAT"}{" "}
                    {editKelasForm.nomor}
                  </span>
                </p>
                <Button onClick={handleSaveKelasEdit}>Simpan Perubahan</Button>
              </div>

              <ManageKelasStudents
                kelas={manageKelas}
                onAdd={() => {
                  setAddSiswaKelasId(manageKelas.kelas_id);
                  setSelectionInitializedForKelasId(null);
                  setInitialSelectedSiswaIds([]);
                  setSiswaSearch("");
                }}
                onRemove={(userId, nama) =>
                  setRemoveSiswaTarget({
                    kelasId: manageKelas.kelas_id,
                    userId,
                    nama,
                  })
                }
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Kelas */}
      <AlertDialog
        open={!!deleteKelasTarget}
        onOpenChange={() => setDeleteKelasTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Hapus Kelas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Kelas <strong>{deleteKelasTarget?.nama_kelas}</strong> dan semua
              data terkait (siswa, jadwal) akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (deleteKelasTarget)
                    await deleteKelas(deleteKelasTarget.kelas_id).unwrap();
                  notifySuccess("Kelas berhasil dihapus.");
                } catch {
                  notifyError("Gagal menghapus kelas.");
                }
                setDeleteKelasTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Siswa to Kelas */}
      <SelectionAssignDialog
        open={!!addSiswaKelasId}
        onOpenChange={(open) => {
          if (open) return;
          closeAddSiswaDialog();
        }}
        title="Tambah Siswa ke Kelas"
        items={addCandidateStudents.map((s: any) => ({ ...s, id: s.user_id }))}
        selectedIds={selectedSiswaIds}
        onToggle={(id) =>
          setSelectedSiswaIds((prev) =>
            prev.includes(id)
              ? prev.filter((userId) => userId !== id)
              : [...prev, id],
          )
        }
        isItemDisabled={(s: any) => siswaAssignedOtherClassIds.has(s.user_id)}
        onSubmit={async () => {
          if (!addSiswaKelasId) return;
          const initialSet = new Set(initialSelectedSiswaIds);
          const selectedSet = new Set(selectedSiswaIds);
          const toAdd = selectedSiswaIds.filter(
            (userId) => !initialSet.has(userId),
          );
          const toRemove = initialSelectedSiswaIds.filter(
            (userId) => !selectedSet.has(userId),
          );
          await applyRosterChanges(addSiswaKelasId, toAdd, toRemove);
        }}
        submitDisabled={!hasSelectionChanges}
        submitLabel="Simpan Perubahan Siswa"
        searchValue={siswaSearch}
        onSearchChange={setSiswaSearch}
        searchPlaceholder="Cari nama atau NIS..."
        emptyText="Tidak ada data siswa."
        bottomContent={
          <div className="space-y-1 py-1 text-center text-xs text-muted-foreground">
            {(allStudents?.total || 0) > filteredStudents.length ? (
              <p>
                Menampilkan {filteredStudents.length} dari total{" "}
                {allStudents?.total || 0}. Gunakan pencarian untuk menemukan
                siswa lain.
              </p>
            ) : null}
            <p>
              Dipilih: {selectedSiswaIds.length} | Awal:{" "}
              {initialSelectedSiswaIds.length}
            </p>
            <p>
              Siswa yang sudah terdaftar di kelas lain akan nonaktif dan tidak
              bisa dipilih.
            </p>
          </div>
        }
        renderItem={(s: any) => (
          <div>
            <span className="text-sm">{s.nama_lengkap}</span>
            {s.nis ? (
              <span className="ml-2 text-xs text-muted-foreground">
                NIS: {s.nis}
              </span>
            ) : null}
            {siswaAssignedOtherClassIds.has(s.user_id) ? (
              <span className="ml-2 text-xs text-destructive">
                Sudah di kelas lain ({s.kelas_nama ?? s.kelas_jurusan})
              </span>
            ) : null}
          </div>
        )}
      />

      {/* Remove Siswa */}
      <AlertDialog
        open={!!removeSiswaTarget}
        onOpenChange={() => setRemoveSiswaTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeSiswaTarget?.nama}</strong> akan dikeluarkan dari
              kelas ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (removeSiswaTarget)
                    await removeSiswa({
                      kelasId: removeSiswaTarget.kelasId,
                      userId: removeSiswaTarget.userId,
                    }).unwrap();
                  notifySuccess("Siswa berhasil dikeluarkan dari kelas.");
                } catch {
                  notifyError("Gagal mengeluarkan siswa dari kelas.");
                }
                setRemoveSiswaTarget(null);
              }}
            >
              Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Guru Mapel */}
      <Dialog open={!!editGMTarget} onOpenChange={(open) => !open && setEditGMTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Penugasan Guru Mata Pelajaran</DialogTitle>
            <DialogDescription>
              Ubah guru, mata pelajaran, atau kelas untuk penugasan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1">
              <Label className="text-xs">Guru</Label>
              <SearchableSelect
                value={editGmForm.user_id}
                onValueChange={(v) => setEditGmForm((p) => ({ ...p, user_id: v }))}
                options={(teachers?.items || []).map((t) => ({
                  value: t.user_id,
                  label: t.nama_lengkap || t.nip || t.user_id,
                }))}
                placeholder="Pilih Guru"
                searchPlaceholder="Cari guru..."
                emptyText="Guru tidak ditemukan."
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Mata Pelajaran</Label>
              <SearchableSelect
                value={editGmForm.mapel_id}
                onValueChange={(v) => setEditGmForm((p) => ({ ...p, mapel_id: v }))}
                options={(mapels || []).map((m) => ({
                  value: m.mapel_id,
                  label: `${m.nama_mapel}${m.kode_mapel ? ` (${m.kode_mapel})` : ""}`,
                  keywords: `${m.nama_mapel || ""} ${m.kode_mapel || ""}`,
                }))}
                placeholder="Pilih Mapel"
                searchPlaceholder="Cari mapel..."
                emptyText="Mapel tidak ditemukan."
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Kelas</Label>
              <SearchableSelect
                value={editGmForm.kelas_id}
                onValueChange={(v) => setEditGmForm((p) => ({ ...p, kelas_id: v }))}
                options={(classes || []).map((c) => ({
                  value: c.kelas_id,
                  label: c.nama_kelas,
                }))}
                placeholder="Pilih Kelas"
                searchPlaceholder="Cari kelas..."
                emptyText="Kelas tidak ditemukan."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditGMTarget(null)}>
                Batal
              </Button>
              <Button
                onClick={handleSaveGMEdit}
                disabled={!editGmForm.user_id || !editGmForm.mapel_id || !editGmForm.kelas_id}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Guru Mapel */}
      <AlertDialog
        open={!!deleteGMTarget}
        onOpenChange={() => setDeleteGMTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penugasan Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Penugasan <strong>{deleteGMTarget?.guru_nama}</strong> untuk{" "}
              <strong>{deleteGMTarget?.mapel_nama}</strong> di{" "}
              <strong>{deleteGMTarget?.kelas_nama}</strong> akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (deleteGMTarget)
                    await deleteGuruMapel(
                      deleteGMTarget.guru_mapel_id,
                    ).unwrap();
                  notifySuccess("Penugasan guru mapel berhasil dihapus.");
                } catch {
                  notifyError("Gagal menghapus penugasan guru mapel.");
                }
                setDeleteGMTarget(null);
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

// ── Kelas Card with expandable student list ─────────────────────────────────

/* legacy in-file components moved to app/components/admin/kelas-management-cards.tsx
function KelasCard({
  kelas,
  onDelete,
  onManage,
}: {
  kelas: KelasResponse;
  onDelete: () => void;
  onManage: () => void;
}) {
  const { data: students = [], isLoading } = useListSiswaInKelasQuery(
    kelas.kelas_id,
  );
  const total = students?.length || 0;
  const onAddSiswa = () => {};
  const onRemoveSiswa = (_userId: string, _nama: string) => {};

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-bold">
            {kelas.tingkat}
          </Badge>
          <span className="font-medium">{kelas.nama_kelas}</span>
          {kelas.kategori_kelas_nama && (
            <span className="text-sm text-muted-foreground">
              ({kelas.kategori_kelas_nama})
            </span>
          )}
          {kelas.wali_kelas_nama && (
            <span className="text-sm text-muted-foreground">
              Wali guru: {kelas.wali_kelas_nama}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onManage}>
            Kelola
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Wali: {kelas.wali_kelas_nama || "Belum ditentukan"} •{" "}
        {isLoading ? "Memuat..." : `Total siswa: ${total}`}
      </div>

      {false && (
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Daftar Siswa</h4>
            <Button variant="outline" size="sm" onClick={onAddSiswa}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah Siswa
            </Button>
          </div>
          {isLoading && (
            <p className="text-xs text-muted-foreground">Memuat...</p>
          )}
          {students.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Belum ada siswa.
            </p>
          )}
          {students.length > 0 && (
            <div className="space-y-1">
              {students.map((sk, i) => (
                <div
                  key={sk.siswa_kelas_id}
                  className="flex items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-muted/50 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">
                      {i + 1}.
                    </span>
                    <span>{sk.nama_lengkap || "—"}</span>
                    {sk.nis && (
                      <span className="text-xs text-muted-foreground">
                        NIS: {sk.nis}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() =>
                      onRemoveSiswa(sk.user_id, sk.nama_lengkap || "siswa")
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManageKelasStudents({
  kelas,
  onAdd,
  onRemove,
}: {
  kelas: KelasResponse;
  onAdd: () => void;
  onRemove: (userId: string, nama: string) => void;
}) {
  const { data: students = [], isLoading } = useListSiswaInKelasQuery(
    kelas.kelas_id,
  );

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Daftar Siswa ({students?.length || 0})
        </h4>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" />
          Tambah Siswa
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Memuat siswa...</p>
      ) : null}

      {students.length > 0 ? (
        <div className="max-h-[360px] space-y-1 overflow-y-auto rounded border p-2">
          {students.map((sk, i) => (
            <div
              key={sk.siswa_kelas_id}
              className="flex items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span>{sk.nama_lengkap || "—"}</span>
                {sk.nis ? (
                  <span className="text-xs text-muted-foreground">
                    NIS: {sk.nis}
                  </span>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onRemove(sk.user_id, sk.nama_lengkap || "siswa")}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {students.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Belum ada siswa di kelas ini.
        </p>
      ) : null}
    </div>
  );
}
*/
