"use client";

import { useState } from "react";
import { useListStudentsQuery } from "@/api/admin/students";
import type { StudentProfile } from "@/types/students";
import { useStudentPrecache } from "@/hooks/useStudentPrecache";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ui/data-table";
import { StudentForm } from "./student-form";
import { studentColumns } from "./student-columns";
import { StudentEditDialog } from "./student-edit-dialog";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { RowEditDeleteActions } from "@/app/components/admin/row-edit-delete-actions";

const LIMIT = 30;

export default function DataSiswaPage() {
  const [skip, setSkip] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, error } = useListStudentsQuery({
    skip,
    limit: LIMIT,
    search: debouncedSearch || undefined,
  });

  const total = data?.total ?? 0;
  useStudentPrecache(skip, total, debouncedSearch || undefined);

  const [editTarget, setEditTarget] = useState<StudentProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSkip(0);
  };

  const columnsWithActions = [
    ...studentColumns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: { original: StudentProfile } }) => (
        <RowEditDeleteActions
          rowData={row.original}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Data Siswa</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola data siswa MAN 2 Kota Yogyakarta
        </p>
      </div>

      <StudentForm />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Siswa</h2>

        <EntitySearchInput
          placeholder="Cari siswa..."
          value={searchInput}
          onChange={handleSearchChange}
        />

        {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
        {error && <p className="text-destructive">Gagal memuat data siswa.</p>}
        {data && <DataTable columns={columnsWithActions} data={data.items} />}

        {data ? (
          <EntityTablePagination
            skip={skip}
            limit={LIMIT}
            total={total}
            itemLabel="siswa"
            onSkipChange={setSkip}
          />
        ) : null}
      </div>

      <StudentEditDialog
        student={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      <StudentDeleteDialog
        student={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
