"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreRegisterStudentMutation } from "@/api/students";
import type { PreRegisterStudentRequest } from "@/types/students";

const INITIAL_STATE: PreRegisterStudentRequest = {
  nis: "",
  nama_lengkap: "",
};

export function StudentForm() {
  const [form, setForm] = useState<PreRegisterStudentRequest>({ ...INITIAL_STATE });
  const [preRegister, { isLoading, error, reset }] = usePreRegisterStudentMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (field: keyof PreRegisterStudentRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setSuccessMessage(null);

    // Build payload — only include non-empty optional fields
    const payload: PreRegisterStudentRequest = {
      nis: form.nis,
      nama_lengkap: form.nama_lengkap,
    };
    if (form.kelas_jurusan) payload.kelas_jurusan = form.kelas_jurusan;

    const result = await preRegister(payload);
    if ("data" in result && result.data) {
      setSuccessMessage(result.data.message);
      setForm({ ...INITIAL_STATE });
    }
  };

  const errorMessage =
    error && "data" in error
      ? (() => { const d = (error.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Pre-Register Siswa</h2>
      <p className="text-sm text-muted-foreground">
        Masukkan NIS dan nama siswa. Siswa akan menyelesaikan pendaftaran sendiri melalui halaman registrasi.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="nis">NIS *</Label>
          <Input
            id="nis"
            required
            value={form.nis}
            onChange={(e) => handleChange("nis", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
          <Input
            id="nama_lengkap"
            required
            value={form.nama_lengkap}
            onChange={(e) => handleChange("nama_lengkap", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="kelas_jurusan">Kelas/Jurusan</Label>
          <Input
            id="kelas_jurusan"
            value={form.kelas_jurusan || ""}
            onChange={(e) => handleChange("kelas_jurusan", e.target.value)}
            placeholder="Opsional"
          />
        </div>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-primary font-medium">{successMessage}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Pre-Register Siswa"}
      </Button>
    </form>
  );
}
