"use client";

import { useEffect, useState } from "react";
import { ArchiveRestore, ArchiveX } from "lucide-react";
import {
  useCreateKategoriKelasMutation,
  useDeleteKategoriKelasMutation,
  useGetKategoriKelasArchiveImpactQuery,
  useListKategoriKelasQuery,
  useListTahunAjaranQuery,
  useUpdateKategoriKelasMutation,
} from "@/api/shared/akademik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import MapelTab from "../mapel/page";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { getApiErrorMessage } from "@/lib/api-error";
import type { KategoriKelasResponse } from "@/types/akademik/kategori-kelas";

export default function KategoriKelasTab() {
  const { data: tahunAjarans = [] } = useListTahunAjaranQuery();
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"available" | "archived">(
    "available",
  );
  useEffect(() => {
    if (selectedTahunAjaranId || tahunAjarans.length === 0) return;
    const active = tahunAjarans.find((ta) => ta.is_active);
    setSelectedTahunAjaranId(active?.tahun_ajaran_id ?? tahunAjarans[0].tahun_ajaran_id);
  }, [selectedTahunAjaranId, tahunAjarans]);

  const { data: items = [], isLoading } = useListKategoriKelasQuery({
    status: statusFilter,
    tahunAjaranId: selectedTahunAjaranId || undefined,
  });
  const [createKategori, { isLoading: creating }] = useCreateKategoriKelasMutation();
  const [updateKategori] = useUpdateKategoriKelasMutation();
  const [deleteKategori] = useDeleteKategoriKelasMutation();
  const [form, setForm] = useState({ kode: "", nama: "" });
  const [archiveTarget, setArchiveTarget] = useState<KategoriKelasResponse | null>(
    null,
  );
  const { data: archiveImpact } = useGetKategoriKelasArchiveImpactQuery(
    archiveTarget?.kategori_kelas_id ?? "",
    { skip: !archiveTarget },
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 max-w-xs">
          <Label className="text-xs">Tahun Ajaran Setup</Label>
          <Select value={selectedTahunAjaranId} onValueChange={setSelectedTahunAjaranId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun ajaran" />
            </SelectTrigger>
            <SelectContent>
              {tahunAjarans.map((ta) => (
                <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                  {ta.nama} {ta.is_active ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <h3 className="mb-3 text-sm font-semibold">Pengaturan Umum: Kategori Kelas</h3>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!form.kode.trim() || !form.nama.trim() || !selectedTahunAjaranId) return;
            try {
              await createKategori({
                tahun_ajaran_id: selectedTahunAjaranId,
                kode: form.kode.trim().toUpperCase(),
                nama: form.nama.trim(),
                is_active: true,
              }).unwrap();
              setForm({ kode: "", nama: "" });
              notifySuccess("Kategori kelas berhasil ditambahkan.");
            } catch (error) {
              notifyError(
                getApiErrorMessage(error) || "Gagal menambahkan kategori kelas.",
              );
            }
          }}
        >
          <div className="grid gap-1">
            <Label className="text-xs">Kode</Label>
            <Input
              value={form.kode}
              onChange={(event) => setForm((prev) => ({ ...prev, kode: event.target.value }))}
              placeholder="IPA"
              className="w-[140px]"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Nama</Label>
            <Input
              value={form.nama}
              onChange={(event) => setForm((prev) => ({ ...prev, nama: event.target.value }))}
              placeholder="Ilmu Pengetahuan Alam"
              className="w-[260px]"
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "Menyimpan..." : "Tambah Kategori"}
          </Button>
        </form>
        {!selectedTahunAjaranId ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Buat dan pilih tahun ajaran terlebih dahulu.
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Daftar Kategori</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "available" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("available")}
            >
              Tersedia
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
            >
              Arsip
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Mengarsipkan kategori tidak menghapus histori kelas/kurikulum. Data
          arsip tidak bisa dipakai untuk assignment baru.
        </p>
        {isLoading ? <p className="text-sm text-muted-foreground">Memuat...</p> : null}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.kategori_kelas_id} className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0">
                <p className="font-medium">{item.nama}</p>
                <p className="text-xs text-muted-foreground">
                  {item.kode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.is_active ? "secondary" : "outline"}>
                  {item.is_active ? "Aktif" : "Arsip"}
                </Badge>
                {item.is_active ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setArchiveTarget(item)}
                    title="Arsipkan kategori"
                  >
                    <ArchiveX className="mr-1 h-4 w-4" />
                    Arsipkan
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await updateKategori({
                          id: item.kategori_kelas_id,
                          body: { is_active: true },
                        }).unwrap();
                        notifySuccess("Kategori kelas berhasil diaktifkan kembali.");
                      } catch (error) {
                        notifyError(
                          getApiErrorMessage(error) ||
                            "Gagal mengaktifkan kembali kategori kelas.",
                        );
                      }
                    }}
                    title="Aktifkan kembali"
                  >
                    <ArchiveRestore className="mr-1 h-4 w-4" />
                    Aktifkan kembali
                  </Button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada kategori kelas.
            </p>
          ) : null}
        </div>
      </div>

      <AlertDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan Kategori Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori <strong>{archiveTarget?.nama}</strong> akan dipindah ke
              arsip (bukan dihapus permanen).
              <br />
              Dampak referensi:
              <br />
              Kelas: <strong>{archiveImpact?.kelas_count ?? 0}</strong>, Kurikulum:{" "}
              <strong>{archiveImpact?.kurikulum_count ?? 0}</strong>.
              <br />
              Histori tetap aman, tetapi kategori ini tidak bisa dipilih untuk
              assignment baru sampai diaktifkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!archiveTarget) return;
                try {
                  await deleteKategori(archiveTarget.kategori_kelas_id).unwrap();
                  notifySuccess("Kategori kelas berhasil diarsipkan.");
                } catch (error) {
                  notifyError(
                    getApiErrorMessage(error) || "Gagal mengarsipkan kategori kelas.",
                  );
                }
                setArchiveTarget(null);
              }}
            >
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MapelTab tahunAjaranId={selectedTahunAjaranId} />
    </div>
  );
}
