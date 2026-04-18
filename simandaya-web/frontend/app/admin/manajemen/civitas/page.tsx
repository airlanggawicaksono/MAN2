"use client";

import { useListTeachersQuery } from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import { useTeacherPrecache } from "@/hooks/useTeacherPrecache";
import { useCrudListPage } from "@/hooks/useCrudListPage";
import { DataTable } from "@/components/ui/data-table";
import { teacherColumns } from "./teacher-columns";
import { TeacherEditDialog } from "./teacher-edit-dialog";
import { TeacherDeleteDialog } from "./teacher-delete-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { withActionsColumn } from "@/app/components/admin/row-edit-delete-actions";

export default function CivitasAkademikPage() {
  const crud = useCrudListPage<GuruProfile>();

  const { data, isLoading, error, refetch } = useListTeachersQuery({
    skip: crud.skip,
    limit: crud.limit,
    search: crud.debouncedSearch,
  });

  const total = data?.total ?? 0;
  useTeacherPrecache(crud.skip, total, crud.debouncedSearch);

  const columnsWithActions = withActionsColumn(
    teacherColumns,
    crud.setEditTarget,
    crud.setDeleteTarget,
  );

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Data Civitas Akademik</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola data guru dan tenaga kependidikan MAN 2 Kota Yogyakarta
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Civitas Akademik</h2>

        <EntitySearchInput
          placeholder="Cari civitas..."
          value={crud.searchInput}
          onChange={crud.handleSearchChange}
        />

        {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
        {error && <p className="text-destructive">Gagal memuat data civitas.</p>}
        {data && <DataTable columns={columnsWithActions} data={data.items} />}

        {data ? (
          <EntityTablePagination
            skip={crud.skip}
            limit={crud.limit}
            total={total}
            itemLabel="civitas"
            onSkipChange={crud.setSkip}
          />
        ) : null}
      </div>

      <TeacherEditDialog
        teacher={crud.editTarget}
        open={!!crud.editTarget}
        onClose={() => crud.setEditTarget(null)}
        onSaved={async () => {
          await refetch();
        }}
      />

      <TeacherDeleteDialog
        teacher={crud.deleteTarget}
        open={!!crud.deleteTarget}
        onClose={() => crud.setDeleteTarget(null)}
      />
    </div>
  );
}
