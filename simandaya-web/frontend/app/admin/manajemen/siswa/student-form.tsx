"use client";

import { useState } from "react";
import { usePreRegisterStudentMutation } from "@/api/admin/students";
import { PreRegisterForm } from "@/app/components/admin/pre-register-form";
import { getApiErrorMessage } from "@/lib/api-error";
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

    const payload: PreRegisterStudentRequest = {
      nis: form.nis,
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
      title="Pre-Register Siswa"
      description="Masukkan NIS dan nama siswa. Penempatan kelas dikelola dari menu Akademik > Kelas."
      primaryIdLabel="NIS"
      primaryIdName="nis"
      primaryIdValue={form.nis}
      fullNameValue={form.nama_lengkap}
      submitLabel="Pre-Register Siswa"
      submittingLabel="Menyimpan..."
      isLoading={isLoading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onChange={(field, value) => {
        if (field === "primaryId") handleChange("nis", value);
        if (field === "fullName") handleChange("nama_lengkap", value);
      }}
      onSubmit={handleSubmit}
    />
  );
}
