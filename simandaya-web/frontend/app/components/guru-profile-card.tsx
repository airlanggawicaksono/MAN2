"use client";

import { useCallback } from "react";
import {
  useGetMyTeacherProfileQuery,
  useUpdateMyTeacherProfileMutation,
} from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import type { UpdateGuruRequest } from "@/types/teachers";
import { normalizeDateToIso, formatIsoToApiDmy } from "@/lib/date-id";
import { ProfileFormCard, type ProfileField } from "./profile-form-card";

const EXTRA_FIELDS: ProfileField[] = [
  { key: "nik", label: "NIK" },
  { key: "mata_pelajaran", label: "Mata Pelajaran" },
  { key: "pendidikan_terakhir", label: "Pendidikan Terakhir" },
];

export function GuruProfileCard() {
  const { data: profile } = useGetMyTeacherProfileQuery();
  const [updateMyProfile, { isLoading, error }] = useUpdateMyTeacherProfileMutation();

  const profileToForm = useCallback(
    (p: GuruProfile): UpdateGuruRequest => ({
      nama_lengkap: p.nama_lengkap ?? undefined,
      dob: normalizeDateToIso(p.dob),
      tempat_lahir: p.tempat_lahir ?? undefined,
      jenis_kelamin: p.jenis_kelamin ?? undefined,
      alamat: p.alamat ?? undefined,
      nik: p.nik ?? undefined,
      kontak: p.kontak ?? undefined,
      kewarganegaraan: p.kewarganegaraan ?? undefined,
      mata_pelajaran: p.mata_pelajaran ?? undefined,
      pendidikan_terakhir: p.pendidikan_terakhir ?? undefined,
    }),
    [],
  );

  const transformPayload = useCallback(
    (form: UpdateGuruRequest): UpdateGuruRequest => ({
      ...form,
      dob: formatIsoToApiDmy(form.dob),
    }),
    [],
  );

  const handleUpdate = useCallback(
    async (payload: UpdateGuruRequest) => {
      const result = await updateMyProfile(payload);
      return "data" in result ? { data: result.data } : { error: result.error };
    },
    [updateMyProfile],
  );

  return (
    <ProfileFormCard<GuruProfile, UpdateGuruRequest>
      profile={profile}
      updateProfile={handleUpdate}
      isUpdating={isLoading}
      updateError={error}
      identifierLabel="NIP"
      identifierValue={profile?.nip ?? "-"}
      profileToForm={profileToForm}
      extraFields={EXTRA_FIELDS}
      transformPayload={transformPayload}
    />
  );
}
