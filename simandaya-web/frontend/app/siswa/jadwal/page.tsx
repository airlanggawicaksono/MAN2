"use client";

import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { useSiswaJadwalController } from "./use-siswa-jadwal-controller";

export default function SiswaJadwalPage() {
  const { error, gridEvents, isLoading, mounted, totalGuru, totalSesi } =
    useSiswaJadwalController();

  if (!mounted || isLoading) return <div className="p-8 text-center">Memuat jadwal...</div>;
  if (error) return <div className="p-8 text-destructive text-center">Gagal memuat jadwal.</div>;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Jadwal Pelajaran Saya
        </h1>
        <p className="text-slate-500">
          Daftar mata pelajaran Anda untuk semester berjalan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Sesi</p>
          <p className="mt-1 text-2xl font-semibold">{totalSesi}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Guru Terlibat</p>
          <p className="mt-1 text-2xl font-semibold">{totalGuru}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <ScheduleGrid events={gridEvents} />
      </div>
    </div>
  );
}
