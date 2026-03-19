"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useLazyLookupStudentByNisQuery,
  useLazyLookupTeacherByNipQuery,
  useClaimStudentMutation,
  useClaimTeacherMutation,
} from "@/api/usertype/public";
import type {
  StudentLookupResponse,
  TeacherLookupResponse,
} from "@/types/registration";

type Role = "siswa" | "guru";
type Step = 1 | 2 | 3;

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role | null>(null);

  const [nisInput, setNisInput] = useState("");
  const [nipInput, setNipInput] = useState("");
  const [lookupResult, setLookupResult] = useState<StudentLookupResponse | TeacherLookupResponse | null>(null);

  const [lookupStudent, { isFetching: studentLookupFetching }] = useLazyLookupStudentByNisQuery();
  const [lookupTeacher, { isFetching: teacherLookupFetching }] = useLazyLookupTeacherByNipQuery();
  const [claimStudent, { isLoading: claimingStudent }] = useClaimStudentMutation();
  const [claimTeacher, { isLoading: claimingTeacher }] = useClaimTeacherMutation();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetAll = () => {
    setStep(1);
    setRole(null);
    setNisInput("");
    setNipInput("");
    setLookupResult(null);
    setFormData({ username: "", password: "", confirmPassword: "" });
    setError("");
    setSuccess("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetAll();
    onOpenChange(isOpen);
  };

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep(2);
    setNisInput("");
    setNipInput("");
    setLookupResult(null);
    setError("");
  };

  const handleLookup = async () => {
    setError("");
    setLookupResult(null);

    try {
      if (role === "siswa") {
        if (!nisInput.trim()) {
          setError("Masukkan NIS terlebih dahulu.");
          return;
        }
        const result = await lookupStudent(nisInput.trim()).unwrap();
        setLookupResult(result);
      } else {
        if (!nipInput.trim()) {
          setError("Masukkan NIP terlebih dahulu.");
          return;
        }
        const result = await lookupTeacher(nipInput.trim()).unwrap();
        setLookupResult(result);
      }
    } catch (err: any) {
      setError(err.data?.detail || "Data tidak ditemukan. Hubungi admin.");
    }
  };

  const handleConfirmIdentity = () => {
    setStep(3);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    try {
      if (role === "siswa") {
        const result = await claimStudent({
          nis: nisInput.trim(),
          username: formData.username,
          password: formData.password,
        }).unwrap();
        setSuccess(result.message);
      } else {
        const result = await claimTeacher({
          nip: nipInput.trim(),
          username: formData.username,
          password: formData.password,
        }).unwrap();
        setSuccess(result.message);
      }
      setTimeout(() => {
        resetAll();
        onOpenChange(false);
        onSwitchToLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.data?.detail || "Pendaftaran gagal. Silakan coba lagi.");
    }
  };

  const isFetching = studentLookupFetching || teacherLookupFetching;
  const isClaiming = claimingStudent || claimingTeacher;

  const dialogTitle =
    step === 1
      ? "Daftar Akun"
      : step === 2
      ? role === "siswa"
        ? "Masukkan NIS"
        : "Masukkan NIP"
      : "Buat Akun";
  const dialogDesc =
    step === 1
      ? "Pilih jenis akun Anda."
      : step === 2
      ? role === "siswa"
        ? "Masukkan NIS yang diberikan oleh admin sekolah."
        : "Masukkan NIP yang diberikan oleh admin sekolah."
      : "Buat username dan password untuk akun Anda.";

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onInteractOutside={(e: Event) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDesc}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect("siswa")}
                className="rounded-lg border-2 border-input p-4 text-center hover:border-primary transition-colors"
              >
                <p className="font-semibold">Saya Siswa</p>
                <p className="text-xs text-muted-foreground mt-1">Daftar sebagai siswa</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("guru")}
                className="rounded-lg border-2 border-input p-4 text-center hover:border-primary transition-colors"
              >
                <p className="font-semibold">Saya Guru</p>
                <p className="text-xs text-muted-foreground mt-1">Daftar sebagai guru</p>
              </button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToLogin();
                }}
                className="text-primary font-medium hover:underline"
              >
                Masuk
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter NIS/NIP + Lookup */}
        {step === 2 && (
          <div className="space-y-3">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">
                {role === "siswa" ? "NIS (Nomor Induk Siswa)" : "NIP (Nomor Induk Pegawai)"}
              </label>
              <input
                type="text"
                placeholder={role === "siswa" ? "Masukkan NIS..." : "Masukkan NIP..."}
                value={role === "siswa" ? nisInput : nipInput}
                onChange={(e) =>
                  role === "siswa" ? setNisInput(e.target.value) : setNipInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLookup();
                  }
                }}
                className={inputClass}
                autoFocus
                disabled={isFetching}
              />
            </div>

            {/* Lookup result preview */}
            {lookupResult && (
              <div className="rounded-md bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">Data ditemukan:</p>
                <p className="text-sm">
                  <span className="font-medium">Nama:</span>{" "}
                  {lookupResult.nama_lengkap}
                </p>
                {role === "siswa" && "kelas_jurusan" in lookupResult && lookupResult.kelas_jurusan && (
                  <p className="text-sm">
                    <span className="font-medium">Kelas:</span> {lookupResult.kelas_jurusan}
                  </p>
                )}
                {lookupResult.jenis_kelamin && (
                  <p className="text-sm">
                    <span className="font-medium">Jenis Kelamin:</span> {lookupResult.jenis_kelamin}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setNisInput("");
                  setNipInput("");
                  setLookupResult(null);
                  setError("");
                }}
                className="flex-1"
              >
                Kembali
              </Button>
              {!lookupResult ? (
                <Button
                  onClick={handleLookup}
                  disabled={isFetching}
                  className="flex-1"
                >
                  {isFetching ? "Mencari..." : "Cari"}
                </Button>
              ) : (
                <Button onClick={handleConfirmIdentity} className="flex-1">
                  Ini Saya
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Set Username + Password */}
        {step === 3 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
                <p className="text-sm text-primary font-medium">{success}</p>
              </div>
            )}

            {/* Identity summary */}
            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-sm">
                <span className="font-medium">Nama:</span> {lookupResult?.nama_lengkap}
              </p>
              <p className="text-sm">
                <span className="font-medium">{role === "siswa" ? "NIS" : "NIP"}:</span>{" "}
                {role === "siswa" ? nisInput : nipInput}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className={inputClass}
                  disabled={isClaiming || !!success}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className={inputClass}
                  disabled={isClaiming || !!success}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className={inputClass}
                  disabled={isClaiming || !!success}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(2);
                  setError("");
                  setSuccess("");
                }}
                disabled={isClaiming || !!success}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button type="submit" disabled={isClaiming || !!success} className="flex-1">
                {isClaiming ? "Memproses..." : "Daftar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
