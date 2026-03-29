"use client";

import { useEffect, useMemo, useState } from "react";
import { useGetMyJadwalQuery } from "@/api/shared/akademik";
import type { JadwalResponse } from "@/types/akademik/jadwal";
import type { ScheduleGridEvent } from "@/components/schedule/schedule-grid";

export function useSiswaJadwalController() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: schedules, isLoading, error } = useGetMyJadwalQuery(undefined, {
    skip: !mounted,
    refetchOnMountOrArgChange: true,
  });

  const displaySchedules: JadwalResponse[] = useMemo(
    () =>
      (schedules ?? []).map((s) => ({
        ...s,
        resolved_mapel_nama: s.mapel_nama,
        resolved_guru_nama: s.guru_nama,
        resolved_jam_mulai: s.jam_mulai?.slice(0, 5),
        resolved_jam_selesai: s.jam_selesai?.slice(0, 5),
      })),
    [schedules],
  );

  const gridEvents: ScheduleGridEvent[] = useMemo(
    () =>
      displaySchedules
        .filter((s) => !!s.resolved_jam_mulai && !!s.resolved_jam_selesai)
        .map((s) => ({
          id: s.jadwal_id,
          day: s.hari as ScheduleGridEvent["day"],
          start: s.resolved_jam_mulai ?? "07:00",
          end: s.resolved_jam_selesai ?? "08:00",
          title: s.resolved_mapel_nama ?? s.mapel_nama ?? s.mapel?.nama_mapel ?? s.mapel_id,
          subtitle: s.resolved_guru_nama ?? s.guru_nama ?? "-",
        })),
    [displaySchedules],
  );

  const totalSesi = gridEvents.length;
  const totalGuru = useMemo(
    () =>
      new Set(
        gridEvents
          .map((event) => event.subtitle)
          .filter((value): value is string => !!value && value !== "-"),
      ).size,
    [gridEvents],
  );

  return {
    error,
    gridEvents,
    isLoading,
    mounted,
    totalGuru,
    totalSesi,
  };
}

