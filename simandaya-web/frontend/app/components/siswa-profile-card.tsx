"use client";

import { useCallback } from "react";
import {
  useGetMyStudentProfileQuery,
  useUpdateMyStudentProfileMutation,
} from "@/api/admin/students";
import type { StudentProfile, UpdateStudentRequest } from "@/types/students";
import { normalizeDateToIso, formatIsoToApiDmy } from "@/lib/date-id";
import { ProfileFormCard, type ProfileField } from "./profile-form-card";
import { Card, CardContent } from "@/components/ui/card";

const EXTRA_FIELDS: ProfileField[] = [
  { key: "nama_wali", label: "Nama Wali" },
  { key: "kelas_jurusan", label: "Kelas/Jurusan" },
];

export function SiswaProfileCard() {
  const { data: profile } = useGetMyStudentProfileQuery();
  const [updateMyProfile, { isLoading, error }] = useUpdateMyStudentProfileMutation();

  const profileToForm = useCallback(
    (p: StudentProfile): UpdateStudentRequest => ({
      nama_lengkap: p.nama_lengkap ?? undefined,
      dob: normalizeDateToIso(p.dob),
      tempat_lahir: p.tempat_lahir ?? undefined,
      jenis_kelamin: p.jenis_kelamin ?? undefined,
      alamat: p.alamat ?? undefined,
      nama_wali: p.nama_wali ?? undefined,
      kelas_jurusan: p.kelas_jurusan ?? undefined,
      kontak: p.kontak ?? undefined,
      kewarganegaraan: p.kewarganegaraan ?? undefined,
    }),
    [],
  );

  const transformPayload = useCallback(
    (form: UpdateStudentRequest): UpdateStudentRequest => ({
      ...form,
      dob: formatIsoToApiDmy(form.dob),
    }),
    [],
  );

  const handleUpdate = useCallback(
    async (payload: UpdateStudentRequest) => {
      const result = await updateMyProfile(payload);
      return "data" in result ? { data: result.data } : { error: result.error };
    },
    [updateMyProfile],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border px-2 py-1">Kelas Aktif: {profile?.kelas_nama || "-"}</span>
            <span className="rounded-md border px-2 py-1">
              Semester Aktif: {profile?.semester_aktif_tipe || "-"}
            </span>
            <span className="rounded-md border px-2 py-1">Semester Ke: {profile?.semester_ke ?? "-"}</span>
          </div>
        </CardContent>
      </Card>
      <ProfileFormCard<StudentProfile, UpdateStudentRequest>
        profile={profile}
        updateProfile={handleUpdate}
        isUpdating={isLoading}
        updateError={error}
        identifierLabel="NIS"
        identifierValue={profile?.nis ?? "-"}
        profileToForm={profileToForm}
        extraFields={EXTRA_FIELDS}
        transformPayload={transformPayload}
      />
    </div>
  );
}
