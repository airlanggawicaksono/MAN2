"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateInputId } from "@/components/ui/date-input-id";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JenisKelamin } from "@/types/enums";
import { formatIsoToApiDmy, normalizeDateToIso } from "@/lib/date-id";
import { getApiErrorMessage } from "@/lib/api-error";

export interface ProfileField {
  key: string;
  label: string;
  /** "text" (default), "date", "select" */
  type?: "text" | "date" | "select";
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
  disabled?: boolean;
}

interface ProfileFormCardProps<TProfile, TUpdate extends object> {
  /** The profile data (from query hook) */
  profile: TProfile | undefined;
  /** RTK mutation trigger */
  updateProfile: (payload: TUpdate) => Promise<{ data?: unknown; error?: unknown }>;
  isUpdating: boolean;
  updateError: unknown;
  /** Read-only identifier field at the top (e.g. NIP or NISN) */
  identifierLabel: string;
  identifierValue: string;
  /** Map profile data to form initial values */
  profileToForm: (profile: TProfile) => TUpdate;
  /** Extra fields specific to this role, rendered after common fields */
  extraFields?: ProfileField[];
  /** Transform form before submit (e.g. date formatting) — defaults to dob formatting */
  transformPayload?: (form: TUpdate) => TUpdate;
}

const COMMON_FIELDS: ProfileField[] = [
  { key: "nama_lengkap", label: "Nama Lengkap" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "dob", label: "Tanggal Lahir", type: "date" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: [
      { value: "Laki-Laki", label: "Laki-Laki" },
      { value: "Perempuan", label: "Perempuan" },
    ],
  },
];

const COMMON_BOTTOM_FIELDS: ProfileField[] = [
  { key: "alamat", label: "Alamat", colSpan: 2 },
  { key: "kontak", label: "Kontak" },
  { key: "kewarganegaraan", label: "Kewarganegaraan" },
];

function renderField(
  field: ProfileField,
  value: unknown,
  onChange: (key: string, value: string) => void,
) {
  const strVal = (value as string) ?? "";
  const colClass = field.colSpan === 2 ? "grid gap-2 md:col-span-2" : "grid gap-2";

  if (field.disabled) {
    return (
      <div key={field.key} className={colClass}>
        <Label>{field.label}</Label>
        <Input value={strVal || "-"} disabled />
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div key={field.key} className={colClass}>
        <Label>{field.label}</Label>
        <DateInputId value={strVal} onValueChange={(v) => onChange(field.key, v)} />
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div key={field.key} className={colClass}>
        <Label>{field.label}</Label>
        <Select value={strVal || undefined} onValueChange={(v) => onChange(field.key, v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div key={field.key} className={colClass}>
      <Label>{field.label}</Label>
      <Input value={strVal} onChange={(e) => onChange(field.key, e.target.value)} />
    </div>
  );
}

export function ProfileFormCard<TProfile, TUpdate extends object>({
  profile,
  updateProfile,
  isUpdating,
  updateError,
  identifierLabel,
  identifierValue,
  profileToForm,
  extraFields = [],
  transformPayload,
}: ProfileFormCardProps<TProfile, TUpdate>) {
  const [form, setForm] = useState<TUpdate>({} as TUpdate);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm(profileToForm(profile));
  }, [profile, profileToForm]);

  const errorMessage = getApiErrorMessage(updateError);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    const payload = transformPayload
      ? transformPayload(form)
      : { ...form, dob: formatIsoToApiDmy((form as Record<string, unknown>).dob as string | undefined) } as TUpdate;

    const result = await updateProfile(payload);
    if (result.data !== undefined) setSuccess("Profil berhasil diperbarui.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Saya</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Read-only identifier */}
          <div className="grid gap-2">
            <Label>{identifierLabel}</Label>
            <Input value={identifierValue} disabled />
          </div>

          {/* Common fields */}
          {COMMON_FIELDS.map((field) =>
            renderField(field, (form as Record<string, unknown>)[field.key], handleChange),
          )}

          {/* Role-specific extra fields */}
          {extraFields.map((field) =>
            renderField(field, (form as Record<string, unknown>)[field.key], handleChange),
          )}

          {/* Common bottom fields */}
          {COMMON_BOTTOM_FIELDS.map((field) =>
            renderField(field, (form as Record<string, unknown>)[field.key], handleChange),
          )}

          {errorMessage && <p className="text-sm text-destructive md:col-span-2">{errorMessage}</p>}
          {success && <p className="text-sm text-primary md:col-span-2">{success}</p>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
