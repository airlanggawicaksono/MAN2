"use client";

import { useEffect, useState } from "react";
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
  useListActiveSemestersQuery,
  useListActiveGuruMapelQuery,
  useListSlotWaktuQuery,
  useCreateSlotWaktuMutation,
} from "@/api/shared/akademik";
import type { CreateJadwalRequest } from "@/types/akademik/jadwal";
import { getApiErrorMessage } from "@/lib/api-error";
import { notifyError, notifySuccess } from "@/lib/app-notify";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
type JadwalFormState = {
  semester_id?: string;
  kelas_id?: string;
  mapel_id?: string;
  guru_id?: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
};

export function JadwalForm() {
  const [form, setForm] = useState<JadwalFormState>({
    hari: "Senin",
    jam_mulai: "07:00",
    jam_selesai: "08:00",
  });

  const { data: semesters } = useListActiveSemestersQuery();
  const { data: filteredAssignments = [] } = useListActiveGuruMapelQuery();
  const { data: slotWaktu = [] } = useListSlotWaktuQuery();
  const [createJadwal, { isLoading, error, reset }] = useCreateJadwalMutation();
  const [createSlotWaktu] = useCreateSlotWaktuMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  useEffect(() => {
    if (!selectedAssignmentId) return;
    if (!filteredAssignments.some((a) => a.guru_mapel_id === selectedAssignmentId)) {
      setSelectedAssignmentId("");
      setForm((prev) => ({
        ...prev,
        guru_id: undefined,
        mapel_id: undefined,
        kelas_id: undefined,
      }));
    }
  }, [filteredAssignments, selectedAssignmentId]);

  useEffect(() => {
    if (!semesters?.length) return;
    setForm((prev) => {
      if (prev.semester_id && semesters.some((s) => s.semester_id === prev.semester_id)) {
        return prev;
      }
      return { ...prev, semester_id: semesters[0].semester_id };
    });
  }, [semesters]);

  const handleChange = (field: keyof JadwalFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignmentChange = (val: string) => {
    setSelectedAssignmentId(val);
    const ass = filteredAssignments.find((a) => a.guru_mapel_id === val);
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
    if (form.jam_mulai >= form.jam_selesai) {
      notifyError("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }
    if (form.jam_selesai > "18:00") {
      notifyError("Batas jam pelajaran maksimal 18:00.");
      return;
    }
    let matchingSlot = slotWaktu.find(
      (s) => s.jam_mulai.slice(0, 5) === form.jam_mulai && s.jam_selesai.slice(0, 5) === form.jam_selesai,
    );
    if (!matchingSlot) {
      const nextUrutan =
        slotWaktu.length > 0 ? Math.max(...slotWaktu.map((s) => s.urutan || 0)) + 1 : 1;
      try {
        matchingSlot = await createSlotWaktu({
          nama: `Jam ${form.jam_mulai}-${form.jam_selesai}`,
          jam_mulai: form.jam_mulai,
          jam_selesai: form.jam_selesai,
          urutan: nextUrutan,
          is_piket: false,
        }).unwrap();
      } catch (error) {
        notifyError(getApiErrorMessage(error) || "Gagal membuat slot waktu otomatis.");
        return;
      }
    }

    reset();
    setSuccessMessage(null);

    const payload: CreateJadwalRequest = {
      kelas_id: form.kelas_id,
      mapel_id: form.mapel_id,
      guru_user_id: form.guru_id,
      semester_id: form.semester_id,
      hari: form.hari,
      slot_waktu_id: matchingSlot.slot_id,
    };

    try {
      await createJadwal(payload).unwrap();
      setSuccessMessage("Jadwal berhasil ditambahkan.");
      notifySuccess("Jadwal berhasil ditambahkan.");
    } catch (error) {
      notifyError(getApiErrorMessage(error) || "Gagal menambahkan jadwal.");
    }
  };

  const errorMessage = getApiErrorMessage(error);

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
              {filteredAssignments.map((a) => (
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
            min="05:00"
            max="18:00"
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
            min="05:00"
            max="18:00"
            value={form.jam_selesai}
            onChange={(e) => handleChange("jam_selesai", e.target.value)}
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
