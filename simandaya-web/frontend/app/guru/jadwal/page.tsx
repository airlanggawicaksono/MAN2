"use client";

import { useEffect, useState } from "react";
import {
  useGetMyGuruAcademicContextQuery,
  useGetMyJadwalQuery,
} from "@/api/shared/akademik";
import { ScheduleGrid, type ScheduleGridEvent } from "@/components/schedule/schedule-grid";
import type { JadwalResponse } from "@/types/akademik/jadwal";
import { useGuruAcademicContext } from "@/hooks/useGuruAcademicContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GuruJadwalPage() {
  const [mounted, setMounted] = useState(false);
  const { data: context, isLoading: loadingContext } =
    useGetMyGuruAcademicContextQuery(undefined, {
      skip: !mounted,
      refetchOnMountOrArgChange: true,
    });
  const tahunAjaranList = context?.tahun_ajaran ?? [];
  const semesters = context?.semesters ?? [];
  const {
    selectedTahunAjaranId,
    selectedSemesterId,
    setSelectedTahunAjaranId,
    setSelectedSemesterId,
    semesterOptions,
  } = useGuruAcademicContext({
    tahunAjaranList,
    semesters,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: schedules,
    isLoading: loadingSchedules,
    error,
  } = useGetMyJadwalQuery(
    {
      tahunAjaranId: selectedTahunAjaranId || undefined,
      semesterId: selectedSemesterId || undefined,
    },
    {
      skip: !mounted || !selectedTahunAjaranId || !selectedSemesterId,
      refetchOnMountOrArgChange: true,
    },
  );

  const displaySchedules: JadwalResponse[] = (schedules ?? []).map((s) => {
    return {
      ...s,
      resolved_mapel_nama: s.mapel_nama,
      resolved_nama_kelas: s.nama_kelas,
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
      subtitle: s.resolved_nama_kelas ?? s.nama_kelas ?? "-",
    }));
  const totalSesi = gridEvents.length;
  const totalHariAktif = new Set(gridEvents.map((event) => event.day)).size;

  if (!mounted || loadingContext || loadingSchedules)
    return <div className="p-8 text-center">Memuat jadwal mengajar...</div>;
  if (error)
    return (
      <div className="p-8 text-destructive text-center">
        Gagal memuat jadwal.
      </div>
    );

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Jadwal Mengajar
        </h1>
        <p className="text-slate-500">
          Agenda mengajar mingguan berdasarkan tahun ajaran dan semester.
        </p>
        <div className="grid max-w-3xl gap-3 md:grid-cols-2">
          <Select
            value={selectedTahunAjaranId}
            onValueChange={(v) => {
              setSelectedTahunAjaranId(v);
              setSelectedSemesterId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun ajaran" />
            </SelectTrigger>
            <SelectContent>
              {tahunAjaranList.map((ta) => (
                <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                  {ta.nama} {ta.is_active ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih semester" />
            </SelectTrigger>
            <SelectContent>
              {semesterOptions.map((s) => (
                <SelectItem key={s.semester_id} value={s.semester_id}>
                  {s.tipe} {s.is_active ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Sesi</p>
          <p className="mt-1 text-2xl font-semibold">{totalSesi}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Hari Aktif</p>
          <p className="mt-1 text-2xl font-semibold">{totalHariAktif}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <ScheduleGrid events={gridEvents} />
      </div>
    </div>
  );
}
