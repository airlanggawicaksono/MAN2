"use client";

import { useState } from "react";
import { Pencil, Trash2, GraduationCap, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useListStudentsQuery, useUpdateStudentMutation } from "@/api/admin/students";
import type { StudentProfile } from "@/types/students";
import { useStudentPrecache } from "@/hooks/useStudentPrecache";
import { useCrudListPage } from "@/hooks/useCrudListPage";
import { DataTable } from "@/components/ui/data-table";
import { studentColumns } from "./student-columns";
import { StudentEditDialog } from "./student-edit-dialog";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentCreateDialog } from "./student-create-dialog";
import { StudentImportDialog } from "./student-import-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { TableSkeleton } from "@/app/components/admin/table-skeleton";

function StudentRowActions({
  student,
  onEdit,
  onDelete,
}: {
  student: StudentProfile;
  onEdit: (s: StudentProfile) => void;
  onDelete: (s: StudentProfile) => void;
}) {
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const [confirmAlumni, setConfirmAlumni] = useState(false);
  const isAlumni = student.status_siswa === "Lulus";

  const handleAlumni = async () => {
    if (isAlumni) return;
    await updateStudent({ siswaId: student.siswa_id, body: { status_siswa: "Lulus" } });
    setConfirmAlumni(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(student)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(student)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      {!isAlumni && (
        <>
          <Button
            variant="ghost"
            size="icon"
            title="Jadikan Alumni"
            disabled={isLoading}
            onClick={() => setConfirmAlumni(true)}
          >
            <GraduationCap className="h-4 w-4 text-primary" />
          </Button>
          <ConfirmDialog
            open={confirmAlumni}
            onOpenChange={setConfirmAlumni}
            title="Tandai sebagai Alumni"
            description={
              <>
                Status <b>{student.nama_lengkap}</b> akan diubah menjadi <b>Lulus</b>.
                Tindakan ini tidak dapat dibatalkan dari halaman ini.
              </>
            }
            confirmLabel={isLoading ? "Memproses..." : "Ya, Tandai Alumni"}
            confirmVariant="destructive"
            confirmDisabled={isLoading}
            onConfirm={handleAlumni}
          />
        </>
      )}
    </div>
  );
}

export default function DataSiswaPage() {
  const crud = useCrudListPage<StudentProfile>();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading, error, refetch } = useListStudentsQuery({
    skip: crud.skip,
    limit: crud.limit,
    search: crud.debouncedSearch,
  });

  const total = data?.total ?? 0;
  useStudentPrecache(crud.skip, total, crud.debouncedSearch);

  const columnsWithActions: ColumnDef<StudentProfile, unknown>[] = [
    ...studentColumns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: { original: StudentProfile } }) => (
        <StudentRowActions
          student={row.original}
          onEdit={crud.setEditTarget}
          onDelete={crud.setDeleteTarget}
        />
      ),
    },
  ];

  return (
    <AdminPageShell
      eyebrow="Manajemen Data"
      title="Data Siswa"
      description="Kelola profil siswa MAN 2 Yogyakarta — tambah, ubah, dan tandai alumni."
      actions={
        <>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Impor CSV
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Siswa
          </Button>
        </>
      }
    >
      <Card className="border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

        <EntitySearchInput
          placeholder="Cari siswa (NISN/NIM/Nama)..."
          value={crud.searchInput}
          onChange={crud.handleSearchChange}
        />

        {isLoading && <TableSkeleton label="Memuat data siswa" />}
        {error && (
          <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-sm text-destructive">Gagal memuat data siswa.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        )}
        {data && <DataTable columns={columnsWithActions} data={data.items} />}

        {data ? (
          <EntityTablePagination
            skip={crud.skip}
            limit={crud.limit}
            total={total}
            itemLabel="siswa"
            onSkipChange={crud.setSkip}
          />
        ) : null}
        </CardContent>
      </Card>

      <StudentCreateDialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          refetch();
        }}
      />

      <StudentImportDialog
        open={showImport}
        onClose={() => {
          setShowImport(false);
          refetch();
        }}
      />

      <StudentEditDialog
        student={crud.editTarget}
        open={!!crud.editTarget}
        onClose={() => crud.setEditTarget(null)}
      />

      <StudentDeleteDialog
        student={crud.deleteTarget}
        open={!!crud.deleteTarget}
        onClose={() => crud.setDeleteTarget(null)}
      />
    </AdminPageShell>
  );
}
