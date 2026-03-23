"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useListTeachersQuery, useUpdateTeacherMutation } from "@/api/admin/teachers";
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
import { ASSIGNABLE_STRUCTURAL_ROLE_OPTIONS } from "@/types/enums";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateInputId } from "@/components/ui/date-input-id";
import { formatIsoToApiDmy, normalizeDateToIso } from "@/lib/date-id";
import { getApiErrorMessage } from "@/lib/api-error";

const NON_ASSIGNABLE_STRUCTURAL_ROLE_NAMES = new Set<string>([
  "Tim IT",
  "Pengembang Madrasah",
  "Kepala Laboratorium Terpadu",
  "Wali Kelas",
  "Bimbingan Konseling",
  "Satuan Pendidikan Ramah Anak",
  "Tim Pendidikan Karakter",
  "Tim Penjaminan Karakter",
  "Pembina Ekstrakurikuler",
  "Laboratorium Komputer",
  "Publikasi dan Informasi",
  "Multimedia dan Studio",
  "Tim Adiwiyata",
  "Satgas Anti Narkoba",
  "OSIS",
  "MPK",
  "PIKR",
  "KIR",
  "Robotik",
  "Koord. OSN/KSN",
  "Koord. OSN/KSM",
  "PMR dan UKS",
  "Olahraga",
  "Seni",
  "Pecinta Alam",
  "Corps Mubaligh",
  "Pramuka",
  "Staf Tata Usaha",
  "Pustakawan",
  "Laboran",
  "Petugas UKS",
  "Guru",
]);

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
  const [roleSearch, setRoleSearch] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleGuardError, setRoleGuardError] = useState<string | null>(null);
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
  const { data: teachersData } = useListTeachersQuery({
    skip: 0,
    limit: 100,
  });
  const {
    data: structuralRoles = [],
    refetch: refetchStructuralRoles,
  } = useGetStructuralRolesQuery(
    teacher
      ? {
          includeInactive: false,
          availableOnly: true,
          forUserId: teacher.user_id,
        }
      : undefined,
  );

  const NO_ROLE = "__NONE__";

  useEffect(() => {
    if (teacher) {
      const dobIso = normalizeDateToIso(teacher.dob);
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
      const activeRole = teacher.structural_assignments.find(
        (assignment) => assignment.is_active,
      );
      const activeRoleName =
        activeRole?.structural_role ?? activeRole?.role_name ?? NO_ROLE;
      setSelectedRole(
        activeRoleName === "Wali Kelas" ? NO_ROLE : activeRoleName,
      );
      setRoleSearch("");
    }
  }, [teacher]);

  const lcsLength = (a: string, b: string): number => {
    const n = a.length;
    const m = b.length;
    if (!n || !m) return 0;
    const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
    for (let i = 1; i <= n; i += 1) {
      for (let j = 1; j <= m; j += 1) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp[n][m];
  };

  const takenRoleNames = useMemo(() => {
    if (!teacher || !teachersData?.items?.length) return new Set<string>();
    const taken = new Set<string>();
    for (const teacherItem of teachersData.items) {
      if (teacherItem.user_id === teacher.user_id) continue;
      const activeRoles = teacherItem.structural_assignments
        .filter((assignment) => assignment.is_active)
        .map((assignment) => assignment.structural_role ?? assignment.role_name)
        .filter((role): role is string => Boolean(role));
      for (const roleName of activeRoles) {
        taken.add(roleName);
      }
    }
    return taken;
  }, [teachersData?.items, teacher]);

  const selectableStructuralRoles = useMemo(() => {
    const apiNames = structuralRoles.map((role) => role.name).filter(Boolean);
    // Prefer backend catalog as source of truth; fallback to local options if catalog is empty.
    const backendFirst = apiNames.length > 0 ? apiNames : [...ASSIGNABLE_STRUCTURAL_ROLE_OPTIONS];
    const merged = Array.from(new Set<string>(backendFirst));
    if (selectedRole && selectedRole !== NO_ROLE && !merged.includes(selectedRole)) {
      merged.push(selectedRole);
    }
    return merged
      .filter((roleName) => !NON_ASSIGNABLE_STRUCTURAL_ROLE_NAMES.has(roleName))
      .filter((roleName) => !takenRoleNames.has(roleName) || roleName === selectedRole)
      .sort((a, b) => a.localeCompare(b));
  }, [structuralRoles, selectedRole, takenRoleNames]);

  const filteredStructuralRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return selectableStructuralRoles;
    const scored = selectableStructuralRoles
      .map((roleName) => {
        const text = roleName.toLowerCase();
        const score = lcsLength(query, text);
        return { roleName, score, textIncludes: text.includes(query) };
      })
      .filter((item) => item.score > 0 || item.textIncludes)
      .sort((a, b) => {
        if (a.textIncludes !== b.textIncludes) return a.textIncludes ? -1 : 1;
        if (a.score !== b.score) return b.score - a.score;
        return a.roleName.localeCompare(b.roleName);
      });
    return scored.map((item) => item.roleName);
  }, [selectableStructuralRoles, roleSearch]);

  const visibleStructuralRoles = useMemo(() => {
    if (!selectedRole || selectedRole === NO_ROLE) return filteredStructuralRoles;
    return filteredStructuralRoles.filter((roleName) => roleName !== selectedRole);
  }, [filteredStructuralRoles, selectedRole]);

  const handleChange = (
    field: keyof UpdateGuruRequest,
    value: string | number | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForApi = (isoDate: string | undefined): string => {
    return formatIsoToApiDmy(isoDate) ?? "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    reset();
    resetAssignError();
    resetDeactivateError();
    setRoleGuardError(null);
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
    const activeCurrentAssignment = activeAssignments.find(
      (assignment) => assignment.structural_role || assignment.role_name,
    );
    const activeRole =
      activeCurrentAssignment?.structural_role ??
      activeCurrentAssignment?.role_name ??
      NO_ROLE;

    if (selectedRole !== activeRole) {
      let newAssignmentId: string | null = null;
      if (selectedRole !== NO_ROLE) {
        if (NON_ASSIGNABLE_STRUCTURAL_ROLE_NAMES.has(selectedRole)) {
          setRoleGuardError(
            "Jabatan tersebut tidak dapat di-assign. Pilih jabatan struktural yang assignable.",
          );
          return;
        }
        // Re-check right before submit to avoid stale options in long-open dialog.
        const latest = await refetchStructuralRoles();
        const latestNames = (latest.data ?? structuralRoles).map((role) => role.name);
        if (!latestNames.includes(selectedRole)) {
          setRoleGuardError(
            "Jabatan sudah dipakai/berubah oleh user lain. Silakan pilih ulang jabatan.",
          );
          return;
        }
        const assignResult = await assignStructuralRole({
          user_id: teacher.user_id,
          structural_role: selectedRole as StructuralRole,
          kelas_id: null,
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
    setRoleGuardError(null);
    onClose();
  };

  const errorMessage = getApiErrorMessage(error);
  const assignErrorMessage = getApiErrorMessage(assignError);
  const deactivateErrorMessage = getApiErrorMessage(deactivateError);

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
        {roleGuardError && (
          <p className="text-sm text-destructive">{roleGuardError}</p>
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
              <DateInputId
                value={form.dob || ""}
                onValueChange={(value) => handleChange("dob", value)}
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
              <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={roleOpen}
                    className="w-full justify-between"
                  >
                    {selectedRole === NO_ROLE || !selectedRole
                      ? "Pilih jabatan struktural"
                      : selectedRole}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-2"
                  align="start"
                >
                  <Input
                    placeholder="Cari jabatan..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="mb-2"
                  />
                  <div
                    className="h-64 overflow-y-auto overscroll-contain pr-1"
                    onWheel={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedRole(NO_ROLE);
                        setRoleOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedRole === NO_ROLE ? "opacity-100" : "opacity-0")} />
                      Tidak ada jabatan
                    </Button>
                    {visibleStructuralRoles.map((roleName) => (
                      <Button
                        key={roleName}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedRole(roleName);
                          setRoleOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRole === roleName ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {roleName}
                      </Button>
                    ))}
                    {visibleStructuralRoles.length === 0 && (
                      <p className="px-2 py-1 text-sm text-muted-foreground">Tidak ada hasil</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
              <DateInputId
                value={tahunMasukDate}
                onValueChange={(value) => {
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
