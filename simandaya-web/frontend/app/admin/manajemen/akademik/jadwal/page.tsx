"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { 
  useListSemestersQuery, 
  useListKelasQuery, 
  useListJadwalByKelasQuery,
  useDeleteJadwalMutation 
} from "@/api/akademik";
import { JadwalResponse } from "@/types/akademik/jadwal";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { jadwalColumns } from "./jadwal-columns";
import { JadwalForm } from "./jadwal-form";

export default function ManajemenJadwalPage() {
  const { data: semesters } = useListSemestersQuery();
  const { data: classes } = useListKelasQuery();
  
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  
  const { data: schedules, isLoading, error } = useListJadwalByKelasQuery(
    selectedKelasId, 
    { skip: !selectedKelasId }
  );
  
  const [deleteJadwal] = useDeleteJadwalMutation();
  const [deleteTarget, setDeleteTarget] = useState<JadwalResponse | null>(null);

  const columnsWithActions = [
    ...jadwalColumns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: any }) => {
        const jadwal = row.original;
        return (
          <Button
            variant="outline"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteTarget(jadwal)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteJadwal(deleteTarget.jadwal_id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Jadwal Pelajaran</h1>
        <p className="text-muted-foreground">
          Atur waktu belajar mengajar untuk setiap kelas dan guru.
        </p>
      </div>

      <JadwalForm />

      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="grid gap-2 min-w-[200px]">
              <Label>Filter Berdasarkan Kelas</Label>
              <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.kelas_id} value={c.kelas_id}>
                      {c.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <h2 className="text-xl font-semibold">
            Daftar Jadwal {selectedKelasId ? `- ${classes?.find(c => c.kelas_id === selectedKelasId)?.nama_kelas}` : ""}
          </h2>
          
          {!selectedKelasId ? (
            <p className="text-muted-foreground py-10 text-center border-2 border-dashed rounded-lg">
              Silakan pilih kelas untuk melihat jadwal.
            </p>
          ) : (
            <>
              {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
              {error && (
                <p className="text-destructive">
                  Gagal memuat data: {JSON.stringify(error)}
                </p>
              )}
              {schedules && <DataTable columns={columnsWithActions} data={schedules} />}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Entri Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jadwal untuk{" "}
              <strong>{deleteTarget?.mapel_nama}</strong> pada hari{" "}
              <strong>{deleteTarget?.hari}</strong> jam{" "}
              <strong>{deleteTarget?.jam_mulai}</strong> akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
