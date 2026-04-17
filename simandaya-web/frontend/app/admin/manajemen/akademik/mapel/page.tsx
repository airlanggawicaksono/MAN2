"use client";

import { useState } from "react";
import {
  useDeleteMapelMutation,
  useGetMapelArchiveImpactQuery,
  useListMapelQuery,
  useListTahunAjaranQuery,
  useUpdateMapelMutation,
} from "@/api/shared/akademik";
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
import { getApiErrorMessage } from "@/lib/api-error";

type ManajemenMapelPageProps = {
  tahunAjaranId?: string;
};

export default function ManajemenMapelPage({ tahunAjaranId }: ManajemenMapelPageProps) {
  const { data: tahunAjarans = [] } = useListTahunAjaranQuery();
  const fallbackTahunAjaranId =
    tahunAjarans.find((ta) => ta.is_active)?.tahun_ajaran_id ??
    tahunAjarans[0]?.tahun_ajaran_id;
  const effectiveTahunAjaranId = tahunAjaranId || fallbackTahunAjaranId;

  const [statusFilter, setStatusFilter] = useState<"available" | "archived">(
    "available",
  );
  const { data: mapels, isLoading, error } = useListMapelQuery({
    status: statusFilter,
    tahunAjaranId: effectiveTahunAjaranId || undefined,
  });
  const [deleteMapel] = useDeleteMapelMutation();
  const [updateMapel] = useUpdateMapelMutation();

  const [editTarget, setEditTarget] = useState<MapelResponse | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MapelResponse | null>(null);
  const { data: archiveImpact } = useGetMapelArchiveImpactQuery(
    archiveTarget?.mapel_id ?? "",
    { skip: !archiveTarget },
  );

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
              size="sm"
              onClick={() => setEditTarget(mapel)}
              disabled={!mapel.is_active}
              title={mapel.is_active ? "Edit" : "Mapel arsip tidak bisa diedit"}
            >
              Edit
            </Button>
            {mapel.is_active ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setArchiveTarget(mapel)}
                title="Arsipkan mapel"
              >
                Arsipkan
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await updateMapel({
                      id: mapel.mapel_id,
                      body: { is_active: true },
                    }).unwrap();
                    notifySuccess("Mata pelajaran berhasil diaktifkan kembali.");
                  } catch (error) {
                    notifyError(
                      getApiErrorMessage(error) ||
                        "Gagal mengaktifkan kembali mata pelajaran.",
                    );
                  }
                }}
                title="Aktifkan kembali"
              >
                Aktifkan kembali
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const handleArchive = async () => {
    if (archiveTarget) {
      try {
        await deleteMapel(archiveTarget.mapel_id).unwrap();
        notifySuccess("Mata pelajaran berhasil diarsipkan.");
      } catch (error) {
        notifyError(getApiErrorMessage(error) || "Gagal mengarsipkan mata pelajaran.");
      }
      setArchiveTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Manajemen Mata Pelajaran</h1>

      {statusFilter === "available" ? (
        <MapelForm tahunAjaranId={effectiveTahunAjaranId} />
      ) : null}

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Daftar Mata Pelajaran</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("available")}
              >
                Tersedia
              </Button>
              <Button
                variant={statusFilter === "archived" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("archived")}
              >
                Arsip
              </Button>
              {statusFilter === "available" ? (
                <MapelImportDialog
                  existingMapels={mapels ?? []}
                  tahunAjaranId={effectiveTahunAjaranId}
                />
              ) : null}
            </div>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Mengarsipkan mapel tidak menghapus histori jadwal/tugas/rapor. Mapel
            arsip tidak bisa dipakai untuk assignment baru.
          </p>
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

      <AlertDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan Mata Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Mapel <strong>{archiveTarget?.nama_mapel}</strong> akan dipindah ke
              arsip (bukan dihapus permanen).
              <br />
              Dampak referensi:
              <br />
              Kurikulum: <strong>{archiveImpact?.kurikulum_count ?? 0}</strong>, Guru-Mapel:{" "}
              <strong>{archiveImpact?.guru_mapel_count ?? 0}</strong>, Jadwal:{" "}
              <strong>{archiveImpact?.jadwal_count ?? 0}</strong>, Tugas:{" "}
              <strong>{archiveImpact?.tugas_count ?? 0}</strong>, Rapor Nilai:{" "}
              <strong>{archiveImpact?.rapor_nilai_count ?? 0}</strong>, Rapor Bobot:{" "}
              <strong>{archiveImpact?.rapor_bobot_count ?? 0}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleArchive}
            >
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
