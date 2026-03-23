"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useListMapelQuery, useDeleteMapelMutation } from "@/api/shared/akademik";
import { MapelResponse } from "@/types/akademik/mapel";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import { mapelColumns } from "./mapel-columns";
import { MapelForm } from "./mapel-form";
import { MapelEditDialog } from "./mapel-edit-dialog";
import { MapelImportDialog } from "./mapel-import-dialog";
import { notifyError, notifySuccess } from "@/lib/app-notify";

export default function ManajemenMapelPage() {
  const { data: mapels, isLoading, error } = useListMapelQuery();
  const [deleteMapel] = useDeleteMapelMutation();

  const [editTarget, setEditTarget] = useState<MapelResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MapelResponse | null>(null);

  const columnsWithActions = [
    ...mapelColumns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: any }) => {
        const mapel = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditTarget(mapel)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive"
              onClick={() => setDeleteTarget(mapel)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteMapel(deleteTarget.mapel_id).unwrap();
        notifySuccess("Mata pelajaran berhasil dihapus.");
      } catch {
        notifyError("Gagal menghapus mata pelajaran.");
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Manajemen Mata Pelajaran</h1>
        <MapelImportDialog existingMapels={mapels ?? []} />
      </div>

      <MapelForm />

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Daftar Mata Pelajaran</h2>
          {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
          {error && (
            <p className="text-destructive">
              Gagal memuat data: {JSON.stringify(error)}
            </p>
          )}
          {mapels && <DataTable columns={columnsWithActions} data={mapels} />}
        </div>
      </div>

      <MapelEditDialog
        mapel={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Mata pelajaran{" "}
              <strong>{deleteTarget?.nama_mapel}</strong> akan dihapus secara permanen.
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
