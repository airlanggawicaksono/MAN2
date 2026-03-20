"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUpdateTeacherMutation } from "@/api/admin/teachers";
import type { GuruProfile, UpdateGuruRequest } from "@/types/teachers";
import type {
  JenisKelamin,
  StatusGuru,
  StructuralRole,
} from "@/types/enums";

const STRUCTURAL_ROLES: StructuralRole[] = [
  "Komite Madrasah",
  "Kepala Madrasah",
  "Kepala Tata Usaha",
  "Wakamad Bid. Kurikulum",
  "Wakamad Bid. Kesiswaan",
  "Wakamad Bid. Sarpras",
  "Wakamad Bid. Humas",
  "Tim IT",
  "Pengembang Madrasah",
  "Kepala Laboratorium Terpadu",
  "Wali Kelas",
  "Bimbingan Konseling",
  "Satuan Pendidikan Ramah Anak",
  "Tim Pendidikan Karakter",
  "Pembina Ekstrakurikuler",
  "Satgas Anti Narkoba",
  "OSIS",
  "MPK",
  "PIKR",
  "KIR",
  "Robotik",
  "Koord. OSN/KSN",
  "PMR dan UKS",
  "Olahraga",
  "Seni",
  "Pecinta Alam",
  "Corps Mubaligh",
  "Pramuka",
  "Laboratorium Komputer",
  "Tim Adiwiyata",
  "Publikasi dan Informasi",
  "Multimedia dan Studio",
  "Guru",
  "Staf Tata Usaha",
  "Pustakawan",
  "Laboran",
  "Petugas UKS",
];

interface TeacherEditDialogProps {
  teacher: GuruProfile | null;
  open: boolean;
  onClose: () => void;
}

export function TeacherEditDialog({
  teacher,
  open,
  onClose,
}: TeacherEditDialogProps) {
  const [form, setForm] = useState<UpdateGuruRequest>({});
  const [
    updateTeacher,
    { isLoading, error, reset },
  ] = useUpdateTeacherMutation();

  useEffect(() => {
    if (teacher) {
      let dobIso = teacher.dob ?? "";
      if (dobIso && dobIso.includes("/")) {
        const [day, month, year] = dobIso.split("/");
        dobIso = `${year}-${month}-${day}`;
      }
      setForm({
        nip: teacher.nip ?? undefined,
        nama_lengkap: teacher.nama_lengkap,
        dob: dobIso || undefined,
        tempat_lahir: teacher.tempat_lahir ?? undefined,
        jenis_kelamin: teacher.jenis_kelamin ?? undefined,
        alamat: teacher.alamat ?? undefined,
        nik: teacher.nik ?? undefined,
        tahun_masuk: teacher.tahun_masuk ?? undefined,
        status_guru: teacher.status_guru,
        kontak: teacher.kontak ?? undefined,
        kewarganegaraan: teacher.kewarganegaraan,
        structural_role: teacher.structural_role,
        mata_pelajaran: teacher.mata_pelajaran,
        pendidikan_terakhir: teacher.pendidikan_terakhir,
      });
    }
  }, [teacher]);

  const handleChange = (
    field: keyof UpdateGuruRequest,
    value: string | number | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForApi = (isoDate: string | undefined): string => {
    if (!isoDate || !isoDate.includes("-")) return isoDate ?? "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    reset();
    const payload = { ...form };
    if (payload.dob) payload.dob = formatDateForApi(payload.dob);
    const result = await updateTeacher({
      guruId: teacher.guru_id,
      body: payload,
    });
    if ("data" in result) onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorMessage =
    error && "data" in error
      ? (() => { const d = (error.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Civitas Akademik</DialogTitle>
        </DialogHeader>
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>NIP</Label>
              <Input
                value={form.nip || ""}
                onChange={(e) => handleChange("nip", e.target.value)}
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
              <Label>NIK</Label>
              <Input
                value={form.nik || ""}
                onChange={(e) => handleChange("nik", e.target.value)}
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
              <Input
                type="date"
                value={form.dob || ""}
                onChange={(e) => handleChange("dob", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Jenis Kelamin</Label>
              <Select
                value={form.jenis_kelamin}
                onValueChange={(val) =>
                  handleChange("jenis_kelamin", val as JenisKelamin)
                }
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
              <Label>Jabatan</Label>
              <Select
                value={form.structural_role}
                onValueChange={(val) => {
                  handleChange("structural_role", val as StructuralRole);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRUCTURAL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mata Pelajaran</Label>
              <Input
                value={form.mata_pelajaran || ""}
                onChange={(e) => handleChange("mata_pelajaran", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Pendidikan Terakhir</Label>
              <Input
                value={form.pendidikan_terakhir || ""}
                onChange={(e) =>
                  handleChange("pendidikan_terakhir", e.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tahun Masuk</Label>
              <Input
                type="number"
                value={form.tahun_masuk || ""}
                onChange={(e) =>
                  handleChange("tahun_masuk", parseInt(e.target.value))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status_guru}
                onValueChange={(val) =>
                  handleChange("status_guru", val as StatusGuru)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
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
                onChange={(e) =>
                  handleChange("kewarganegaraan", e.target.value)
                }
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
