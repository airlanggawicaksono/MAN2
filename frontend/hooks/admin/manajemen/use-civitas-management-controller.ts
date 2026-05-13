"use client";

import { useState } from "react";
import { useListTeachersQuery, useDeleteTeacherMutation, useLazyListTeachersQuery } from "@/api/admin/teachers";
import type { GuruProfile } from "@/types/teachers";
import { useTeacherPrecache } from "@/hooks/useTeacherPrecache";
import { useCrudListPage } from "@/hooks/useCrudListPage";
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

export function useCivitasManagementController() {
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

  return {
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
  };
}

