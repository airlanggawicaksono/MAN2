"use client";

import { useState } from "react";
import { Pencil, Trash2, GraduationCap, Upload, UserPlus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { useListStudentsQuery, useUpdateStudentMutation, useDeleteStudentMutation } from "@/api/admin/students";
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
import { BulkActionBar } from "@/app/components/admin/bulk-action-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { TableSkeleton } from "@/app/components/admin/table-skeleton";

type TabValue = "aktif" | "alumni";

function StudentRowActions({
  student,
  isAlumniTab,
  onEdit,
  onDelete,
}: {
  student: StudentProfile;
  isAlumniTab: boolean;
  onEdit: (s: StudentProfile) => void;
  onDelete: (s: StudentProfile) => void;
}) {
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const [confirmAlumni, setConfirmAlumni] = useState(false);

  const handleAlumni = async () => {
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
      {!isAlumniTab && (
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

function StudentTabPanel({
  tab,
  crud,
  selectedIds,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onRefetch,
}: {
  tab: TabValue;
  crud: ReturnType<typeof useCrudListPage<StudentProfile>>;
  selectedIds: Set<string>;
  onToggle: (id: string, allIds: string[], shiftHeld: boolean) => void;
  onToggleAll: (ids: string[]) => void;
  onEdit: (s: StudentProfile) => void;
  onDelete: (s: StudentProfile) => void;
  onRefetch: () => void;
}) {
  const statusFilter = tab === "aktif" ? "Aktif" : "Lulus";

  const { data, isLoading, error, refetch } = useListStudentsQuery({
    skip: crud.skip,
    limit: crud.limit,
    search: crud.debouncedSearch,
    status_siswa: statusFilter,
  });

  const total = data?.total ?? 0;
  useStudentPrecache(crud.skip, total, crud.debouncedSearch);

  const items = data?.items ?? [];
  const allIds = items.map((s) => s.siswa_id);
  const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const checkboxCol: ColumnDef<StudentProfile, unknown> = {
    id: "select",
    header: () => (
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onChange={() => onToggleAll(allIds)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedIds.has(row.original.siswa_id)}
        onChange={(e) => onToggle(row.original.siswa_id, allIds, (e.nativeEvent as MouseEvent).shiftKey)}
        aria-label={`Pilih ${row.original.nama_lengkap}`}
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };

  const actionsCol: ColumnDef<StudentProfile, unknown> = {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <StudentRowActions
        student={row.original}
        isAlumniTab={tab === "alumni"}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  };

  const columns: ColumnDef<StudentProfile, unknown>[] = [checkboxCol, ...studentColumns, actionsCol];

  if (isLoading) return <TableSkeleton label={`Memuat data ${tab === "aktif" ? "siswa" : "alumni"}`} />;

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
        <p className="text-sm text-destructive">Gagal memuat data siswa.</p>
        <Button size="sm" variant="outline" onClick={() => { void refetch(); onRefetch(); }}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={items} />
      {data && (
        <EntityTablePagination
          skip={crud.skip}
          limit={crud.limit}
          total={total}
          itemLabel={tab === "aktif" ? "siswa aktif" : "alumni"}
          onSkipChange={crud.setSkip}
        />
      )}
    </>
  );
}

export default function DataSiswaPage() {
  const crudAktif = useCrudListPage<StudentProfile>();
  const crudAlumni = useCrudListPage<StudentProfile>();
  const [activeTab, setActiveTab] = useState<TabValue>("aktif");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);
  const [bulkConfirmAlumni, setBulkConfirmAlumni] = useState(false);

  const [deleteStudent, { isLoading: deletingBulk }] = useDeleteStudentMutation();
  const [updateStudent, { isLoading: updatingBulk }] = useUpdateStudentMutation();

  const crud = activeTab === "aktif" ? crudAktif : crudAlumni;

  function handleToggle(id: string, allIds: string[], shiftHeld: boolean) {
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

  function handleToggleAll(allIds: string[]) {
    const allSelected = allIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
    setLastSelectedIndex(null);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteStudent(id);
    }
    setSelectedIds(new Set());
    setBulkConfirmDelete(false);
  }

  async function handleBulkAlumni() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateStudent({ siswaId: id, body: { status_siswa: "Lulus" } });
    }
    setSelectedIds(new Set());
    setBulkConfirmAlumni(false);
  }

  const bulkActions = activeTab === "aktif"
    ? [
        {
          label: "Jadikan Alumni",
          icon: <GraduationCap className="h-4 w-4" />,
          variant: "outline" as const,
          disabled: updatingBulk,
          onClick: () => setBulkConfirmAlumni(true),
        },
        {
          label: "Hapus",
          icon: <Trash className="h-4 w-4" />,
          variant: "destructive" as const,
          disabled: deletingBulk,
          onClick: () => setBulkConfirmDelete(true),
        },
      ]
    : [
        {
          label: "Hapus",
          icon: <Trash className="h-4 w-4" />,
          variant: "destructive" as const,
          disabled: deletingBulk,
          onClick: () => setBulkConfirmDelete(true),
        },
      ];

  function handleTabChange(val: string) {
    setActiveTab(val as TabValue);
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }

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
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 h-9 rounded-lg bg-muted/60 p-1">
          <TabsTrigger value="aktif" className="rounded-md px-4 text-sm">
            Siswa Aktif
          </TabsTrigger>
          <TabsTrigger value="alumni" className="rounded-md px-4 text-sm">
            Alumni
          </TabsTrigger>
        </TabsList>

        {(["aktif", "alumni"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <Card className="border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {tab === "aktif" ? "Daftar Siswa Aktif" : "Daftar Alumni"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EntitySearchInput
                  placeholder={`Cari ${tab === "aktif" ? "siswa" : "alumni"} (NISN/Nama)...`}
                  value={crud.searchInput}
                  onChange={crud.handleSearchChange}
                />
                <StudentTabPanel
                  tab={tab}
                  crud={tab === "aktif" ? crudAktif : crudAlumni}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                  onEdit={crud.setEditTarget}
                  onDelete={crud.setDeleteTarget}
                  onRefetch={() => {}}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <BulkActionBar
        selectedCount={selectedIds.size}
        actions={bulkActions}
        onClear={() => setSelectedIds(new Set())}
      />

      <StudentCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <StudentImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
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

      <ConfirmDialog
        open={bulkConfirmDelete}
        onOpenChange={setBulkConfirmDelete}
        title="Hapus Siswa Terpilih"
        description={`${selectedIds.size} data siswa akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deletingBulk ? "Menghapus..." : `Hapus ${selectedIds.size} Siswa`}
        confirmVariant="destructive"
        confirmDisabled={deletingBulk}
        onConfirm={handleBulkDelete}
      />

      <ConfirmDialog
        open={bulkConfirmAlumni}
        onOpenChange={setBulkConfirmAlumni}
        title="Tandai sebagai Alumni"
        description={`${selectedIds.size} siswa akan ditandai sebagai Alumni (Lulus). Tindakan ini tidak dapat dibatalkan dari halaman ini.`}
        confirmLabel={updatingBulk ? "Memproses..." : `Tandai ${selectedIds.size} Siswa`}
        confirmVariant="destructive"
        confirmDisabled={updatingBulk}
        onConfirm={handleBulkAlumni}
      />
    </AdminPageShell>
  );
}
