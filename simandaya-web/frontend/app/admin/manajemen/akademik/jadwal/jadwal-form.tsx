"use client";

import { useState } from "react";
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
  useCreateJadwalMutation, 
  useListKelasQuery, 
  useListSemestersQuery,
  useListGuruMapelQuery
} from "@/api/shared/akademik";
import type { CreateJadwalRequest } from "@/types/akademik/jadwal";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function JadwalForm() {
  const [form, setForm] = useState<Partial<CreateJadwalRequest>>({
    hari: "Senin",
    jam_mulai: "07:00",
    jam_selesai: "08:00",
  });
  
  const { data: classes } = useListKelasQuery();
  const { data: semesters } = useListSemestersQuery();
  const { data: assignments } = useListGuruMapelQuery();
  const [createJadwal, { isLoading, error, reset }] = useCreateJadwalMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const handleChange = (field: keyof CreateJadwalRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignmentChange = (val: string) => {
    setSelectedAssignmentId(val);
    const ass = assignments?.find(a => a.guru_mapel_id === val);
    if (ass) {
      setForm(prev => ({
        ...prev,
        guru_id: ass.user_id,
        mapel_id: ass.mapel_id,
        kelas_id: ass.kelas_id,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kelas_id || !form.mapel_id || !form.guru_id || !form.semester_id) return;
    
    reset();
    setSuccessMessage(null);

    const result = await createJadwal(form as CreateJadwalRequest);
    if ("data" in result && result.data) {
      setSuccessMessage("Jadwal berhasil ditambahkan.");
    }
  };

  const errorMessage =
    error && "data" in error
      ? (() => { const d = (error.data as { detail?: unknown })?.detail; return typeof d === "string" ? d : Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : undefined; })()
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Tambah Entri Jadwal Baru</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="semester_id">Semester *</Label>
          <Select
            value={form.semester_id}
            onValueChange={(val) => handleChange("semester_id", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters?.map((s) => (
                <SelectItem key={s.semester_id} value={s.semester_id}>
                  {s.tipe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="assignment">Penugasan Guru (Guru - Mapel - Kelas) *</Label>
          <Select
            value={selectedAssignmentId}
            onValueChange={handleAssignmentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Penugasan" />
            </SelectTrigger>
            <SelectContent>
              {assignments?.map((a) => (
                <SelectItem key={a.guru_mapel_id} value={a.guru_mapel_id}>
                  {a.guru_nama} - {a.mapel_nama} ({a.kelas_nama})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="hari">Hari *</Label>
          <Select
            value={form.hari}
            onValueChange={(val) => handleChange("hari", val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HARI.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="jam_mulai">Jam Mulai *</Label>
          <Input
            id="jam_mulai"
            type="time"
            required
            value={form.jam_mulai}
            onChange={(e) => handleChange("jam_mulai", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="jam_selesai">Jam Selesai *</Label>
          <Input
            id="jam_selesai"
            type="time"
            required
            value={form.jam_selesai}
            onChange={(e) => handleChange("jam_selesai", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ruangan">Ruangan</Label>
          <Input
            id="ruangan"
            placeholder="Contoh: R.101"
            value={form.ruangan || ""}
            onChange={(e) => handleChange("ruangan", e.target.value)}
          />
        </div>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-primary font-medium">{successMessage}</p>}

      <Button type="submit" disabled={isLoading || !form.semester_id || !selectedAssignmentId}>
        {isLoading ? "Menyimpan..." : "Simpan Jadwal"}
      </Button>
    </form>
  );
}
