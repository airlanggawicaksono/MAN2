"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUpdateStudentMutation } from "@/api/admin/students";
import type { StudentProfile, UpdateStudentRequest } from "@/types/students";
import type { JenisKelamin, StatusSiswa } from "@/types/enums";
import { formatIsoToApiDmy, normalizeDateToIso } from "@/lib/date-id";
import { getApiErrorMessage } from "@/lib/api-error";
import { normalizeDigits, validateWithAlert } from "@/lib/io-guards";
import { studentEditValidationRules } from "@/lib/form-validators";

interface StudentEditDialogProps {
  student: StudentProfile | null;
  open: boolean;
  onClose: () => void;
}

export function StudentEditDialog({ student, open, onClose }: StudentEditDialogProps) {
  const [form, setForm] = useState<UpdateStudentRequest>({});
  const [updateStudent, { isLoading, error, reset }] = useUpdateStudentMutation();

  useEffect(() => {
    if (student) {
      const dobIso = normalizeDateToIso(student.dob);
      setForm({
        nisn: student.nisn ?? undefined,
        nama_lengkap: student.nama_lengkap,
        dob: dobIso || undefined,
        tempat_lahir: student.tempat_lahir ?? undefined,
        jenis_kelamin: student.jenis_kelamin ?? undefined,
        alamat: student.alamat ?? undefined,
        nama_wali: student.nama_wali ?? undefined,
        no_telephone_wali: student.no_telephone_wali ?? undefined,
        kelas_jurusan: student.kelas_jurusan ?? undefined,
        tahun_masuk: student.tahun_masuk ?? undefined,
        status_siswa: student.status_siswa,
        kontak: student.kontak ?? undefined,
        kewarganegaraan: student.kewarganegaraan,
        rfid_number: student.rfid_number ?? undefined,
      });
    }
  }, [student]);

  const handleChange = (field: keyof UpdateStudentRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForApi = (isoDate: string | undefined): string => {
    return formatIsoToApiDmy(isoDate) ?? "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const payload = { ...form };
    if (!validateWithAlert(studentEditValidationRules(payload))) return;
    reset();
    if (payload.dob) payload.dob = formatDateForApi(payload.dob);
    if (typeof payload.tahun_masuk === "number" && Number.isNaN(payload.tahun_masuk)) {
      delete payload.tahun_masuk;
    }
    const result = await updateStudent({ siswaId: student.siswa_id, body: payload });
    if ("data" in result) onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorMessage = getApiErrorMessage(error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Siswa</DialogTitle>
        </DialogHeader>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>NISN</Label>
              <Input
                value={form.nisn || ""}
                inputMode="numeric"
                placeholder="Hanya angka"
                onChange={(e) => handleChange("nisn", normalizeDigits(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={form.nama_lengkap || ""}
                onChange={(e) => handleChange("nama_lengkap", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tempat Lahir</Label>
              <Input
                value={form.tempat_lahir || ""}
                onChange={(e) => handleChange("tempat_lahir", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tanggal Lahir</Label>
              <DateInputId
                value={form.dob || ""}
                onValueChange={(value) => handleChange("dob", value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Jenis Kelamin</Label>
              <Select
                value={form.jenis_kelamin}
                onValueChange={(val) => handleChange("jenis_kelamin", val as JenisKelamin)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-Laki">Laki-Laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Alamat</Label>
              <Input
                value={form.alamat || ""}
                onChange={(e) => handleChange("alamat", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama Wali</Label>
              <Input
                value={form.nama_wali || ""}
                onChange={(e) => handleChange("nama_wali", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>No. Telepon Wali</Label>
              <Input
                value={form.no_telephone_wali || ""}
                onChange={(e) => handleChange("no_telephone_wali", e.target.value)}
                placeholder="Contoh: 628123456789"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tahun Masuk</Label>
              <Input
                type="number"
                value={form.tahun_masuk ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  handleChange("tahun_masuk", v === "" ? (undefined as unknown as number) : parseInt(v, 10));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status_siswa}
                onValueChange={(val) => handleChange("status_siswa", val as StatusSiswa)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                  <SelectItem value="Lulus">Lulus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Kontak</Label>
              <Input
                value={form.kontak || ""}
                onChange={(e) => handleChange("kontak", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Kewarganegaraan</Label>
              <Input
                value={form.kewarganegaraan || ""}
                onChange={(e) => handleChange("kewarganegaraan", e.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Nomor Kartu (RFID)</Label>
              <Input
                value={form.rfid_number || ""}
                onChange={(e) => handleChange("rfid_number", e.target.value)}
                placeholder="Nomor dari kartu fisik siswa"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
