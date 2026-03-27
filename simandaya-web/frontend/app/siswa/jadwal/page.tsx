"use client";

import {
  useGetMyJadwalQuery,
} from "@/api/shared/akademik";
import { ScheduleGrid, type ScheduleGridEvent } from "@/components/schedule/schedule-grid";
import type { JadwalResponse } from "@/types/akademik/jadwal";

export default function SiswaJadwalPage() {
  const { data: schedules, isLoading, error } = useGetMyJadwalQuery();

  const displaySchedules: JadwalResponse[] = (schedules ?? []).map((s) => {
    return {
      ...s,
      resolved_mapel_nama: s.mapel_nama,
      resolved_guru_nama: s.guru_nama,
      resolved_jam_mulai: s.jam_mulai?.slice(0, 5),
      resolved_jam_selesai: s.jam_selesai?.slice(0, 5),
    };
  });

  const gridEvents: ScheduleGridEvent[] = displaySchedules
    .filter((s) => !!s.resolved_jam_mulai && !!s.resolved_jam_selesai)
    .map((s) => ({
      id: s.jadwal_id,
      day: s.hari as ScheduleGridEvent["day"],
      start: s.resolved_jam_mulai ?? "07:00",
      end: s.resolved_jam_selesai ?? "08:00",
      title: s.resolved_mapel_nama ?? s.mapel_nama ?? s.mapel?.nama_mapel ?? s.mapel_id,
      subtitle: s.resolved_guru_nama ?? s.guru_nama ?? "-",
    }));

  if (isLoading) return <div className="p-8 text-center">Memuat jadwal...</div>;
  if (error) return <div className="p-8 text-destructive text-center">Gagal memuat jadwal.</div>;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Jadwal Pelajaran Saya
        </h1>
        <p className="text-slate-500">
          Daftar mata pelajaran Anda untuk semester berjalan.
        </p>
      </div>

      <ScheduleGrid events={gridEvents} />
    </div>
  );
}
