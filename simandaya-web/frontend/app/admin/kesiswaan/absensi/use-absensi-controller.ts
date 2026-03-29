"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useBulkMarkAttendanceMutation,
  useDeleteAttendanceMutation,
  useGetAttendanceSettingsQuery,
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
  useUpdateAttendanceMutation,
  useUpdateAttendanceSettingsMutation,
} from "@/api/public/absensi";
import {
  useListKelasQuery,
  useListSiswaInKelasQuery,
} from "@/api/shared/akademik";
import type {
  PublicAbsensiResponse,
  UpdateAbsensiRequest,
} from "@/types/absensi";
import { useDebounce } from "@/hooks/useDebounce";

const EMPTY_LIST: never[] = [];
export type AttendanceStatus = NonNullable<UpdateAbsensiRequest["status"]>;
export const STATUS_OPTIONS: AttendanceStatus[] = [
  "Hadir",
  "Izin",
  "Sakit",
  "Alfa",
  "Terlambat",
];

export function useAbsensiController() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [rawSearch, setRawSearch] = useState("");
  const [rawKelasFilter, setRawKelasFilter] = useState("ALL");
  const [bulkKelasId, setBulkKelasId] = useState("");
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [rawMessage, setRawMessage] = useState<string | null>(null);
  const [editingAbsensiId, setEditingAbsensiId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<AttendanceStatus>("Hadir");
  const [lateCutoffInput, setLateCutoffInput] = useState("07:15");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const debouncedRawSearch = useDebounce(rawSearch, 350);

  const {
    data: attendance = [],
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useListPublicAttendanceQuery({
    tanggal,
    search: debouncedRawSearch || undefined,
    limit: 200,
  });
  const {
    data: izin = [],
    isLoading: loadingIzin,
    refetch: refetchIzin,
  } = useListPublicIzinKeluarQuery({
    tanggal,
    limit: 200,
  });
  const { data: classesData } = useListKelasQuery();
  const {
    data: attendanceSettings,
    refetch: refetchAttendanceSettings,
  } = useGetAttendanceSettingsQuery();
  const {
    data: studentsInClassData,
    isLoading: loadingStudents,
  } = useListSiswaInKelasQuery(bulkKelasId, {
    skip: !bulkKelasId,
  });

  const classes = classesData ?? EMPTY_LIST;
  const studentsInClass = studentsInClassData ?? EMPTY_LIST;

  const [bulkMarkAttendance, { isLoading: savingBulk }] =
    useBulkMarkAttendanceMutation();
  const [updateAttendance, { isLoading: savingEdit }] =
    useUpdateAttendanceMutation();
  const [deleteAttendance, { isLoading: deletingAttendance }] =
    useDeleteAttendanceMutation();
  const [updateAttendanceSettings, { isLoading: savingSettings }] =
    useUpdateAttendanceSettingsMutation();

  useEffect(() => {
    if (!attendanceSettings?.late_cutoff_time) return;
    setLateCutoffInput(attendanceSettings.late_cutoff_time.slice(0, 5));
  }, [attendanceSettings]);

  useEffect(() => {
    if (!bulkKelasId || !studentsInClass.length) {
      setSelectedMap((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    const defaultSelected: Record<string, boolean> = {};
    for (const siswa of studentsInClass) {
      defaultSelected[siswa.user_id] = true;
    }
    setSelectedMap(defaultSelected);
  }, [bulkKelasId, studentsInClass]);

  const filteredAttendance = useMemo(() => {
    if (rawKelasFilter === "ALL") return attendance;
    return attendance.filter((row) => (row.kelas ?? "-") === rawKelasFilter);
  }, [attendance, rawKelasFilter]);

  const stats = useMemo(() => {
    const byStatus = {
      Hadir: 0,
      Terlambat: 0,
      Izin: 0,
      Sakit: 0,
      Alfa: 0,
    };
    for (const row of attendance) {
      if (row.status in byStatus) {
        byStatus[row.status as keyof typeof byStatus] += 1;
      }
    }
    return {
      totalAbsen: attendance.length,
      totalIzinKeluar: izin.length,
      byStatus,
    };
  }, [attendance, izin]);

  const selectedCount = useMemo(
    () => Object.values(selectedMap).filter(Boolean).length,
    [selectedMap],
  );

  const startEdit = (row: PublicAbsensiResponse) => {
    setEditingAbsensiId(row.absensi_id);
    setEditingStatus(
      STATUS_OPTIONS.includes(row.status as AttendanceStatus)
        ? (row.status as AttendanceStatus)
        : "Hadir",
    );
    setRawMessage(null);
  };

  const saveEdit = async (absensiId: string) => {
    const result = await updateAttendance({
      absensi_id: absensiId,
      payload: { status: editingStatus },
    });
    if ("error" in result) {
      setRawMessage("Gagal update absensi.");
      return;
    }
    setRawMessage("Record absensi berhasil diupdate.");
    setEditingAbsensiId(null);
    await refetchAttendance();
  };

  const removeRecord = async (absensiId: string) => {
    const ok = window.confirm("Hapus record absensi ini?");
    if (!ok) return;
    const result = await deleteAttendance({ absensi_id: absensiId });
    if ("error" in result) {
      setRawMessage("Gagal hapus absensi.");
      return;
    }
    setRawMessage("Record absensi berhasil dihapus.");
    await refetchAttendance();
  };

  const handleSubmitBulk = async () => {
    if (!bulkKelasId) {
      setBulkMessage("Pilih kelas dulu.");
      return;
    }

    const entries = studentsInClass
      .filter((siswa) => selectedMap[siswa.user_id])
      .map((siswa) => ({
        user_id: siswa.user_id,
        status: "Hadir" as const,
      }));

    if (entries.length === 0) {
      setBulkMessage("Tidak ada siswa yang ditandai masuk.");
      return;
    }

    const result = await bulkMarkAttendance({
      kelas_id: bulkKelasId,
      tanggal,
      entries,
    });

    if ("error" in result) {
      setBulkMessage("Gagal bulk mark. Cek data kelas/siswa atau izin admin.");
      return;
    }

    setBulkMessage(
      `Berhasil: ${result.data.created_count} dibuat, ${result.data.updated_count} diperbarui.`,
    );
    await refetchAttendance();
    await refetchIzin();
  };

  const handleSaveSettings = async () => {
    if (!lateCutoffInput) {
      setSettingsMessage("Isi jam cutoff keterlambatan dulu.");
      return;
    }

    const result = await updateAttendanceSettings({
      late_cutoff_time: `${lateCutoffInput}:00`,
    });
    if ("error" in result) {
      setSettingsMessage("Gagal simpan pengaturan keterlambatan.");
      return;
    }
    setSettingsMessage(
      `Cutoff keterlambatan disimpan: ${result.data.late_cutoff_time.slice(0, 5)}`,
    );
    await refetchAttendanceSettings();
  };

  return {
    bulkKelasId,
    bulkMessage,
    classes,
    deletingAttendance,
    editingAbsensiId,
    editingStatus,
    filteredAttendance,
    handleSaveSettings,
    handleSubmitBulk,
    lateCutoffInput,
    loadingAttendance,
    loadingIzin,
    loadingStudents,
    rawKelasFilter,
    rawMessage,
    rawSearch,
    removeRecord,
    saveEdit,
    savingBulk,
    savingEdit,
    savingSettings,
    selectedCount,
    selectedMap,
    setBulkKelasId,
    setEditingAbsensiId,
    setEditingStatus,
    setLateCutoffInput,
    setRawKelasFilter,
    setRawSearch,
    setSelectedMap,
    settingsMessage,
    startEdit,
    stats,
    studentsInClass,
    tanggal,
    setTanggal,
  };
}

