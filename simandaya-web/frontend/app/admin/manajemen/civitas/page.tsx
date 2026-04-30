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
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <AdminPageShell
      title="Pengaturan Data Civitas Akademik"
      description="Kelola data guru dan tenaga kependidikan MAN 2 Kota Yogyakarta."
    >
      <Card className="border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Daftar Civitas Akademik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

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
        </CardContent>
      </Card>

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
    </AdminPageShell>
  );
}
