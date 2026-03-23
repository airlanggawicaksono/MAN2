"use client";

import { useState } from "react";
import { usePreRegisterTeacherMutation } from "@/api/admin/teachers";
import type { PreRegisterTeacherRequest } from "@/types/teachers";
import { PreRegisterForm } from "@/app/components/admin/pre-register-form";
import { getApiErrorMessage } from "@/lib/api-error";

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

  const errorMessage = getApiErrorMessage(error);

  return (
    <PreRegisterForm
      title="Pre-Register Civitas Akademik"
      description="Masukkan NIP dan nama guru/staf. Mereka akan menyelesaikan pendaftaran sendiri melalui halaman registrasi."
      primaryIdLabel="NIP"
      primaryIdName="nip"
      primaryIdValue={form.nip}
      fullNameValue={form.nama_lengkap}
      submitLabel="Pre-Register Civitas"
      submittingLabel="Menyimpan..."
      isLoading={isLoading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onChange={(field, value) => {
        if (field === "primaryId") handleChange("nip", value);
        if (field === "fullName") handleChange("nama_lengkap", value);
      }}
      onSubmit={handleSubmit}
    />
  );
}
