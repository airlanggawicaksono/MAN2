"use client";

import { Trash, Upload, UserPlus } from "lucide-react";
import type { GuruProfile } from "@/types/teachers";
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
import { useCivitasManagementController } from "./use-civitas-management-controller";

export default function CivitasAkademikPage() {
  const {
    crud,
    data,
    isLoading,
    error,
    refetch,
    items,
    allSelected,
    someSelected,
    selectedIds,
    setSelectedIds,
    deletingBulk,
    bulkConfirmDelete,
    setBulkConfirmDelete,
    showImport,
    setShowImport,
    showCreate,
    setShowCreate,
    exporter,
    handleToggle,
    handleToggleAll,
    handleBulkDelete,
  } = useCivitasManagementController();
  const total = data?.total ?? 0;

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
            Impor CSV/XLSX
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
