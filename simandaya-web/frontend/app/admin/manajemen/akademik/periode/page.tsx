"use client";

import {
  useListTahunAjaranQuery, useListSemestersQuery,
  useDeleteTahunAjaranMutation, useDeleteSemesterMutation,
  useUpdateTahunAjaranMutation, useUpdateSemesterMutation,
} from "@/api/akademik";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { TahunAjaranForm, SemesterForm } from "./periode-forms";
import { TahunAjaranResponse, SemesterResponse } from "@/types/akademik/periode";

export default function ManajemenPeriodePage() {
  const { data: tahunAjarans, isLoading: loadingTA } = useListTahunAjaranQuery();
  const { data: semesters, isLoading: loadingSem } = useListSemestersQuery();

  const [deleteTA] = useDeleteTahunAjaranMutation();
  const [deleteSem] = useDeleteSemesterMutation();
  const [updateTA] = useUpdateTahunAjaranMutation();
  const [updateSem] = useUpdateSemesterMutation();

  const [taToDelete, setTaToDelete] = useState<TahunAjaranResponse | null>(null);
  const [semToDelete, setSemToDelete] = useState<SemesterResponse | null>(null);
  const [taToActivate, setTaToActivate] = useState<TahunAjaranResponse | null>(null);
  const [semToActivate, setSemToActivate] = useState<SemesterResponse | null>(null);

  const handleActivateTA = async () => {
    if (!taToActivate) return;
    // Deactivate all others, activate selected
    for (const ta of tahunAjarans || []) {
      if (ta.tahun_ajaran_id === taToActivate.tahun_ajaran_id) {
        await updateTA({ id: ta.tahun_ajaran_id, body: { is_active: true } });
      } else if (ta.is_active) {
        await updateTA({ id: ta.tahun_ajaran_id, body: { is_active: false } });
      }
    }
    setTaToActivate(null);
  };

  const handleActivateSem = async () => {
    if (!semToActivate) return;
    for (const sem of semesters || []) {
      if (sem.semester_id === semToActivate.semester_id) {
        await updateSem({ id: sem.semester_id, body: { is_active: true } });
      } else if (sem.is_active) {
        await updateSem({ id: sem.semester_id, body: { is_active: false } });
      }
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
            <h2 className="text-xl font-semibold mb-4">Daftar Tahun Ajaran</h2>
            {loadingTA ? <p>Memuat...</p> : tahunAjarans && <DataTable columns={taColumns} data={tahunAjarans} />}
          </div>
        </div>

        <div className="space-y-6">
          <SemesterForm />
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Daftar Semester</h2>
            {loadingSem ? <p>Memuat...</p> : semesters && <DataTable columns={semColumns} data={semesters} />}
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
            <AlertDialogTitle className="text-destructive">Hapus Tahun Ajaran?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Anda akan menghapus tahun ajaran <strong>{taToDelete?.nama}</strong>.
              </span>
              <span className="block font-semibold text-destructive">
                PERINGATAN: Semua data yang terkait akan ikut terhapus secara permanen, termasuk:
              </span>
              <ul className="list-disc list-inside text-destructive text-sm space-y-1">
                <li>Semua semester dalam tahun ajaran ini</li>
                <li>Semua kelas dan penempatan siswa</li>
                <li>Semua jadwal pelajaran</li>
                <li>Semua penugasan guru-mapel</li>
                <li>Semua tugas, nilai, dan rapor terkait</li>
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
                if (taToDelete) await deleteTA(taToDelete.tahun_ajaran_id);
                setTaToDelete(null);
              }}
            >
              Saya mengerti, hapus
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
                if (semToDelete) await deleteSem(semToDelete.semester_id);
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
