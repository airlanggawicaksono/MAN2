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
import {
  useCreateTahunAjaranMutation,
  useCreateSemesterMutation,
  useListTahunAjaranQuery
} from "@/api/shared/akademik";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

export function TahunAjaranForm() {
  const [startYear, setStartYear] = useState("");
  const [createTA, { isLoading, reset }] = useCreateTahunAjaranMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startYear) return;
    reset();
    const year = parseInt(startYear);
    const result = await createTA({
      nama: `${year}/${year + 1}`,
      tanggal_mulai: `${year}-01-01`,
      tanggal_selesai: `${year + 1}-12-31`,
      is_active: false,
    });
    if ("data" in result && result.data) {
      setStartYear("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Tambah Tahun Ajaran</h3>
      <div className="grid gap-2">
        <Label>Tahun Mulai</Label>
        <Select value={startYear} onValueChange={setStartYear}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih tahun" />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}/{y + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {startYear && (
          <p className="text-xs text-muted-foreground">
            Periode: 1 Januari {startYear} — 31 Desember {parseInt(startYear) + 1}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isLoading || !startYear}>Simpan</Button>
    </form>
  );
}

export function SemesterForm() {
  const { data: tahunAjarans } = useListTahunAjaranQuery();
  const [taId, setTaId] = useState("");
  const [tipe, setTipe] = useState("Ganjil");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [createSemester, { isLoading, reset }] = useCreateSemesterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taId || !tanggalMulai || !tanggalSelesai) return;
    reset();
    const result = await createSemester({
      tahun_ajaran_id: taId,
      tipe,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      is_active: false,
    });
    if ("data" in result && result.data) {
      setTanggalMulai("");
      setTanggalSelesai("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Tambah Semester</h3>
      <div className="grid gap-2">
        <Label>Tahun Ajaran</Label>
        <Select value={taId} onValueChange={setTaId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {tahunAjarans?.map(ta => (
              <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>{ta.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Tipe Semester</Label>
        <Select value={tipe} onValueChange={setTipe}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ganjil">Ganjil</SelectItem>
            <SelectItem value="Genap">Genap</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Tanggal Mulai</Label>
          <Input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Tanggal Selesai</Label>
          <Input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={isLoading || !taId || !tanggalMulai || !tanggalSelesai}>Simpan</Button>
    </form>
  );
}
