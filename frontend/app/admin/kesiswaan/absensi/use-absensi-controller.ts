"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useDeleteAttendanceMutation,
  useGetAttendanceSettingsQuery,
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
  useUpdateAttendanceMutation,
  useUpdateAttendanceSettingsMutation,
} from "@/api/public/absensi";
import type {
  PublicAbsensiResponse,
  UpdateAbsensiRequest,
} from "@/types/absensi";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [rawMessage, setRawMessage] = useState<string | null>(null);
  const [editingAbsensiId, setEditingAbsensiId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<AttendanceStatus>("Hadir");
  const [editingTimeIn, setEditingTimeIn] = useState<string>("");
  const [editingTimeOut, setEditingTimeOut] = useState<string>("");
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
  const {
    data: attendanceSettings,
    refetch: refetchAttendanceSettings,
  } = useGetAttendanceSettingsQuery();

  const [updateAttendance, { isLoading: savingEdit }] =
    useUpdateAttendanceMutation();
  const [deleteAttendance, { isLoading: deletingAttendance }] =
    useDeleteAttendanceMutation();
  const [deleteAttendanceBulk, { isLoading: deletingBulk }] =
    useDeleteAttendanceMutation();
  const [updateAttendanceSettings, { isLoading: savingSettings }] =
    useUpdateAttendanceSettingsMutation();

  useEffect(() => {
    if (!attendanceSettings?.late_cutoff_time) return;
    setLateCutoffInput(attendanceSettings.late_cutoff_time);
  }, [attendanceSettings]);

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

  const startEdit = (row: PublicAbsensiResponse) => {
    setEditingAbsensiId(row.absensi_id);
    setEditingStatus(
      STATUS_OPTIONS.includes(row.status as AttendanceStatus)
        ? (row.status as AttendanceStatus)
        : "Hadir",
    );
    setEditingTimeIn(row.time_in ? row.time_in.slice(11, 16) : "");
    setEditingTimeOut(row.time_out ? row.time_out.slice(11, 16) : "");
    setRawMessage(null);
  };

  const saveEdit = async (absensiId: string) => {
    const result = await updateAttendance({
      absensi_id: absensiId,
      payload: {
        status: editingStatus,
        time_in: editingTimeIn ? `${tanggal}T${editingTimeIn}:00` : null,
        time_out: editingTimeOut ? `${tanggal}T${editingTimeOut}:00` : null,
      },
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

  const handleSaveSettings = async () => {
    if (!lateCutoffInput) {
      setSettingsMessage("Isi jam cutoff keterlambatan dulu.");
      return;
    }

    const result = await updateAttendanceSettings({
      late_cutoff_time: lateCutoffInput,
    });
    if ("error" in result) {
      setSettingsMessage("Gagal simpan pengaturan keterlambatan.");
      return;
    }
    setSettingsMessage(
      `Cutoff keterlambatan disimpan: ${result.data.late_cutoff_time}`,
    );
    await refetchAttendanceSettings();
  };

  const bulkRemoveRecords = async (absensiIds: string[]) => {
    for (const id of absensiIds) {
      await deleteAttendanceBulk({ absensi_id: id });
    }
    setRawMessage(`${absensiIds.length} record absensi berhasil dihapus.`);
    await refetchAttendance();
  };

  const handleRefreshAll = async () => {
    await Promise.all([refetchAttendance(), refetchIzin()]);
  };

  return {
    attendance,
    bulkRemoveRecords,
    deletingAttendance,
    deletingBulk,
    editingAbsensiId,
    editingStatus,
    editingTimeIn,
    editingTimeOut,
    handleRefreshAll,
    handleSaveSettings,
    lateCutoffInput,
    loadingAttendance,
    loadingIzin,
    rawMessage,
    rawSearch,
    removeRecord,
    saveEdit,
    savingEdit,
    savingSettings,
    setEditingAbsensiId,
    setEditingStatus,
    setEditingTimeIn,
    setEditingTimeOut,
    setLateCutoffInput,
    setRawSearch,
    settingsMessage,
    startEdit,
    stats,
    tanggal,
    setTanggal,
  };
}
