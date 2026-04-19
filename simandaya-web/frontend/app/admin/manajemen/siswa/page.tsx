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
  const isAlumni = student.status_siswa === "Lulus";

  const handleAlumni = async () => {
    if (isAlumni) return;
    await updateStudent({ siswaId: student.siswa_id, body: { status_siswa: "Lulus" } });
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
        <Button
          variant="ghost"
          size="icon"
          title="Jadikan Alumni"
          disabled={isLoading}
          onClick={handleAlumni}
        >
          <GraduationCap className="h-4 w-4 text-amber-600" />
        </Button>
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
    <div className="space-y-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Data Siswa</h1>
          <p className="mt-1 text-muted-foreground">
            Kelola data siswa MAN 2 Kota Yogyakarta
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Siswa</h2>

        <EntitySearchInput
          placeholder="Cari siswa (NIS/NIM/Nama)..."
          value={crud.searchInput}
          onChange={crud.handleSearchChange}
        />

        {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
        {error && <p className="text-destructive">Gagal memuat data siswa.</p>}
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
      </div>

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
    </div>
  );
}
