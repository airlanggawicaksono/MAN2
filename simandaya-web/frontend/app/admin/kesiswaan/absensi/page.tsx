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
import { useListKelasQuery, useListSiswaInKelasQuery } from "@/api/shared/akademik";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicAbsensiResponse, UpdateAbsensiRequest } from "@/types/absensi";

const EMPTY_LIST: never[] = [];
const STATUS_OPTIONS: UpdateAbsensiRequest["status"][] = ["Hadir", "Izin", "Sakit", "Alfa", "Terlambat"];

export default function AbsensiPage() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [rawSearch, setRawSearch] = useState("");
  const [rawKelasFilter, setRawKelasFilter] = useState("ALL");
  const [bulkKelasId, setBulkKelasId] = useState("");
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [rawMessage, setRawMessage] = useState<string | null>(null);
  const [editingAbsensiId, setEditingAbsensiId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<UpdateAbsensiRequest["status"]>("Hadir");
  const [lateCutoffInput, setLateCutoffInput] = useState("07:15");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const { data: attendance = [], isLoading: loadingAttendance, refetch: refetchAttendance } = useListPublicAttendanceQuery({
    tanggal,
    search: rawSearch || undefined,
    limit: 200,
  });
  const { data: izin = [], isLoading: loadingIzin, refetch: refetchIzin } = useListPublicIzinKeluarQuery({
    tanggal,
    limit: 200,
  });
  const { data: classesData } = useListKelasQuery();
  const { data: attendanceSettings, refetch: refetchAttendanceSettings } = useGetAttendanceSettingsQuery();
  const { data: studentsInClassData, isLoading: loadingStudents } = useListSiswaInKelasQuery(bulkKelasId, {
    skip: !bulkKelasId,
  });

  const classes = classesData ?? EMPTY_LIST;
  const studentsInClass = studentsInClassData ?? EMPTY_LIST;
  const [bulkMarkAttendance, { isLoading: savingBulk }] = useBulkMarkAttendanceMutation();
  const [updateAttendance, { isLoading: savingEdit }] = useUpdateAttendanceMutation();
  const [deleteAttendance, { isLoading: deletingAttendance }] = useDeleteAttendanceMutation();
  const [updateAttendanceSettings, { isLoading: savingSettings }] = useUpdateAttendanceSettingsMutation();

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
    setEditingStatus((row.status as UpdateAbsensiRequest["status"]) ?? "Hadir");
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
    setSettingsMessage(`Cutoff keterlambatan disimpan: ${result.data.late_cutoff_time.slice(0, 5)}`);
    await refetchAttendanceSettings();
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kesiswaan: Manajemen Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Ada dua mode: raw management per siswa (tanpa kelas wajib) dan bulk mark per kelas.
          </p>
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Tanggal</label>
          <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Absensi</CardDescription>
            <CardTitle>{stats.totalAbsen}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Izin Keluar</CardDescription>
            <CardTitle>{stats.totalIzinKeluar}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Loading</CardDescription>
            <CardTitle>{loadingAttendance || loadingIzin ? "Ya" : "Tidak"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Keterlambatan</CardTitle>
          <CardDescription>
            Record absen masuk dari desktop akan ditandai <b>Terlambat</b> jika melewati jam ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex max-w-sm items-end gap-2">
            <div className="grid flex-1 gap-1">
              <label className="text-xs text-muted-foreground">Jam cutoff</label>
              <Input
                type="time"
                value={lateCutoffInput}
                onChange={(e) => setLateCutoffInput(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
          {settingsMessage && <p className="text-sm text-muted-foreground">{settingsMessage}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribusi Status Harian</CardTitle>
          <CardDescription>{tanggal}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <Badge key={status} variant="outline">
              {status}: {count}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Management (Admin)</CardTitle>
          <CardDescription>
            Cari siswa langsung, edit status absensi, atau hapus record tanpa harus pilih kelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Cari siswa</label>
              <Input
                placeholder="Nama siswa..."
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Filter kelas</label>
              <Select value={rawKelasFilter} onValueChange={setRawKelasFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua kelas</SelectItem>
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.kelas_id} value={kelas.nama_kelas}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {rawMessage && <p className="text-sm text-muted-foreground">{rawMessage}</p>}

          <div className="max-h-80 overflow-auto rounded-md border">
            {loadingAttendance ? (
              <p className="p-3 text-sm text-muted-foreground">Memuat data absensi...</p>
            ) : filteredAttendance.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Tidak ada data absensi untuk filter ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Kelas</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((row) => {
                    const isEditing = editingAbsensiId === row.absensi_id;
                    return (
                      <tr key={row.absensi_id} className="border-t">
                        <td className="px-3 py-2">{row.nama_siswa}</td>
                        <td className="px-3 py-2">{row.kelas ?? "-"}</td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Select
                              value={editingStatus}
                              onValueChange={(val) => setEditingStatus(val as UpdateAbsensiRequest["status"])}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{row.status}</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void saveEdit(row.absensi_id)}
                                  disabled={savingEdit}
                                >
                                  {savingEdit ? "Menyimpan..." : "Simpan"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingAbsensiId(null)}
                                >
                                  Batal
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => void removeRecord(row.absensi_id)}
                                  disabled={deletingAttendance}
                                >
                                  Hapus
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Mark Per Kelas (Admin)</CardTitle>
          <CardDescription>
            Default semua siswa di kelas ditandai hadir. Uncheck yang tidak masuk, lalu simpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1 min-w-[220px] max-w-sm">
            <label className="text-xs text-muted-foreground">Kelas</label>
            <Select value={bulkKelasId} onValueChange={setBulkKelasId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((kelas) => (
                  <SelectItem key={kelas.kelas_id} value={kelas.kelas_id}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Total siswa: {studentsInClass.length}</Badge>
            <Badge variant="outline">Ditandai hadir: {selectedCount}</Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const next: Record<string, boolean> = {};
                for (const siswa of studentsInClass) next[siswa.user_id] = true;
                setSelectedMap(next);
              }}
              disabled={!studentsInClass.length}
            >
              Centang Semua
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const next: Record<string, boolean> = {};
                for (const siswa of studentsInClass) next[siswa.user_id] = false;
                setSelectedMap(next);
              }}
              disabled={!studentsInClass.length}
            >
              Kosongkan Semua
            </Button>
            <Button
              type="button"
              onClick={handleSubmitBulk}
              disabled={!bulkKelasId || savingBulk || !studentsInClass.length}
            >
              {savingBulk ? "Menyimpan..." : "Simpan Bulk Mark"}
            </Button>
          </div>

          {bulkMessage && <p className="text-sm text-muted-foreground">{bulkMessage}</p>}

          <div className="max-h-80 overflow-auto rounded-md border">
            {loadingStudents ? (
              <p className="p-3 text-sm text-muted-foreground">Memuat siswa kelas...</p>
            ) : studentsInClass.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Pilih kelas untuk mulai bulk mark.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Hadir</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">NIS</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsInClass.map((siswa) => (
                    <tr key={siswa.siswa_kelas_id} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!selectedMap[siswa.user_id]}
                          onChange={(e) =>
                            setSelectedMap((prev) => ({
                              ...prev,
                              [siswa.user_id]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">{siswa.nama_lengkap ?? "-"}</td>
                      <td className="px-3 py-2">{siswa.nis ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
