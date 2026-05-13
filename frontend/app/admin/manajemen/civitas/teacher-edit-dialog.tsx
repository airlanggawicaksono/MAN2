"use client";

import { useState, useEffect, useMemo } from "react";
import { Ban, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateInputId } from "@/components/ui/date-input-id";
import { formatIsoToApiDmy, normalizeDateToIso } from "@/lib/date-id";
import { getApiErrorMessage } from "@/lib/api-error";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { normalizeDigits, validateWithAlert } from "@/lib/io-guards";
import { teacherEditValidationRules } from "@/lib/form-validators";

interface TeacherEditDialogProps {
  teacher: GuruProfile | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
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
  const [statusNotice, setStatusNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
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
  // All assignable roles (for display)
  const { data: allRoles = [] } = useGetStructuralRolesQuery(
    teacher ? { includeInactive: false, availableOnly: false } : undefined,
    { refetchOnMountOrArgChange: true },
  );
  // Only available (not taken by others) roles
  const { data: availableRoles = [] } = useGetStructuralRolesQuery(
    teacher
      ? { includeInactive: false, availableOnly: true, forUserId: teacher.user_id }
      : undefined,
    { refetchOnMountOrArgChange: true },
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

  const availableRoleNames = useMemo(
    () => new Set(availableRoles.map((r) => r.name)),
    [availableRoles],
  );

  const selectableStructuralRoles = useMemo(() => {
    const names = allRoles.map((r) => r.name);
    if (selectedRole && selectedRole !== NO_ROLE && !names.includes(selectedRole)) {
      names.push(selectedRole);
    }
    return names.sort((a, b) => a.localeCompare(b));
  }, [allRoles, selectedRole]);

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

  const visibleStructuralRoles = filteredStructuralRoles;

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
    const payload = { ...form };
    const nipValue = payload.nip?.trim();
    const nikValue = payload.nik?.trim();
    if (!validateWithAlert(teacherEditValidationRules(payload))) return;
    payload.nip = nipValue || undefined;
    payload.nik = nikValue || undefined;
    reset();
    resetAssignError();
    resetDeactivateError();
    setRoleGuardError(null);
    setStatusNotice(null);
    if (payload.dob) payload.dob = formatDateForApi(payload.dob);
    if (!payload.tahun_masuk) delete payload.tahun_masuk;

    const result = await updateTeacher({
      guruId: teacher.guru_id,
      body: payload,
    });
    if (!("data" in result)) {
      notifyError("Gagal menyimpan data civitas.");
      setStatusNotice({ type: "error", message: "Gagal menyimpan data civitas." });
      return;
    }

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
    const hasRoleChange = selectedRole !== activeRole;

    if (hasRoleChange) {
      let newAssignmentId: string | null = null;
      if (selectedRole !== NO_ROLE) {
        const assignResult = await assignStructuralRole({
          user_id: teacher.user_id,
          structural_role: selectedRole as StructuralRole,
          kelas_id: null,
          is_active: true,
        });
        if (!("data" in assignResult)) {
          notifyError("Profil tersimpan, tapi gagal mengubah jabatan struktural.");
          setStatusNotice({
            type: "error",
            message: "Profil tersimpan, tapi gagal mengubah jabatan struktural.",
          });
          await onSaved?.();
          return;
        }
        if (!assignResult.data) {
          notifyError("Profil tersimpan, tapi data jabatan tidak lengkap.");
          setStatusNotice({
            type: "error",
            message: "Profil tersimpan, tapi data jabatan tidak lengkap.",
          });
          await onSaved?.();
          return;
        }
        newAssignmentId = assignResult.data.assignment_id;
      }

      for (const assignment of activeAssignments) {
        if (newAssignmentId && assignment.assignment_id === newAssignmentId) continue;
        const deactivationResult = await deactivateStructuralAssignment(assignment.assignment_id);
        if (!("data" in deactivationResult)) {
          notifyError("Jabatan baru tersimpan, tapi gagal menonaktifkan jabatan lama.");
          setStatusNotice({
            type: "error",
            message: "Jabatan baru tersimpan, tapi gagal menonaktifkan jabatan lama.",
          });
          await onSaved?.();
          return;
        }
      }
    }

    await onSaved?.();
    const successMessage = hasRoleChange
      ? "Data civitas dan jabatan struktural berhasil diperbarui."
      : "Data civitas berhasil diperbarui.";
    notifySuccess(successMessage);
    setStatusNotice({ type: "success", message: successMessage });
  };

  const handleClose = () => {
    reset();
    resetAssignError();
    resetDeactivateError();
    setRoleGuardError(null);
    setStatusNotice(null);
    onClose();
  };

  const errorMessage = getApiErrorMessage(error);
  const assignErrorMessage = getApiErrorMessage(assignError);
  const deactivateErrorMessage = getApiErrorMessage(deactivateError);
  const activeRoleName =
    teacher?.structural_assignments.find((assignment) => assignment.is_active)?.structural_role ??
    teacher?.structural_assignments.find((assignment) => assignment.is_active)?.role_name ??
    NO_ROLE;

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
        {statusNotice && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              statusNotice.type === "success" && "border-[oklch(var(--chart-3)/0.45)] bg-[oklch(var(--chart-3)/0.12)] text-[oklch(var(--chart-3))]",
              statusNotice.type === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
              statusNotice.type === "info" && "border-border/70 bg-muted text-foreground",
            )}
          >
            {statusNotice.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>NIP</Label>
              <Input
                value={form.nip || ""}
                inputMode="numeric"
                placeholder="Hanya angka"
                onChange={(e) => handleChange("nip", normalizeDigits(e.target.value))}
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
                inputMode="numeric"
                placeholder="Hanya angka"
                onChange={(e) => handleChange("nik", normalizeDigits(e.target.value))}
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
                        setStatusNotice({
                          type: "info",
                          message: "Pilihan jabatan diubah ke 'Tidak ada jabatan'. Klik Simpan Perubahan.",
                        });
                        setRoleOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedRole === NO_ROLE ? "opacity-100" : "opacity-0")} />
                      Tidak ada jabatan
                    </Button>
                    {visibleStructuralRoles.map((roleName) => {
                      const isTaken =
                        !availableRoleNames.has(roleName) &&
                        roleName !== selectedRole;
                      return (
                        <Button
                          key={roleName}
                          type="button"
                          variant="ghost"
                          className="w-full justify-start"
                          disabled={isTaken}
                          onClick={() => {
                            setSelectedRole(roleName);
                            setRoleGuardError(null);
                            setStatusNotice({
                              type: "info",
                              message: `Jabatan dipilih: ${roleName}. Klik Simpan Perubahan.`,
                            });
                            setRoleOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRole === roleName ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="flex items-center gap-2">
                            {roleName}
                            {isTaken && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Ban className="h-3.5 w-3.5" />
                                Dipakai
                              </span>
                            )}
                          </span>
                        </Button>
                      );
                    })}
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
