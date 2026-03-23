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
import {
  useGetMyStudentProfileQuery,
  useUpdateMyStudentProfileMutation,
} from "@/api/admin/students";
import type { UpdateStudentRequest } from "@/types/students";
import type { JenisKelamin } from "@/types/enums";
import { formatIsoToApiDmy, normalizeDateToIso } from "@/lib/date-id";
import { getApiErrorMessage } from "@/lib/api-error";

export function SiswaProfileCard() {
  const { data: profile } = useGetMyStudentProfileQuery();
  const [updateMyProfile, { isLoading, error }] = useUpdateMyStudentProfileMutation();
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateStudentRequest>({});

  useEffect(() => {
    if (!profile) return;
    setForm({
      nama_lengkap: profile.nama_lengkap ?? undefined,
      dob: normalizeDateToIso(profile.dob),
      tempat_lahir: profile.tempat_lahir ?? undefined,
      jenis_kelamin: profile.jenis_kelamin ?? undefined,
      alamat: profile.alamat ?? undefined,
      nama_wali: profile.nama_wali ?? undefined,
      kelas_jurusan: profile.kelas_jurusan ?? undefined,
      kontak: profile.kontak ?? undefined,
      kewarganegaraan: profile.kewarganegaraan ?? undefined,
    });
  }, [profile]);

  const errorMessage = getApiErrorMessage(error);

  const handleChange = (field: keyof UpdateStudentRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    const payload: UpdateStudentRequest = {
      ...form,
      dob: formatIsoToApiDmy(form.dob),
    };

    const result = await updateMyProfile(payload);
    if ("data" in result) setSuccess("Profil berhasil diperbarui.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Saya</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>NIS</Label>
            <Input value={profile?.nis ?? "-"} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Nama Lengkap</Label>
            <Input
              value={form.nama_lengkap ?? ""}
              onChange={(e) => handleChange("nama_lengkap", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Tempat Lahir</Label>
            <Input
              value={form.tempat_lahir ?? ""}
              onChange={(e) => handleChange("tempat_lahir", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Tanggal Lahir</Label>
            <DateInputId value={form.dob ?? ""} onValueChange={(value) => handleChange("dob", value)} />
          </div>
          <div className="grid gap-2">
            <Label>Jenis Kelamin</Label>
            <Select
              value={form.jenis_kelamin}
              onValueChange={(val) => handleChange("jenis_kelamin", val as JenisKelamin)}
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
          <div className="grid gap-2">
            <Label>Nama Wali</Label>
            <Input
              value={form.nama_wali ?? ""}
              onChange={(e) => handleChange("nama_wali", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Kelas/Jurusan</Label>
            <Input
              value={form.kelas_jurusan ?? ""}
              onChange={(e) => handleChange("kelas_jurusan", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Kontak</Label>
            <Input
              value={form.kontak ?? ""}
              onChange={(e) => handleChange("kontak", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Kewarganegaraan</Label>
            <Input
              value={form.kewarganegaraan ?? ""}
              onChange={(e) => handleChange("kewarganegaraan", e.target.value)}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Alamat</Label>
            <Input
              value={form.alamat ?? ""}
              onChange={(e) => handleChange("alamat", e.target.value)}
            />
          </div>
          {errorMessage && <p className="text-sm text-destructive md:col-span-2">{errorMessage}</p>}
          {success && <p className="text-sm text-primary md:col-span-2">{success}</p>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
