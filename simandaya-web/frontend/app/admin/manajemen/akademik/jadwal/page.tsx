"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCreateJadwalMutation,
  useCreateSlotWaktuMutation,
  useDeleteJadwalMutation,
  useListActiveGuruMapelQuery,
  useListActiveKelasQuery,
  useListJadwalByKelasQuery,
  useListSlotWaktuQuery,
  useUpdateJadwalMutation,
} from "@/api/shared/akademik";
import type { JadwalResponse } from "@/types/akademik/jadwal";
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
  SCHEDULE_DAYS,
  ScheduleGrid,
  type ScheduleDay,
  type ScheduleGridEvent,
} from "@/components/schedule/schedule-grid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JadwalForm } from "./jadwal-form";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { getApiErrorMessage } from "@/lib/api-error";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

type EditJadwalForm = {
  guru_mapel_id: string;
  hari: ScheduleDay;
  jam_mulai: string;
  jam_selesai: string;
};

export default function ManajemenJadwalPage() {
  const { data: classes } = useListActiveKelasQuery();
  const { data: guruMapelList = [] } = useListActiveGuruMapelQuery();
  const { data: slotWaktuList = [] } = useListSlotWaktuQuery();

  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditJadwalForm>({
    guru_mapel_id: "",
    hari: "Senin",
    jam_mulai: "07:00",
    jam_selesai: "08:00",
  });

  useEffect(() => {
    if (!selectedKelasId) return;
    if (!classes?.some((c) => c.kelas_id === selectedKelasId)) setSelectedKelasId("");
  }, [classes, selectedKelasId]);

  const {
    data: schedules,
    isLoading,
    error,
  } = useListJadwalByKelasQuery(selectedKelasId, { skip: !selectedKelasId });

  const [updateJadwal] = useUpdateJadwalMutation();
  const [createJadwal] = useCreateJadwalMutation();
  const [deleteJadwal] = useDeleteJadwalMutation();
  const [createSlotWaktu] = useCreateSlotWaktuMutation();

  const enrichedSchedules: JadwalResponse[] = useMemo(() => {
    return (schedules ?? []).map((s) => {
      const resolvedKelas = classes?.find((k) => k.kelas_id === s.kelas_id);
      const resolvedSlot = s.slot_waktu_id
        ? slotWaktuList.find((slot) => slot.slot_id === s.slot_waktu_id)
        : undefined;
      const resolvedGuruMapel = guruMapelList.find(
        (gm) =>
          gm.kelas_id === s.kelas_id &&
          gm.mapel_id === s.mapel_id &&
          (!s.guru_user_id || gm.user_id === s.guru_user_id),
      );
      return {
        ...s,
        resolved_mapel_nama: s.mapel_nama,
        resolved_nama_kelas: resolvedKelas?.nama_kelas,
        resolved_guru_nama: resolvedGuruMapel?.guru_nama,
        resolved_jam_mulai: resolvedSlot?.jam_mulai?.slice(0, 5),
        resolved_jam_selesai: resolvedSlot?.jam_selesai?.slice(0, 5),
      };
    });
  }, [schedules, classes, slotWaktuList, guruMapelList]);

  const gridEvents: ScheduleGridEvent[] = useMemo(
    () =>
      enrichedSchedules
        .filter((s) => !!s.resolved_jam_mulai && !!s.resolved_jam_selesai)
        .map((s) => ({
          id: s.jadwal_id,
          day: s.hari as ScheduleDay,
          start: s.resolved_jam_mulai ?? "07:00",
          end: s.resolved_jam_selesai ?? "08:00",
          title: s.resolved_mapel_nama ?? s.mapel?.nama_mapel ?? s.mapel_id,
          subtitle: s.resolved_guru_nama ?? s.guru_nama ?? "-",
        })),
    [enrichedSchedules],
  );

  const rowById = useMemo(() => {
    const map = new Map<string, JadwalResponse>();
    for (const row of enrichedSchedules) map.set(row.jadwal_id, row);
    return map;
  }, [enrichedSchedules]);

  const classAssignments = useMemo(
    () => guruMapelList.filter((gm) => gm.kelas_id === selectedKelasId),
    [guruMapelList, selectedKelasId],
  );

  const ensureSlotWaktu = async (start: string, end: string): Promise<string> => {
    const existing = slotWaktuList.find(
      (slot) => slot.jam_mulai.slice(0, 5) === start && slot.jam_selesai.slice(0, 5) === end,
    );
    if (existing) return existing.slot_id;
    const nextUrutan =
      slotWaktuList.length > 0 ? Math.max(...slotWaktuList.map((s) => s.urutan || 0)) + 1 : 1;
    const created = await createSlotWaktu({
      nama: `Jam ${start}-${end}`,
      jam_mulai: start,
      jam_selesai: end,
      urutan: nextUrutan,
      is_piket: false,
    }).unwrap();
    return created.slot_id;
  };

  const handleMoveResize = async (
    eventId: string,
    next: { day: ScheduleDay; start: string; end: string },
  ) => {
    const row = rowById.get(eventId);
    if (!row) return;
    try {
      const slotId = await ensureSlotWaktu(next.start, next.end);
      await updateJadwal({
        id: row.jadwal_id,
        body: {
          hari: next.day,
          slot_waktu_id: slotId,
        },
      }).unwrap();
      notifySuccess("Jadwal berhasil diperbarui.");
    } catch (err) {
      console.error(err);
      notifyError(getApiErrorMessage(err) || "Gagal memperbarui jadwal.");
    }
  };

  const handleDelete = async (eventId: string) => {
    const row = rowById.get(eventId);
    if (!row) return;
    try {
      await deleteJadwal(row.jadwal_id).unwrap();
      notifySuccess("Jadwal berhasil dihapus.");
    } catch (error) {
      notifyError(getApiErrorMessage(error) || "Gagal menghapus jadwal.");
    }
  };

  const handleCopy = async (eventId: string) => {
    const row = rowById.get(eventId);
    if (!row || !row.guru_user_id || !row.slot_waktu_id) {
      notifyError("Data jadwal tidak lengkap untuk dicopy.");
      return;
    }
    const currentIdx = SCHEDULE_DAYS.indexOf(row.hari as ScheduleDay);
    let lastError: unknown = null;
    for (let i = 1; i <= SCHEDULE_DAYS.length; i += 1) {
      const nextDay = SCHEDULE_DAYS[(Math.max(0, currentIdx) + i) % SCHEDULE_DAYS.length];
      try {
        await createJadwal({
          kelas_id: row.kelas_id,
          mapel_id: row.mapel_id,
          guru_user_id: row.guru_user_id,
          semester_id: row.semester_id,
          hari: nextDay,
          slot_waktu_id: row.slot_waktu_id,
        }).unwrap();
        notifySuccess(`Jadwal berhasil dicopy ke ${nextDay}.`);
        return;
      } catch (error) {
        lastError = error;
        // try next day
      }
    }
    notifyError(
      getApiErrorMessage(lastError) ||
        "Tidak ada hari tersedia untuk copy jadwal (semua bentrok).",
    );
  };

  const handleOpenEdit = (eventId: string) => {
    const row = rowById.get(eventId);
    if (!row) return;
    const matchedAssignment = classAssignments.find(
      (gm) => gm.mapel_id === row.mapel_id && gm.user_id === row.guru_user_id,
    );
    const fallbackAssignment = classAssignments.find((gm) => gm.mapel_id === row.mapel_id) ?? classAssignments[0];
    setEditForm({
      guru_mapel_id: matchedAssignment?.guru_mapel_id ?? fallbackAssignment?.guru_mapel_id ?? "",
      hari: row.hari as ScheduleDay,
      jam_mulai: row.resolved_jam_mulai ?? "07:00",
      jam_selesai: row.resolved_jam_selesai ?? "08:00",
    });
    setEditTargetId(eventId);
  };

  const handleSaveEdit = async () => {
    if (!editTargetId) return;
    const row = rowById.get(editTargetId);
    if (!row) return;
    if (!editForm.guru_mapel_id) {
      notifyError("Pilih penugasan guru-mapel terlebih dahulu.");
      return;
    }
    if (editForm.jam_mulai >= editForm.jam_selesai) {
      notifyError("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }
    if (editForm.jam_selesai > "18:00") {
      notifyError("Batas jam pelajaran maksimal 18:00.");
      return;
    }
    const selectedAssignment = classAssignments.find((gm) => gm.guru_mapel_id === editForm.guru_mapel_id);
    if (!selectedAssignment) {
      notifyError("Penugasan guru-mapel tidak valid.");
      return;
    }

    try {
      const slotId = await ensureSlotWaktu(editForm.jam_mulai, editForm.jam_selesai);
      await updateJadwal({
        id: row.jadwal_id,
        body: {
          hari: editForm.hari,
          slot_waktu_id: slotId,
          mapel_id: selectedAssignment.mapel_id,
          guru_user_id: selectedAssignment.user_id,
        },
      }).unwrap();
      setEditTargetId(null);
      notifySuccess("Jadwal berhasil diperbarui.");
    } catch (error) {
      notifyError(getApiErrorMessage(error) || "Gagal menyimpan perubahan jadwal.");
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Jadwal Pelajaran</h1>
        <p className="text-muted-foreground">
          Atur waktu belajar mengajar untuk setiap kelas dan guru.
        </p>
      </div>

      <JadwalForm />

      <div className="rounded-lg border bg-card">
        <div className="space-y-6 p-6">
          <div className="grid gap-2 min-w-[240px] md:w-[320px]">
            <Label>Filter Berdasarkan Kelas</Label>
            <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.kelas_id} value={c.kelas_id}>
                    {c.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedKelasId ? (
            <p className="rounded-lg border-2 border-dashed py-10 text-center text-muted-foreground">
              Silakan pilih kelas untuk melihat jadwal.
            </p>
          ) : (
            <>
              {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
              {error && (
                <p className="text-destructive">
                  {getApiErrorMessage(error) || "Gagal memuat data jadwal."}
                </p>
              )}
              {!isLoading && !error && (
                <ScheduleGrid
                  events={gridEvents}
                  editable
                  onEventChange={handleMoveResize}
                  onEventDelete={handleDelete}
                  onEventCopy={handleCopy}
                  onEventEdit={handleOpenEdit}
                />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!editTargetId} onOpenChange={(open) => !open && setEditTargetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jadwal</DialogTitle>
            <DialogDescription>
              Ubah penugasan guru/mapel, hari, dan jam pelajaran.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Penugasan Guru-Mapel</Label>
              <Select
                value={editForm.guru_mapel_id}
                onValueChange={(val) => setEditForm((prev) => ({ ...prev, guru_mapel_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penugasan" />
                </SelectTrigger>
                <SelectContent>
                  {classAssignments.map((gm) => (
                    <SelectItem key={gm.guru_mapel_id} value={gm.guru_mapel_id}>
                      {gm.guru_nama} - {gm.mapel_nama} ({gm.kelas_nama})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Hari</Label>
                <Select
                  value={editForm.hari}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, hari: val as ScheduleDay }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI_OPTIONS.map((hari) => (
                      <SelectItem key={hari} value={hari}>
                        {hari}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  min="05:00"
                  max="18:00"
                  value={editForm.jam_mulai}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, jam_mulai: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  min="05:00"
                  max="18:00"
                  value={editForm.jam_selesai}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, jam_selesai: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTargetId(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
