"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { EntityTablePagination } from "@/app/components/admin/entity-table-pagination";
import { TableSkeleton } from "@/app/components/admin/table-skeleton";
import { Pencil, Trash2, GraduationCap, Undo2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useListStudentsQuery,
  useUpdateStudentMutation,
} from "@/api/admin/students";
import { useStudentPrecache } from "@/hooks/useStudentPrecache";
import type { StudentProfile } from "@/types/students";
import { studentColumns } from "./student-columns";
import { useCrudListPage } from "@/hooks/useCrudListPage";

export type TabValue = "aktif" | "alumni";

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
  const [confirmRevert, setConfirmRevert] = useState(false);

  const handleAlumni = async () => {
    await updateStudent({ siswaId: student.siswa_id, body: { status_siswa: "Lulus" } });
    setConfirmAlumni(false);
  };

  const handleRevert = async () => {
    await updateStudent({ siswaId: student.siswa_id, body: { status_siswa: "Aktif" } });
    setConfirmRevert(false);
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
              </>
            }
            confirmLabel={isLoading ? "Memproses..." : "Ya, Tandai Alumni"}
            confirmVariant="destructive"
            confirmDisabled={isLoading}
            onConfirm={handleAlumni}
          />
        </>
      )}
      {isAlumniTab && (
        <>
          <Button
            variant="ghost"
            size="icon"
            title="Kembalikan ke Siswa Aktif"
            disabled={isLoading}
            onClick={() => setConfirmRevert(true)}
          >
            <Undo2 className="h-4 w-4 text-primary" />
          </Button>
          <ConfirmDialog
            open={confirmRevert}
            onOpenChange={setConfirmRevert}
            title="Kembalikan ke Siswa Aktif"
            description={
              <>
                Status <b>{student.nama_lengkap}</b> akan dikembalikan menjadi <b>Aktif</b>.
              </>
            }
            confirmLabel={isLoading ? "Memproses..." : "Ya, Kembalikan"}
            confirmVariant="default"
            confirmDisabled={isLoading}
            onConfirm={handleRevert}
          />
        </>
      )}
    </div>
  );
}

export function StudentTabPanel({
  tab,
  crud,
  selectedIds,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
}: {
  tab: TabValue;
  crud: ReturnType<typeof useCrudListPage<StudentProfile>>;
  selectedIds: Set<string>;
  onToggle: (id: string, allIds: string[], shiftHeld: boolean) => void;
  onToggleAll: (ids: string[]) => void;
  onEdit: (s: StudentProfile) => void;
  onDelete: (s: StudentProfile) => void;
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
        <Button size="sm" variant="outline" onClick={() => void refetch()}>Coba Lagi</Button>
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

