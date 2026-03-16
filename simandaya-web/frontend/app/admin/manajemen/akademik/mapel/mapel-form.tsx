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
import { useCreateMapelMutation } from "@/api/akademik";
import type { CreateMapelRequest } from "@/types/akademik/mapel";

const INITIAL_STATE: CreateMapelRequest = {
  nama_mapel: "",
  kode_mapel: "",
  kelompok: "Wajib",
  jam_per_minggu: 2,
};

export function MapelForm() {
  const [form, setForm] = useState<CreateMapelRequest>({ ...INITIAL_STATE });
  const [createMapel, { isLoading, error, reset }] = useCreateMapelMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (field: keyof CreateMapelRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setSuccessMessage(null);

    const result = await createMapel(form);
    if ("data" in result && result.data) {
      setSuccessMessage("Mata pelajaran berhasil ditambahkan.");
      setForm({ ...INITIAL_STATE });
    }
  };

  const errorMessage =
    error && "data" in error
      ? (error.data as { detail?: unknown })?.detail
      : undefined;

  const errorText = typeof errorMessage === "string"
    ? errorMessage
    : Array.isArray(errorMessage)
      ? errorMessage.map((e: any) => e.msg).join(", ")
      : errorMessage ? JSON.stringify(errorMessage) : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Tambah Mata Pelajaran Baru</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid gap-2">
          <Label htmlFor="jam_per_minggu">Jam/Minggu *</Label>
          <Input
            id="jam_per_minggu"
            type="number"
            min={1}
            max={20}
            required
            value={form.jam_per_minggu}
            onChange={(e) => handleChange("jam_per_minggu", parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      {errorText && <p className="text-sm text-destructive">{errorText}</p>}
      {successMessage && <p className="text-sm text-primary font-medium">{successMessage}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Simpan Mata Pelajaran"}
      </Button>
    </form>
  );
}
