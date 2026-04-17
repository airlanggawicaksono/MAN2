"use client";

import {
  useListTahunAjaranQuery, useListSemestersQuery,
  useArchiveTahunAjaranMutation, useDeleteSemesterMutation,
  useUpdateTahunAjaranMutation, useUpdateSemesterMutation,
} from "@/api/shared/akademik";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { TahunAjaranForm, SemesterForm } from "./periode-forms";
import { TahunAjaranResponse, SemesterResponse } from "@/types/akademik/periode";
import { formatIsoToIdDate } from "@/lib/date-id";
import { notifyError, notifySuccess } from "@/lib/app-notify";

export default function ManajemenPeriodePage() {
  const PAGE_LIMIT = 10;

  const { data: tahunAjarans, isLoading: loadingTA } = useListTahunAjaranQuery();
  const { data: semesters, isLoading: loadingSem } = useListSemestersQuery();

  const [archiveTA] = useArchiveTahunAjaranMutation();
  const [deleteSem] = useDeleteSemesterMutation();
  const [updateTA] = useUpdateTahunAjaranMutation();
  const [updateSem] = useUpdateSemesterMutation();

  const [taToDelete, setTaToDelete] = useState<TahunAjaranResponse | null>(null);
  const [semToDelete, setSemToDelete] = useState<SemesterResponse | null>(null);
  const [taToActivate, setTaToActivate] = useState<TahunAjaranResponse | null>(null);
  const [semToActivate, setSemToActivate] = useState<SemesterResponse | null>(null);
  const [taFilter, setTaFilter] = useState<"all" | "active" | "archived">("all");
  const [semFilter, setSemFilter] = useState<"all" | "active" | "archived">("all");
  const [taSkip, setTaSkip] = useState(0);
  const [semSkip, setSemSkip] = useState(0);

  const tahunAjaranNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ta of tahunAjarans || []) {
      map.set(ta.tahun_ajaran_id, ta.nama);
    }
    return map;
  }, [tahunAjarans]);

  const filteredTahunAjarans = useMemo(() => {
    const rows = tahunAjarans || [];
    const filtered =
      taFilter === "active"
        ? rows.filter((item) => item.is_active)
        : taFilter === "archived"
          ? rows.filter((item) => !item.is_active)
          : rows;
    return [...filtered].sort(
      (a, b) => new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime()
    );
  }, [tahunAjarans, taFilter]);

  const filteredSemesters = useMemo(() => {
    const rows = semesters || [];
    const filtered =
      semFilter === "active"
        ? rows.filter((item) => item.is_active)
        : semFilter === "archived"
          ? rows.filter((item) => !item.is_active)
          : rows;
    return [...filtered].sort(
      (a, b) => new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime()
    );
  }, [semesters, semFilter]);

  useEffect(() => {
    setTaSkip(0);
  }, [taFilter]);

  useEffect(() => {
    setSemSkip(0);
  }, [semFilter]);

  useEffect(() => {
    if (taSkip >= filteredTahunAjarans.length && taSkip > 0) {
      setTaSkip(Math.max(0, Math.floor((filteredTahunAjarans.length - 1) / PAGE_LIMIT) * PAGE_LIMIT));
    }
  }, [filteredTahunAjarans.length, taSkip, PAGE_LIMIT]);

  useEffect(() => {
    if (semSkip >= filteredSemesters.length && semSkip > 0) {
      setSemSkip(Math.max(0, Math.floor((filteredSemesters.length - 1) / PAGE_LIMIT) * PAGE_LIMIT));
    }
  }, [filteredSemesters.length, semSkip, PAGE_LIMIT]);

  const pagedTahunAjarans = useMemo(
    () => filteredTahunAjarans.slice(taSkip, taSkip + PAGE_LIMIT),
    [filteredTahunAjarans, taSkip, PAGE_LIMIT]
  );

  const pagedSemesters = useMemo(
    () => filteredSemesters.slice(semSkip, semSkip + PAGE_LIMIT),
    [filteredSemesters, semSkip, PAGE_LIMIT]
  );

  const handleActivateTA = async () => {
    if (!taToActivate) return;
    try {
      // Deactivate all others, activate selected
      for (const ta of tahunAjarans || []) {
        if (ta.tahun_ajaran_id === taToActivate.tahun_ajaran_id) {
          await updateTA({ id: ta.tahun_ajaran_id, body: { is_active: true } }).unwrap();
        } else if (ta.is_active) {
          await updateTA({ id: ta.tahun_ajaran_id, body: { is_active: false } }).unwrap();
        }
      }
      notifySuccess("Tahun ajaran aktif berhasil diperbarui.");
    } catch {
      notifyError("Gagal mengubah tahun ajaran aktif.");
    }
    setTaToActivate(null);
  };

  const handleActivateSem = async () => {
    if (!semToActivate) return;
    try {
      for (const sem of semesters || []) {
        if (sem.semester_id === semToActivate.semester_id) {
          await updateSem({ id: sem.semester_id, body: { is_active: true } }).unwrap();
        } else if (sem.is_active) {
          await updateSem({ id: sem.semester_id, body: { is_active: false } }).unwrap();
        }
      }
      notifySuccess("Semester aktif berhasil diperbarui.");
    } catch {
      notifyError("Gagal mengubah semester aktif.");
    }
    setSemToActivate(null);
  };

  const taColumns: ColumnDef<TahunAjaranResponse>[] = [
    {
      accessorKey: "is_active",
      header: "Aktif",
      cell: ({ row }) => {
        const ta = row.original;
        return (
          <button
            type="button"
            onClick={() => !ta.is_active && setTaToActivate(ta)}
            className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              ta.is_active
                ? "border-primary"
                : "border-muted-foreground/40 cursor-pointer hover:border-primary/60"
            }`}
          >
            {ta.is_active && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "nama",
      header: "Tahun Ajaran",
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="icon"
          className="text-destructive"
          onClick={() => setTaToDelete(row.original)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const semColumns: ColumnDef<SemesterResponse>[] = [
    {
      accessorKey: "is_active",
      header: "Aktif",
      cell: ({ row }) => {
        const sem = row.original;
        return (
          <button
            type="button"
            onClick={() => !sem.is_active && setSemToActivate(sem)}
            className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              sem.is_active
                ? "border-primary"
                : "border-muted-foreground/40 cursor-pointer hover:border-primary/60"
            }`}
          >
            {sem.is_active && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "tipe",
      header: "Semester",
    },
    {
      accessorKey: "tahun_ajaran_id",
      header: "Tahun Ajaran",
      cell: ({ row }) => {
        const sem = row.original;
        return (
          sem.tahun_ajaran_nama ??
          tahunAjaranNameById.get(sem.tahun_ajaran_id) ??
          "Tahun ajaran tidak ditemukan"
        );
      },
    },
    {
      accessorKey: "tanggal_mulai",
      header: "Tanggal Mulai",
      cell: ({ row }) => formatIsoToIdDate(row.original.tanggal_mulai) || "-",
    },
    {
      accessorKey: "tanggal_selesai",
      header: "Tanggal Selesai",
      cell: ({ row }) => formatIsoToIdDate(row.original.tanggal_selesai) || "-",
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="icon"
          className="text-destructive"
          onClick={() => setSemToDelete(row.original)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <TahunAjaranForm />
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Daftar Tahun Ajaran</h2>
              <Select
                value={taFilter}
                onValueChange={(value: "all" | "active" | "archived") => setTaFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="archived">Arsip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loadingTA ? (
              <p>Memuat...</p>
            ) : (
              <>
                <DataTable columns={taColumns} data={pagedTahunAjarans} />
                <EntityTablePagination
                  skip={taSkip}
                  limit={PAGE_LIMIT}
                  total={filteredTahunAjarans.length}
                  itemLabel="tahun ajaran"
                  onSkipChange={setTaSkip}
                />
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SemesterForm />
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Daftar Semester</h2>
              <Select
                value={semFilter}
                onValueChange={(value: "all" | "active" | "archived") => setSemFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="archived">Arsip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loadingSem ? (
              <p>Memuat...</p>
            ) : (
              <>
                <DataTable columns={semColumns} data={pagedSemesters} />
                <EntityTablePagination
                  skip={semSkip}
                  limit={PAGE_LIMIT}
                  total={filteredSemesters.length}
                  itemLabel="semester"
                  onSkipChange={setSemSkip}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activate Tahun Ajaran */}
      <AlertDialog open={!!taToActivate} onOpenChange={() => setTaToActivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Tahun Ajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tahun ajaran <strong>{taToActivate?.nama}</strong> akan dijadikan tahun ajaran aktif.
              {tahunAjarans?.some(ta => ta.is_active && ta.tahun_ajaran_id !== taToActivate?.tahun_ajaran_id) &&
                " Tahun ajaran yang sedang aktif saat ini akan dinonaktifkan."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateTA}>
              Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Semester */}
      <AlertDialog open={!!semToActivate} onOpenChange={() => setSemToActivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              Semester <strong>{semToActivate?.tipe}</strong> akan dijadikan semester aktif.
              {semesters?.some(s => s.is_active && s.semester_id !== semToActivate?.semester_id) &&
                " Semester yang sedang aktif saat ini akan dinonaktifkan."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateSem}>
              Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tahun Ajaran Dialog */}
      <AlertDialog open={!!taToDelete} onOpenChange={() => setTaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Arsipkan Tahun Ajaran?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Anda akan mengarsipkan tahun ajaran <strong>{taToDelete?.nama}</strong>.
              </span>
              <span className="block font-semibold text-destructive">
                Data tidak dihapus permanen. Tahun ajaran akan dinonaktifkan (mode arsip).
              </span>
              <span className="block text-sm font-medium mt-2">
                Catatan: tahun ajaran aktif tidak bisa diarsipkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (taToDelete) await archiveTA(taToDelete.tahun_ajaran_id).unwrap();
                  notifySuccess("Tahun ajaran berhasil diarsipkan.");
                } catch (err) {
                  const message =
                    (err as { data?: { detail?: string } })?.data?.detail ??
                    "Gagal mengarsipkan tahun ajaran.";
                  notifyError(message);
                }
                setTaToDelete(null);
              }}
            >
              Ya, arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Semester Dialog */}
      <AlertDialog open={!!semToDelete} onOpenChange={() => setSemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Hapus Semester?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Anda akan menghapus semester <strong>{semToDelete?.tipe}</strong>.
              </span>
              <span className="block font-semibold text-destructive">
                PERINGATAN: Semua data yang terkait akan ikut terhapus secara permanen, termasuk:
              </span>
              <ul className="list-disc list-inside text-destructive text-sm space-y-1">
                <li>Semua jadwal pelajaran dalam semester ini</li>
                <li>Semua tugas dan nilai siswa</li>
                <li>Semua rapor yang sudah digenerate</li>
                <li>Semua data absensi dalam periode ini</li>
              </ul>
              <span className="block text-sm font-medium mt-2">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (semToDelete) await deleteSem(semToDelete.semester_id).unwrap();
                  notifySuccess("Semester berhasil dihapus.");
                } catch {
                  notifyError("Gagal menghapus semester.");
                }
                setSemToDelete(null);
              }}
            >
              Saya mengerti, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
