"use client";

import { useState } from "react";
import { useListTeachersQuery } from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import { useTeacherPrecache } from "@/hooks/useTeacherPrecache";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ui/data-table";
import { TeacherForm } from "./teacher-form";
import { teacherColumns } from "./teacher-columns";
import { TeacherEditDialog } from "./teacher-edit-dialog";
import { TeacherDeleteDialog } from "./teacher-delete-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { RowEditDeleteActions } from "@/app/components/admin/row-edit-delete-actions";

const LIMIT = 30;

export default function CivitasAkademikPage() {
  const [skip, setSkip] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, error, refetch } = useListTeachersQuery({
    skip,
    limit: LIMIT,
    search: debouncedSearch || undefined,
  });

  const total = data?.total ?? 0;
  useTeacherPrecache(skip, total, debouncedSearch || undefined);

  const [editTarget, setEditTarget] = useState<GuruProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuruProfile | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSkip(0);
  };

  const columnsWithActions = [
    ...teacherColumns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: { row: { original: GuruProfile } }) => (
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
        <h1 className="text-2xl font-bold">Pengaturan Data Civitas Akademik</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola data guru dan tenaga kependidikan MAN 2 Kota Yogyakarta
        </p>
      </div>

      <TeacherForm />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Daftar Civitas Akademik</h2>

        <EntitySearchInput
          placeholder="Cari civitas..."
          value={searchInput}
          onChange={handleSearchChange}
        />

        {isLoading && <p className="text-muted-foreground">Memuat data...</p>}
        {error && (
          <p className="text-destructive">
            Gagal memuat data civitas: {JSON.stringify(error)}
          </p>
        )}
        {data && <DataTable columns={columnsWithActions} data={data.items} />}

        {data ? (
          <EntityTablePagination
            skip={skip}
            limit={LIMIT}
            total={total}
            itemLabel="civitas"
            onSkipChange={setSkip}
          />
        ) : null}
      </div>

      <TeacherEditDialog
        teacher={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          void refetch();
        }}
      />

      <TeacherDeleteDialog
        teacher={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
