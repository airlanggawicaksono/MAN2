"use client";

import { useState } from "react";
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
import { useCreateStudentMutation } from "@/api/admin/students";
import type { CreateStudentRequest } from "@/types/students";
import type { JenisKelamin, StatusSiswa } from "@/types/enums";
import { formatIsoToApiDmy } from "@/lib/date-id";
import { getApiErrorMessage } from "@/lib/api-error";
import { notifySuccess, notifyError } from "@/lib/app-notify";

interface StudentCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM: CreateStudentRequest = {
  nama_lengkap: "",
  kewarganegaraan: "Indonesia",
};

export function StudentCreateDialog({ open, onClose }: StudentCreateDialogProps) {
  const [form, setForm] = useState<CreateStudentRequest>(EMPTY_FORM);
  const [createStudent, { isLoading, error, reset }] = useCreateStudentMutation();

  const handleChange = (field: keyof CreateStudentRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    const payload: CreateStudentRequest = { ...form };
    if (payload.dob) payload.dob = formatIsoToApiDmy(payload.dob) ?? payload.dob;
    if (typeof payload.tahun_masuk === "number" && Number.isNaN(payload.tahun_masuk)) {
      delete payload.tahun_masuk;
    }
    const result = await createStudent(payload);
    if ("data" in result && result.data) {
      notifySuccess(`Siswa "${result.data.nama_lengkap}" berhasil ditambahkan.`);
      setForm(EMPTY_FORM);
      onClose();
    } else if ("error" in result) {
      const msg = getApiErrorMessage(result.error) ?? "Gagal menambah siswa.";
      notifyError(msg);
    }
  };

  const handleClose = () => {
    reset();
    setForm(EMPTY_FORM);
    onClose();
  };

  const errorMessage = getApiErrorMessage(error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Siswa Baru</DialogTitle>
        </DialogHeader>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>
                NISN <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                value={form.nisn || ""}
                onChange={(e) => handleChange("nisn", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                value={form.nama_lengkap}
                onChange={(e) => handleChange("nama_lengkap", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Kelas/Jurusan</Label>
              <Input
                value={form.kelas_jurusan || ""}
                onChange={(e) => handleChange("kelas_jurusan", e.target.value)}
                placeholder="Contoh: XII IPA 1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tahun Masuk</Label>
              <Input
                type="number"
                value={form.tahun_masuk ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  handleChange("tahun_masuk", v === "" ? (undefined as unknown as number) : parseInt(v));
                }}
                placeholder={new Date().getFullYear().toString()}
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
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-Laki">Laki-Laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
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
              <Label>Kewarganegaraan</Label>
              <Input
                value={form.kewarganegaraan || ""}
                onChange={(e) => handleChange("kewarganegaraan", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status_siswa ?? "Aktif"}
                onValueChange={(val) => handleChange("status_siswa", val as StatusSiswa)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                  <SelectItem value="Lulus">Lulus (Alumni)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nomor Kartu (RFID)</Label>
              <Input
                value={form.rfid_number || ""}
                onChange={(e) => handleChange("rfid_number", e.target.value)}
                placeholder="Opsional — nomor dari kartu fisik"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Tambah Siswa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
