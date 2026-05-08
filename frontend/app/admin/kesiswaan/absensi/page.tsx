"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DateInputId } from "@/components/ui/date-input-id";
import { Users, LogOut, Clock, Trash } from "lucide-react";
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
import { BulkActionBar } from "@/app/components/admin/bulk-action-bar";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { TableSkeleton } from "@/app/components/admin/table-skeleton";

export default function AbsensiPage() {
  const {
    attendance,
    bulkRemoveRecords,
    deletingAttendance,
    deletingBulk,
    editingAbsensiId,
    editingStatus,
    editingTimeIn,
    editingTimeOut,
    handleSaveSettings,
    lateCutoffInput,
    loadingAttendance,
    rawMessage,
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
    rawSearch,
  } = useAbsensiController();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);

  const allIds = attendance.map((r) => r.absensi_id);
  const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function handleToggle(id: string, index: number, shiftHeld: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftHeld && lastSelectedIndex !== null) {
        const lo = Math.min(lastSelectedIndex, index);
        const hi = Math.max(lastSelectedIndex, index);
        const shouldSelect = !prev.has(id);
        for (let i = lo; i <= hi; i++) {
          if (shouldSelect) next.add(allIds[i]);
          else next.delete(allIds[i]);
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      setLastSelectedIndex(index);
      return next;
    });
  }

  function handleToggleAll() {
    const allSel = allIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSel) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
    setLastSelectedIndex(null);
  }

  async function handleBulkDelete() {
    await bulkRemoveRecords(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkConfirmDelete(false);
  }

  return (
    <AdminPageShell
      eyebrow="Kesiswaan"
      title="Manajemen Absensi"
      description="Kelola catatan absensi siswa secara individual."
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
          <CardTitle>Pencarian & Koreksi Manual</CardTitle>
          <CardDescription>
            Cari siswa langsung, edit status absensi, atau hapus catatan tanpa
            harus memilih kelas.
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
              <div className="p-3">
                <TableSkeleton rows={4} label="Memuat data absensi" />
              </div>
            ) : attendance.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Tidak ada data absensi untuk filter ini.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/35">
                  <tr>
                    <th className="w-8 px-3 py-2">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleToggleAll}
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Kelas</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Time In</th>
                    <th className="px-3 py-2 text-left">Time Out</th>
                    <th className="px-3 py-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row, index) => {
                    const isEditing = editingAbsensiId === row.absensi_id;
                    return (
                      <tr key={row.absensi_id} className="border-t">
                        <td className="w-8 px-3 py-2">
                          <Checkbox
                            checked={selectedIds.has(row.absensi_id)}
                            onChange={(e) =>
                              handleToggle(
                                row.absensi_id,
                                index,
                                (e.nativeEvent as MouseEvent).shiftKey,
                              )
                            }
                            aria-label={`Pilih ${row.nama_siswa}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
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
                          {isEditing ? (
                            <Input
                              type="time"
                              value={editingTimeIn}
                              onChange={(e) => setEditingTimeIn(e.target.value)}
                              className="w-[120px]"
                            />
                          ) : (
                            row.time_in ? row.time_in.slice(11, 16) : "-"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              type="time"
                              value={editingTimeOut}
                              onChange={(e) => setEditingTimeOut(e.target.value)}
                              className="w-[120px]"
                            />
                          ) : (
                            row.time_out ? row.time_out.slice(11, 16) : "-"
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

      <BulkActionBar
        selectedCount={selectedIds.size}
        actions={[
          {
            label: "Hapus",
            icon: <Trash className="h-4 w-4" />,
            variant: "destructive",
            disabled: deletingBulk,
            onClick: () => setBulkConfirmDelete(true),
          },
        ]}
        onClear={() => setSelectedIds(new Set())}
      />

      <ConfirmDialog
        open={bulkConfirmDelete}
        onOpenChange={setBulkConfirmDelete}
        title="Hapus Absensi Terpilih"
        description={`${selectedIds.size} record absensi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deletingBulk ? "Menghapus..." : `Hapus ${selectedIds.size} Record`}
        confirmVariant="destructive"
        confirmDisabled={deletingBulk}
        onConfirm={handleBulkDelete}
      />
    </AdminPageShell>
  );
}
