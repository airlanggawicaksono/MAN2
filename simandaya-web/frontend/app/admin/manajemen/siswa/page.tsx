"use client";

import { useListStudentsQuery } from "@/api/admin/students";
import type { StudentProfile } from "@/types/students";
import { useStudentPrecache } from "@/hooks/useStudentPrecache";
import { useCrudListPage } from "@/hooks/useCrudListPage";
import { DataTable } from "@/components/ui/data-table";
import { StudentForm } from "./student-form";
import { studentColumns } from "./student-columns";
import { StudentEditDialog } from "./student-edit-dialog";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { withActionsColumn } from "@/app/components/admin/row-edit-delete-actions";

export default function DataSiswaPage() {
  const crud = useCrudListPage<StudentProfile>();

  const { data, isLoading, error } = useListStudentsQuery({
    skip: crud.skip,
    limit: crud.limit,
    search: crud.debouncedSearch,
  });

  const total = data?.total ?? 0;
  useStudentPrecache(crud.skip, total, crud.debouncedSearch);

  const columnsWithActions = withActionsColumn(
    studentColumns,
    crud.setEditTarget,
    crud.setDeleteTarget,
  );

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
