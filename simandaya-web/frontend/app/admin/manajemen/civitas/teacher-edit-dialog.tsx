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
import {
  useAssignStructuralRoleMutation,
  useDeactivateStructuralAssignmentMutation,
  useGetStructuralRolesQuery,
} from "@/api/admin/userman";
import type { GuruProfile, UpdateGuruRequest } from "@/types/teachers";
import type {
  JenisKelamin,
  StatusGuru,
  StructuralRole,
} from "@/types/enums";

interface TeacherEditDialogProps {
  teacher: GuruProfile | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function TeacherEditDialog({
  teacher,
  open,
  onClose,
  onSaved,
}: TeacherEditDialogProps) {
  const [form, setForm] = useState<UpdateGuruRequest>({});
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [tahunMasukDate, setTahunMasukDate] = useState<string>("");
  const [
    updateTeacher,
    { isLoading, error, reset },
  ] = useUpdateTeacherMutation();
  const [
    assignStructuralRole,
    { isLoading: isAssigning, error: assignError, reset: resetAssignError },
  ] = useAssignStructuralRoleMutation();
  const [
    deactivateStructuralAssignment,
    { isLoading: isDeactivating, error: deactivateError, reset: resetDeactivateError },
  ] = useDeactivateStructuralAssignmentMutation();
  const { data: structuralRoles = [] } = useGetStructuralRolesQuery(
    teacher
      ? {
          availableOnly: true,
          forUserId: teacher.user_id,
        }
      : undefined,
  );

  const NO_ROLE = "__NONE__";

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
        mata_pelajaran: teacher.mata_pelajaran,
        pendidikan_terakhir: teacher.pendidikan_terakhir,
      });
      setTahunMasukDate(
        teacher.tahun_masuk ? `${teacher.tahun_masuk.toString().padStart(4, "0")}-01-01` : "",
      );
      const activeRole = teacher.structural_assignments.find((assignment) => assignment.is_active);
      setSelectedRole(activeRole?.structural_role ?? NO_ROLE);
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
    resetAssignError();
    resetDeactivateError();
    const payload = { ...form };
    if (payload.dob) payload.dob = formatDateForApi(payload.dob);
    if (!payload.tahun_masuk) delete payload.tahun_masuk;

    const result = await updateTeacher({
      guruId: teacher.guru_id,
      body: payload,
    });
    if ("error" in result) return;

    const activeAssignments = teacher.structural_assignments.filter(
      (assignment) => assignment.is_active,
    );
    const activeRole =
      activeAssignments.find((assignment) => assignment.structural_role)?.structural_role ??
      NO_ROLE;

    if (selectedRole !== activeRole) {
      let newAssignmentId: string | null = null;
      if (selectedRole !== NO_ROLE) {
        const assignResult = await assignStructuralRole({
          user_id: teacher.user_id,
          structural_role: selectedRole as StructuralRole,
          is_active: true,
        });
        if ("error" in assignResult) return;
        newAssignmentId = assignResult.data.assignment_id;
      }

      for (const assignment of activeAssignments) {
        if (newAssignmentId && assignment.assignment_id === newAssignmentId) continue;
        const deactivationResult = await deactivateStructuralAssignment(assignment.assignment_id);
        if ("error" in deactivationResult) return;
      }
    }

    onSaved?.();
    onClose();
  };

  const handleClose = () => {
    reset();
    resetAssignError();
    resetDeactivateError();
    onClose();
  };

  const errorMessage =
    error && "data" in error
      ? (() => { const d = (error.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;
  const assignErrorMessage =
    assignError && "data" in assignError
      ? (() => { const d = (assignError.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;
  const deactivateErrorMessage =
    deactivateError && "data" in deactivateError
      ? (() => { const d = (deactivateError.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
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
        {assignErrorMessage && (
          <p className="text-sm text-destructive">{assignErrorMessage}</p>
        )}
        {deactivateErrorMessage && (
          <p className="text-sm text-destructive">{deactivateErrorMessage}</p>
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
              <Label>Jabatan Struktural</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => {
                  setSelectedRole(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ROLE}>Tidak ada jabatan</SelectItem>
                  {structuralRoles.map((role) => (
                    <SelectItem key={role.role_id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                  {!structuralRoles.some((role) => role.name === selectedRole) &&
                    selectedRole !== NO_ROLE && (
                    <SelectItem key={selectedRole} value={selectedRole}>
                      {selectedRole}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Jabatan Fungsional (Mata Pelajaran)</Label>
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
                type="date"
                value={tahunMasukDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setTahunMasukDate(value);
                  if (!value) {
                    setForm((prev) => {
                      const next = { ...prev };
                      delete next.tahun_masuk;
                      return next;
                    });
                    return;
                  }
                  const [year] = value.split("-");
                  const parsedYear = Number.parseInt(year, 10);
                  if (!Number.isNaN(parsedYear)) {
                    handleChange("tahun_masuk", parsedYear);
                  }
                }}
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
            <Button type="submit" disabled={isLoading || isAssigning || isDeactivating}>
              {isLoading || isAssigning || isDeactivating ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
