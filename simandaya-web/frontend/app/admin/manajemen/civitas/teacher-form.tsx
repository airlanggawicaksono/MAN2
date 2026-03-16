"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreRegisterTeacherMutation } from "@/api/teachers";
import type { PreRegisterTeacherRequest } from "@/types/teachers";

const INITIAL_STATE: PreRegisterTeacherRequest = {
  nip: "",
  nama_lengkap: "",
};

export function TeacherForm() {
  const [form, setForm] = useState<PreRegisterTeacherRequest>({ ...INITIAL_STATE });
  const [preRegister, { isLoading, error, reset }] = usePreRegisterTeacherMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (field: keyof PreRegisterTeacherRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setSuccessMessage(null);

    const payload: PreRegisterTeacherRequest = {
      nip: form.nip,
      nama_lengkap: form.nama_lengkap,
    };

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
      <h2 className="text-lg font-semibold">Pre-Register Civitas Akademik</h2>
      <p className="text-sm text-muted-foreground">
        Masukkan NIP dan nama guru/staf. Mereka akan menyelesaikan pendaftaran sendiri melalui halaman registrasi.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nip">NIP *</Label>
          <Input
            id="nip"
            required
            value={form.nip}
            onChange={(e) => handleChange("nip", e.target.value)}
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
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-primary font-medium">{successMessage}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Pre-Register Civitas"}
      </Button>
    </form>
  );
}
