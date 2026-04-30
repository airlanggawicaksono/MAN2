"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateInputId } from "@/components/ui/date-input-id";
import { Users, LogOut, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatIsoToIdDate } from "@/lib/date-id";
import {
  STATUS_OPTIONS,
  type AttendanceStatus,
  useAbsensiController,
} from "./use-absensi-controller";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";

export default function AbsensiPage() {
  const {
    deletingAttendance,
    editingAbsensiId,
    editingStatus,
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
    setLateCutoffInput,
    setRawSearch,
    settingsMessage,
    startEdit,
    stats,
    attendance,
    tanggal,
    setTanggal,
  } = useAbsensiController();

  return (
    <AdminPageShell
      title="Kesiswaan: Manajemen Absensi"
      description="Kelola record absensi siswa secara individual."
      actions={
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Tanggal</label>
          <DateInputId value={tanggal} onValueChange={setTanggal} />
        </div>
      }
    >

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Total Absensi
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalAbsen}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" />
              Izin Keluar
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalIzinKeluar}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Terlambat
            </CardDescription>
            <CardTitle className="text-3xl">{stats.byStatus.Terlambat}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Pengaturan Keterlambatan</CardTitle>
          <CardDescription>
            Record absen masuk dari desktop akan ditandai <b>Terlambat</b> jika
            melewati jam ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex max-w-sm items-end gap-2">
            <div className="grid flex-1 gap-1">
              <label className="text-xs text-muted-foreground">
                Jam cutoff
              </label>
              <Input
                type="time"
                value={lateCutoffInput}
                onChange={(e) => setLateCutoffInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
          {settingsMessage && (
            <p className="text-sm text-muted-foreground">{settingsMessage}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Distribusi Status Harian</CardTitle>
          <CardDescription>{formatIsoToIdDate(tanggal)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <Badge key={status} variant="outline">
              {status}: {count}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Raw Management (Admin)</CardTitle>
          <CardDescription>
            Cari siswa langsung, edit status absensi, atau hapus record tanpa
            harus pilih kelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1 max-w-sm">
            <label className="text-xs text-muted-foreground">
              Cari siswa
            </label>
            <Input
              placeholder="Nama siswa..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
            />
          </div>

          {rawMessage && (
            <p className="text-sm text-muted-foreground">{rawMessage}</p>
          )}

          <div className="max-h-80 overflow-auto rounded-md border border-border/70">
            {loadingAttendance ? (
              <p className="p-3 text-sm text-muted-foreground">
                Memuat data absensi...
              </p>
            ) : attendance.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Tidak ada data absensi untuk filter ini.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/35">
                  <tr>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Kelas</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => {
                    const isEditing = editingAbsensiId === row.absensi_id;
                    return (
                      <tr key={row.absensi_id} className="border-t">
                        <td className="px-3 py-2">{row.nama_siswa}</td>
                        <td className="px-3 py-2">{row.kelas ?? "-"}</td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Select
                              value={editingStatus}
                              onValueChange={(val) =>
                                setEditingStatus(val as AttendanceStatus)
                              }
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
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(row)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    void removeRecord(row.absensi_id)
                                  }
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
    </AdminPageShell>
  );
}
