"use client";

import { useState } from "react";
import React from "react";
import { GraduationCap, Trash, Undo2 } from "lucide-react";
import {
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useLazyListStudentsQuery,
} from "@/api/admin/students";
import { useCrudListPage } from "@/hooks/useCrudListPage";
import type { StudentProfile } from "@/types/students";
import { useEntityExport } from "@/hooks/useEntityExport";
import type { ExportColumn } from "@/lib/exportSheet";
import type { TabValue } from "@/app/admin/manajemen/siswa/student-tab-panel";

const STUDENT_EXPORT_COLUMNS: ExportColumn<StudentProfile>[] = [
  { header: "nisn", accessor: (r) => r.nisn },
  { header: "nama_lengkap", accessor: (r) => r.nama_lengkap },
  { header: "jenis_kelamin", accessor: (r) => r.jenis_kelamin },
  { header: "tempat_lahir", accessor: (r) => r.tempat_lahir },
  { header: "dob", accessor: (r) => r.dob },
  { header: "alamat", accessor: (r) => r.alamat },
  { header: "kelas_jurusan", accessor: (r) => r.kelas_jurusan },
  { header: "tahun_masuk", accessor: (r) => r.tahun_masuk },
  { header: "status_siswa", accessor: (r) => r.status_siswa },
  { header: "nama_wali", accessor: (r) => r.nama_wali },
  { header: "no_telephone_wali", accessor: (r) => r.no_telephone_wali },
  { header: "kontak", accessor: (r) => r.kontak },
  { header: "rfid_number", accessor: (r) => r.rfid_number },
];

export function useSiswaManagementController() {
  const crudAktif = useCrudListPage<StudentProfile>();
  const crudAlumni = useCrudListPage<StudentProfile>();
  const [activeTab, setActiveTab] = useState<TabValue>("aktif");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);
  const [bulkConfirmAlumni, setBulkConfirmAlumni] = useState(false);
  const [bulkConfirmRevert, setBulkConfirmRevert] = useState(false);

  const [deleteStudent, { isLoading: deletingBulk }] = useDeleteStudentMutation();
  const [updateStudent, { isLoading: updatingBulk }] = useUpdateStudentMutation();
  const [fetchStudents] = useLazyListStudentsQuery();

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

  async function handleBulkRevert() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateStudent({ siswaId: id, body: { status_siswa: "Aktif" } });
    }
    setSelectedIds(new Set());
    setBulkConfirmRevert(false);
  }

  const exporter = useEntityExport<StudentProfile>({
    fetchFiltered: () =>
      fetchStudents({
        skip: 0,
        limit: 10000,
        search: crud.debouncedSearch,
        status_siswa: activeTab === "aktif" ? "Aktif" : "Lulus",
      }).unwrap(),
    fetchAll: () => fetchStudents({ skip: 0, limit: 10000 }).unwrap(),
    columns: STUDENT_EXPORT_COLUMNS,
    filenames: {
      filtered: `siswa-${activeTab}-tampilan`,
      all: "siswa-semua",
    },
  });

  const bulkActions = activeTab === "aktif"
    ? [
        {
          label: "Jadikan Alumni",
          icon: React.createElement(GraduationCap, { className: "h-4 w-4" }),
          variant: "outline" as const,
          disabled: updatingBulk,
          onClick: () => setBulkConfirmAlumni(true),
        },
        {
          label: "Hapus",
          icon: React.createElement(Trash, { className: "h-4 w-4" }),
          variant: "destructive" as const,
          disabled: deletingBulk,
          onClick: () => setBulkConfirmDelete(true),
        },
      ]
    : [
        {
          label: "Kembalikan ke Aktif",
          icon: React.createElement(Undo2, { className: "h-4 w-4" }),
          variant: "outline" as const,
          disabled: updatingBulk,
          onClick: () => setBulkConfirmRevert(true),
        },
        {
          label: "Hapus",
          icon: React.createElement(Trash, { className: "h-4 w-4" }),
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

  return {
    crudAktif,
    crudAlumni,
    activeTab,
    handleTabChange,
    crud,
    showCreate,
    setShowCreate,
    showImport,
    setShowImport,
    selectedIds,
    setSelectedIds,
    bulkConfirmDelete,
    setBulkConfirmDelete,
    bulkConfirmAlumni,
    setBulkConfirmAlumni,
    bulkConfirmRevert,
    setBulkConfirmRevert,
    deletingBulk,
    updatingBulk,
    handleToggle,
    handleToggleAll,
    handleBulkDelete,
    handleBulkAlumni,
    handleBulkRevert,
    bulkActions,
    exporter,
  };
}
