"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  useCreateKategoriKelasMutation,
  useDeleteKategoriKelasMutation,
  useListKategoriKelasQuery,
  useUpdateKategoriKelasMutation,
} from "@/api/shared/akademik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MapelTab from "../mapel/page";
import { notifyError, notifySuccess } from "@/lib/app-notify";

export default function KategoriKelasTab() {
  const { data: items = [], isLoading } = useListKategoriKelasQuery();
  const [createKategori, { isLoading: creating }] = useCreateKategoriKelasMutation();
  const [updateKategori] = useUpdateKategoriKelasMutation();
  const [deleteKategori] = useDeleteKategoriKelasMutation();
  const [form, setForm] = useState({ kode: "", nama: "" });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Pengaturan Umum: Kategori Kelas</h3>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!form.kode.trim() || !form.nama.trim()) return;
            try {
              await createKategori({
                kode: form.kode.trim().toUpperCase(),
                nama: form.nama.trim(),
                is_active: true,
              }).unwrap();
              setForm({ kode: "", nama: "" });
              notifySuccess("Kategori kelas berhasil ditambahkan.");
            } catch {
              notifyError("Gagal menambahkan kategori kelas.");
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
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Daftar Kategori</h3>
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
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await updateKategori({
                      id: item.kategori_kelas_id,
                      body: { is_active: !item.is_active },
                      }).unwrap();
                      notifySuccess("Status kategori kelas berhasil diubah.");
                    } catch {
                      notifyError("Gagal mengubah status kategori kelas.");
                    }
                  }}
                >
                  {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={async () => {
                    try {
                      await deleteKategori(item.kategori_kelas_id).unwrap();
                      notifySuccess("Kategori kelas berhasil dihapus.");
                    } catch {
                      notifyError("Gagal menghapus kategori kelas.");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

      <MapelTab />
    </div>
  );
}
