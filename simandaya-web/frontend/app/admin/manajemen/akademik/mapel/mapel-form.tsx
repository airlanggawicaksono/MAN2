"use client";

import { useState } from "react";
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
import { useCreateMapelMutation } from "@/api/shared/akademik";
import type { CreateMapelRequest } from "@/types/akademik/mapel";
import { getApiErrorMessage } from "@/lib/api-error";
import { notifyError, notifySuccess } from "@/lib/app-notify";

const INITIAL_STATE: CreateMapelRequest = {
  nama_mapel: "",
  kode_mapel: "",
  kelompok: "Wajib",
};

type MapelFormProps = {
  tahunAjaranId?: string;
};

export function MapelForm({ tahunAjaranId }: MapelFormProps) {
  const [form, setForm] = useState<CreateMapelRequest>({ ...INITIAL_STATE });
  const [createMapel, { isLoading, error, reset }] = useCreateMapelMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (field: keyof CreateMapelRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tahunAjaranId) {
      notifyError("Pilih tahun ajaran setup terlebih dahulu.");
      return;
    }
    reset();
    setSuccessMessage(null);

    const result = await createMapel({
      ...form,
      tahun_ajaran_id: tahunAjaranId,
    });
    if ("data" in result && result.data) {
      setSuccessMessage("Mata pelajaran berhasil ditambahkan.");
      setForm({ ...INITIAL_STATE });
      notifySuccess("Mata pelajaran berhasil ditambahkan.");
    } else {
      notifyError(
        getApiErrorMessage("error" in result ? result.error : null) ||
          "Gagal menambahkan mata pelajaran.",
      );
    }
  };

  const errorText = getApiErrorMessage(error);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Tambah Mata Pelajaran Baru</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="kode_mapel">Kode Mapel *</Label>
          <Input
            id="kode_mapel"
            placeholder="Contoh: MAT-X"
            required
            value={form.kode_mapel}
            onChange={(e) => handleChange("kode_mapel", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nama_mapel">Nama Mata Pelajaran *</Label>
          <Input
            id="nama_mapel"
            placeholder="Contoh: Matematika"
            required
            value={form.nama_mapel}
            onChange={(e) => handleChange("nama_mapel", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="kelompok">Kelompok *</Label>
          <Select value={form.kelompok} onValueChange={(val) => handleChange("kelompok", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Wajib">Wajib</SelectItem>
              <SelectItem value="Peminatan">Peminatan</SelectItem>
              <SelectItem value="Muatan Lokal">Muatan Lokal</SelectItem>
              <SelectItem value="Keagamaan">Keagamaan</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {errorText && <p className="text-sm text-destructive">{errorText}</p>}
      {successMessage && <p className="text-sm text-primary font-medium">{successMessage}</p>}

      <Button type="submit" disabled={isLoading || !tahunAjaranId}>
        {isLoading ? "Menyimpan..." : "Simpan Mata Pelajaran"}
      </Button>
    </form>
  );
}
