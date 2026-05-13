"use client";

import { useState } from "react";
import { Trash, Upload, UserPlus } from "lucide-react";
import {
  useListTeachersQuery,
  useDeleteTeacherMutation,
  useLazyListTeachersQuery,
} from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import { useTeacherPrecache } from "@/hooks/useTeacherPrecache";
import { useCrudListPage } from "@/hooks/useCrudListPage";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { teacherColumns } from "./teacher-columns";
import { TeacherEditDialog } from "./teacher-edit-dialog";
import { TeacherDeleteDialog } from "./teacher-delete-dialog";
import { TeacherImportDialog } from "./teacher-import-dialog";
import { TeacherCreateDialog } from "./teacher-create-dialog";
import { EntitySearchInput } from "@/app/components/admin/entity-search-input";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { RowEditDeleteActions } from "@/app/components/admin/row-edit-delete-actions";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";
import { BulkActionBar } from "@/app/components/admin/bulk-action-bar";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { EntityExportDialog } from "@/app/components/admin/entity-export-dialog";
import { ExportActionButtons } from "@/app/components/admin/export-action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/app/components/admin/table-skeleton";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useEntityExport } from "@/hooks/useEntityExport";
import type { ExportColumn } from "@/lib/exportSheet";

const TEACHER_EXPORT_COLUMNS: ExportColumn<GuruProfile>[] = [
  { header: "nip", accessor: (r) => r.nip },
  { header: "nama_lengkap", accessor: (r) => r.nama_lengkap },
  { header: "nik", accessor: (r) => r.nik },
  { header: "jenis_kelamin", accessor: (r) => r.jenis_kelamin },
  { header: "tempat_lahir", accessor: (r) => r.tempat_lahir },
  { header: "dob", accessor: (r) => r.dob },
  { header: "alamat", accessor: (r) => r.alamat },
  { header: "mata_pelajaran", accessor: (r) => r.mata_pelajaran },
  { header: "pendidikan_terakhir", accessor: (r) => r.pendidikan_terakhir },
  { header: "tahun_masuk", accessor: (r) => r.tahun_masuk },
  { header: "status_guru", accessor: (r) => r.status_guru },
  { header: "kontak", accessor: (r) => r.kontak },
  {
    header: "jabatan_struktural",
    accessor: (r) =>
      r.structural_assignments
        .filter((a) => a.is_active)
        .map((a) => a.role_name ?? "")
        .filter(Boolean)
        .join("; "),
  },
];

export default function CivitasAkademikPage() {
  const crud = useCrudListPage<GuruProfile>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [fetchTeachers] = useLazyListTeachersQuery();

  const { data, isLoading, error, refetch } = useListTeachersQuery({
    skip: crud.skip,
    limit: crud.limit,
    search: crud.debouncedSearch,
  });

  const total = data?.total ?? 0;
  useTeacherPrecache(crud.skip, total, crud.debouncedSearch);
  const [deleteTeacher, { isLoading: deletingBulk }] = useDeleteTeacherMutation();

  const items = data?.items ?? [];
  const allIds = items.map((t) => t.guru_id);
  const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function handleToggle(id: string, shiftHeld: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftHeld && lastSelectedIndex !== null) {
        const clickedIndex = allIds.indexOf(id);
        const lo = Math.min(lastSelectedIndex, clickedIndex);
        const hi = Math.max(lastSelectedIndex, clickedIndex);
        const shouldSelect = !prev.has(id);
        for (let i = lo; i <= hi; i++) {
          if (shouldSelect) next.add(allIds[i]);
          else next.delete(allIds[i]);
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      setLastSelectedIndex(allIds.indexOf(id));
      return next;
    });
  }

  function handleToggleAll() {
    const allSel = allIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSel) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
    setLastSelectedIndex(null);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteTeacher(id);
    }
    setSelectedIds(new Set());
    setBulkConfirmDelete(false);
  }

  const exporter = useEntityExport<GuruProfile>({
    fetchFiltered: () =>
      fetchTeachers({ skip: 0, limit: 10000, search: crud.debouncedSearch }).unwrap(),
    fetchAll: () => fetchTeachers({ skip: 0, limit: 10000 }).unwrap(),
    columns: TEACHER_EXPORT_COLUMNS,
    filenames: { filtered: "civitas-tampilan", all: "civitas-semua" },
  });

  const checkboxCol: ColumnDef<GuruProfile, unknown> = {
    id: "select",
    header: () => (
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onChange={handleToggleAll}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedIds.has(row.original.guru_id)}
        onChange={(e) => handleToggle(row.original.guru_id, (e.nativeEvent as MouseEvent).shiftKey)}
        aria-label={`Pilih ${row.original.nama_lengkap}`}
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };

  const actionsCol: ColumnDef<GuruProfile, unknown> = {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <RowEditDeleteActions
        rowData={row.original}
        onEdit={crud.setEditTarget}
        onDelete={crud.setDeleteTarget}
      />
    ),
  };

  const columns: ColumnDef<GuruProfile, unknown>[] = [checkboxCol, ...teacherColumns, actionsCol];

  return (
    <AdminPageShell
      eyebrow="Manajemen Data"
      title="Civitas Akademik"
      description="Kelola data guru dan tenaga kependidikan MAN 2 Yogyakarta."
      actions={
        <>
          <ExportActionButtons onTrigger={exporter.open} disabled={exporter.exporting} />
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Impor CSV
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Civitas
          </Button>
        </>
      }
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

        {isLoading && <TableSkeleton label="Memuat data civitas" />}
        {error && (
          <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-sm text-destructive">Gagal memuat data civitas.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        )}
        {data && <DataTable columns={columns} data={items} />}

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

      <BulkActionBar
        selectedCount={selectedIds.size}
        actions={[
          {
            label: "Hapus",
            icon: <Trash className="h-4 w-4" />,
            variant: "destructive",
            disabled: deletingBulk,
            onClick: () => setBulkConfirmDelete(true),
          },
        ]}
        onClear={() => setSelectedIds(new Set())}
      />

      <ConfirmDialog
        open={bulkConfirmDelete}
        onOpenChange={setBulkConfirmDelete}
        title="Hapus Civitas Terpilih"
        description={`${selectedIds.size} data civitas akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deletingBulk ? "Menghapus..." : `Hapus ${selectedIds.size} Data`}
        confirmVariant="destructive"
        confirmDisabled={deletingBulk}
        onConfirm={handleBulkDelete}
      />

      <TeacherEditDialog
        teacher={crud.editTarget}
        open={!!crud.editTarget}
        onClose={() => crud.setEditTarget(null)}
        onSaved={async () => { await refetch(); }}
      />

      <TeacherDeleteDialog
        teacher={crud.deleteTarget}
        open={!!crud.deleteTarget}
        onClose={() => crud.setDeleteTarget(null)}
      />

      <TeacherImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
      />

      <TeacherCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <EntityExportDialog
        scope={exporter.scope}
        onClose={exporter.close}
        entityLabel="Civitas"
        isLoading={exporter.exporting}
        onExport={exporter.handleExport}
      />
    </AdminPageShell>
  );
}
