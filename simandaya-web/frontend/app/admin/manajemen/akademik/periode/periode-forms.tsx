"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInputId } from "@/components/ui/date-input-id";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateTahunAjaranMutation,
  useCopyTahunAjaranStructureMutation,
  useCopySemesterStructureMutation,
  useCreateSemesterMutation,
  useListSemestersQuery,
  useListTahunAjaranQuery
} from "@/api/shared/akademik";
import { notifyError, notifySuccess } from "@/lib/app-notify";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);

export function TahunAjaranForm() {
  const [startYear, setStartYear] = useState("");
  const [copyFromTahunAjaranId, setCopyFromTahunAjaranId] = useState("");
  const [createTA, { isLoading, reset }] = useCreateTahunAjaranMutation();
  const [copyTA, { isLoading: isCopyingTA }] = useCopyTahunAjaranStructureMutation();
  const { data: tahunAjarans } = useListTahunAjaranQuery();

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startYear) return;
    reset();
    const year = parseInt(startYear);
    try {
      await createTA({
        nama: `${year}/${year + 1}`,
        tanggal_mulai: `${year}-01-01`,
        tanggal_selesai: `${year + 1}-12-31`,
        is_active: false,
      }).unwrap();
      setStartYear("");
      notifySuccess("Tahun ajaran berhasil dibuat.");
    } catch {
      notifyError("Gagal membuat tahun ajaran.");
    }
  };

  const submitCopy = async () => {
    if (!startYear || !copyFromTahunAjaranId) return;
    const year = parseInt(startYear);
    try {
      await copyTA({
        source_tahun_ajaran_id: copyFromTahunAjaranId,
        nama: `${year}/${year + 1}`,
        tanggal_mulai: `${year}-01-01`,
        tanggal_selesai: `${year + 1}-12-31`,
        is_active: false,
        copy_semester: true,
        copy_kelas: true,
        copy_guru_mapel: true,
        copy_kurikulum: true,
      }).unwrap();
      setStartYear("");
      setCopyFromTahunAjaranId("");
      notifySuccess("Tahun ajaran berhasil dicopy dari struktur sebelumnya.");
    } catch {
      notifyError("Gagal menyalin struktur tahun ajaran.");
    }
  };

  return (
    <form onSubmit={submitCreate} className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Tambah Tahun Ajaran</h3>
      <div className="grid gap-2">
        <Label>Tahun Mulai</Label>
        <Select value={startYear} onValueChange={setStartYear}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih tahun" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
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

      <div className="grid gap-2">
        <Label>Copy Struktur Dari Tahun Ajaran (Opsional)</Label>
        <Select value={copyFromTahunAjaranId} onValueChange={setCopyFromTahunAjaranId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih tahun ajaran sumber" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            {tahunAjarans?.map((ta) => (
              <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                {ta.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isLoading || !startYear}>
          Simpan Kosong
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isCopyingTA || !startYear || !copyFromTahunAjaranId}
          onClick={submitCopy}
        >
          {isCopyingTA ? "Menyalin..." : "Simpan + Copy Struktur"}
        </Button>
      </div>
    </form>
  );
}

export function SemesterForm() {
  const { data: tahunAjarans } = useListTahunAjaranQuery();
  const { data: semesters } = useListSemestersQuery();
  const [taId, setTaId] = useState("");
  const [tipe, setTipe] = useState("Ganjil");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [copyFromSemesterId, setCopyFromSemesterId] = useState("");
  const [createSemester, { isLoading, reset }] = useCreateSemesterMutation();
  const [copySemester, { isLoading: isCopyingSemester }] = useCopySemesterStructureMutation();
  const sourceSemesters = (semesters || []).filter((item) => item.tahun_ajaran_id === taId);

  useEffect(() => {
    setCopyFromSemesterId("");
  }, [taId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taId || !tanggalMulai || !tanggalSelesai) return;
    reset();
    try {
      await createSemester({
        tahun_ajaran_id: taId,
        tipe,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        is_active: false,
      }).unwrap();
      setTanggalMulai("");
      setTanggalSelesai("");
      notifySuccess("Semester berhasil dibuat.");
    } catch {
      notifyError("Gagal membuat semester.");
    }
  };

  const handleCopy = async () => {
    if (!copyFromSemesterId || !tanggalMulai || !tanggalSelesai || !taId) return;
    try {
      await copySemester({
        source_semester_id: copyFromSemesterId,
        tipe,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        is_active: false,
      }).unwrap();
      setTanggalMulai("");
      setTanggalSelesai("");
      setCopyFromSemesterId("");
      notifySuccess("Semester berhasil dicopy dari struktur sumber.");
    } catch {
      notifyError("Gagal menyalin struktur semester.");
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
          <SelectContent className="max-h-64 overflow-y-auto">
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
      <div className="grid gap-2">
        <Label>Copy Struktur Dari Semester (Opsional)</Label>
        <Select value={copyFromSemesterId} onValueChange={setCopyFromSemesterId} disabled={!taId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih semester sumber" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            {sourceSemesters.map((sem) => (
              <SelectItem key={sem.semester_id} value={sem.semester_id}>
                {sem.tipe} ({sem.tanggal_mulai} s/d {sem.tanggal_selesai})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Tanggal Mulai</Label>
          <DateInputId value={tanggalMulai} onValueChange={setTanggalMulai} required />
        </div>
        <div className="grid gap-2">
          <Label>Tanggal Selesai</Label>
          <DateInputId value={tanggalSelesai} onValueChange={setTanggalSelesai} required />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isLoading || !taId || !tanggalMulai || !tanggalSelesai}>
          Simpan Kosong
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isCopyingSemester || !taId || !copyFromSemesterId || !tanggalMulai || !tanggalSelesai}
          onClick={handleCopy}
        >
          {isCopyingSemester ? "Menyalin..." : "Simpan + Copy Struktur"}
        </Button>
      </div>
    </form>
  );
}
