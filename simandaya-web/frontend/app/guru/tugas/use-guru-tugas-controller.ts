"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGetMyGuruAcademicContextQuery,
  useListSiswaInKelasQuery,
} from "@/api/shared/akademik";
import { useGuruAcademicContext } from "@/hooks/useGuruAcademicContext";
import {
  useBulkCreateNilaiMutation,
  useCreateTugasMutation,
  useDeleteTugasMutation,
  useListNilaiByTugasQuery,
  useListSubmissionsByTugasQuery,
  useListTugasByKelasQuery,
  useUpdateTugasMutation,
} from "@/api/shared/penilaian";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  GuruAcademicContextKelas,
  GuruAcademicContextSemester,
  GuruAcademicContextTahunAjaran,
  GuruMapelResponse,
} from "@/types/akademik/jadwal";

export function useGuruTugasController() {
  const { data: context } = useGetMyGuruAcademicContextQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const assignments: GuruMapelResponse[] = context?.assignments ?? [];
  const tahunAjaranList: GuruAcademicContextTahunAjaran[] =
    context?.tahun_ajaran ?? [];
  const semesters: GuruAcademicContextSemester[] = context?.semesters ?? [];
  const kelasList: GuruAcademicContextKelas[] = context?.kelas ?? [];

  const {
    selectedTahunAjaranId,
    selectedSemesterId,
    selectedKelasId: selectedClassId,
    setSelectedTahunAjaranId,
    setSelectedSemesterId,
    setSelectedKelasId: setSelectedClassId,
    semesterOptions,
    classOptions: rawClassOptions,
  } = useGuruAcademicContext({
    tahunAjaranList,
    semesters,
    kelasList,
    allowAllKelas: true,
  });

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [selectedTugasId, setSelectedTugasId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, "0");
    const dd = `${now.getDate()}`.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [dateTo, setDateTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreatingTugas, setIsCreatingTugas] = useState(false);
  const [isEditingTugas, setIsEditingTugas] = useState(false);
  const [isDeletingTugas, setIsDeletingTugas] = useState(false);

  const [newTugasForm, setNewTugasForm] = useState({
    judul: "",
    jenis: "Tugas",
    deskripsi: "",
    link_tugas: "",
    link_submission: "",
    deadline_local: "",
    is_published_to_students: true,
    is_nilai_published_to_students: true,
  });
  const [editTugasForm, setEditTugasForm] = useState({
    judul: "",
    deskripsi: "",
    link_tugas: "",
    link_submission: "",
    deadline_local: "",
    is_published_to_students: true,
    is_nilai_published_to_students: true,
  });

  const assignmentsByTahunAjaran = useMemo(() => {
    if (!selectedTahunAjaranId) return assignments;
    return assignments.filter((a) => a.tahun_ajaran_id === selectedTahunAjaranId);
  }, [assignments, selectedTahunAjaranId]);

  const classOptions = useMemo(() => {
    return rawClassOptions
      .filter((k) => k.kelas_id !== "all")
      .map((k) => ({
        kelas_id: k.kelas_id,
        kelas_nama: k.nama_kelas,
      }));
  }, [rawClassOptions]);

  const filteredAssignments = useMemo(() => {
    if (selectedClassId === "all") return assignmentsByTahunAjaran;
    return assignmentsByTahunAjaran.filter((a) => a.kelas_id === selectedClassId);
  }, [assignmentsByTahunAjaran, selectedClassId]);

  useEffect(() => {
    if (!filteredAssignments.length) {
      setSelectedAssignmentId("");
      setSelectedTugasId("");
      return;
    }
    const stillExists = filteredAssignments.some(
      (a) => a.guru_mapel_id === selectedAssignmentId,
    );
    if (!selectedAssignmentId || !stillExists) {
      setSelectedAssignmentId(filteredAssignments[0].guru_mapel_id);
      setSelectedTugasId("");
    }
  }, [filteredAssignments, selectedAssignmentId]);

  const selectedAssignment = useMemo(
    () =>
      filteredAssignments.find((a) => a.guru_mapel_id === selectedAssignmentId),
    [filteredAssignments, selectedAssignmentId],
  );

  const {
    currentData: tugasCurrentData,
    isError: isTugasError,
  } = useListTugasByKelasQuery(
    {
      kelasId: selectedAssignment?.kelas_id || "",
      semesterId: selectedSemesterId || "",
      mapelId: selectedAssignment?.mapel_id,
    },
    { skip: !selectedAssignment || !selectedSemesterId, refetchOnMountOrArgChange: true },
  );
  const tugasList = useMemo(
    () => (isTugasError ? [] : (tugasCurrentData ?? [])),
    [isTugasError, tugasCurrentData],
  );

  const filteredTugasList = useMemo(() => {
    const fromMs = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const toMs = dateTo
      ? new Date(`${dateTo}T23:59:59`).getTime()
      : Number.POSITIVE_INFINITY;
    const now = Date.now();

    return tugasList.filter((t) => {
      const createdMs = new Date(t.created_at).getTime();
      const deadlineMs = t.deadline
        ? new Date(t.deadline).getTime()
        : Number.POSITIVE_INFINITY;
      const inRange = createdMs <= toMs && deadlineMs >= fromMs;
      if (!inRange) return false;
      if (statusFilter === "active") return !t.deadline || deadlineMs >= now;
      if (statusFilter === "late") return !!t.deadline && deadlineMs < now;
      return true;
    });
  }, [tugasList, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    if (!filteredTugasList.length) {
      setSelectedTugasId("");
      return;
    }
    const exists = filteredTugasList.some((t) => t.tugas_id === selectedTugasId);
    if (!selectedTugasId || !exists) {
      setSelectedTugasId(filteredTugasList[0].tugas_id);
    }
  }, [filteredTugasList, selectedTugasId]);

  const selectedTugas = useMemo(
    () => filteredTugasList.find((t) => t.tugas_id === selectedTugasId),
    [filteredTugasList, selectedTugasId],
  );

  const { data: students = [] } = useListSiswaInKelasQuery(
    selectedTugas?.kelas_id || "",
    { skip: !selectedTugas?.kelas_id },
  );

  const {
    currentData: existingGradesCurrentData,
    isError: isNilaiError,
  } = useListNilaiByTugasQuery(selectedTugasId, {
    skip: !selectedTugasId,
    refetchOnMountOrArgChange: true,
  });
  const existingGrades = useMemo(
    () => (isNilaiError ? [] : (existingGradesCurrentData ?? [])),
    [isNilaiError, existingGradesCurrentData],
  );

  const {
    currentData: submissionsCurrentData,
    isError: isSubmissionError,
  } = useListSubmissionsByTugasQuery(selectedTugasId, {
    skip: !selectedTugasId,
    refetchOnMountOrArgChange: true,
  });
  const submissions = useMemo(
    () => (isSubmissionError ? [] : (submissionsCurrentData ?? [])),
    [isSubmissionError, submissionsCurrentData],
  );

  const submissionByUserId = useMemo(() => {
    const map = new Map<string, (typeof submissions)[number]>();
    submissions.forEach((submission) => {
      map.set(submission.user_id, submission);
    });
    return map;
  }, [submissions]);

  const [gradesDraft, setGradesDraft] = useState<
    Record<string, { nilai?: number; catatan?: string }>
  >({});
  useEffect(() => {
    const draft: Record<string, { nilai?: number; catatan?: string }> = {};
    existingGrades.forEach((g) => {
      draft[g.user_id] = { nilai: g.nilai, catatan: g.catatan ?? "" };
    });
    setGradesDraft(draft);
  }, [existingGrades]);

  const [bulkCreateNilai, { isLoading: isSaving }] = useBulkCreateNilaiMutation();
  const [createTugas, { isLoading: isCreating }] = useCreateTugasMutation();
  const [updateTugas, { isLoading: isUpdatingTugas }] = useUpdateTugasMutation();
  const [deleteTugas, { isLoading: isDeletingTugasRequest }] = useDeleteTugasMutation();
  const buildErrorMessage = (error: unknown, fallback: string) =>
    getApiErrorMessage(error) || fallback;

  const handleSaveGrades = async () => {
    if (!selectedTugasId) return;
    const entries = Object.entries(gradesDraft)
      .filter(([, value]) => typeof value.nilai === "number")
      .map(([user_id, value]) => ({
        user_id,
        nilai: value.nilai as number,
        catatan: value.catatan || undefined,
      }));

    if (entries.length === 0) {
      notifyError("Belum ada nilai yang diisi.");
      return;
    }
    try {
      await bulkCreateNilai({
        tugasId: selectedTugasId,
        body: { entries },
      }).unwrap();
      notifySuccess("Nilai berhasil disimpan.");
    } catch (error) {
      notifyError(buildErrorMessage(error, "Gagal menyimpan nilai."));
    }
  };

  const handleCreateTugas = async () => {
    if (!selectedAssignment || !selectedSemesterId) return;
    try {
      const data = await createTugas({
        semester_id: selectedSemesterId,
        kelas_id: selectedAssignment.kelas_id,
        mapel_id: selectedAssignment.mapel_id,
        judul: newTugasForm.judul,
        jenis: newTugasForm.jenis,
        deskripsi: newTugasForm.deskripsi || undefined,
        link_tugas: newTugasForm.link_tugas || undefined,
        link_submission: newTugasForm.link_submission || undefined,
        is_published_to_students: newTugasForm.is_published_to_students,
        is_nilai_published_to_students: newTugasForm.is_nilai_published_to_students,
        deadline: newTugasForm.deadline_local
          ? new Date(newTugasForm.deadline_local).toISOString()
          : undefined,
      }).unwrap();
      setIsCreatingTugas(false);
      setNewTugasForm({
        judul: "",
        jenis: "Tugas",
        deskripsi: "",
        link_tugas: "",
        link_submission: "",
        deadline_local: "",
        is_published_to_students: true,
        is_nilai_published_to_students: true,
      });
      setSelectedTugasId(data.tugas_id);
      notifySuccess("Penugasan berhasil dibuat.");
    } catch (error) {
      notifyError(buildErrorMessage(error, "Gagal membuat penugasan."));
    }
  };

  const handleOpenEditTugas = () => {
    if (!selectedTugas) return;
    setEditTugasForm({
      judul: selectedTugas.judul || "",
      deskripsi: selectedTugas.deskripsi || "",
      link_tugas: selectedTugas.link_tugas || "",
      link_submission: selectedTugas.link_submission || "",
      deadline_local: selectedTugas.deadline
        ? new Date(selectedTugas.deadline).toISOString().slice(0, 16)
        : "",
      is_published_to_students: selectedTugas.is_published_to_students,
      is_nilai_published_to_students:
        selectedTugas.is_nilai_published_to_students,
    });
    setIsEditingTugas(true);
  };

  const handleUpdateTugas = async () => {
    if (!selectedTugas) return;
    try {
      await updateTugas({
        id: selectedTugas.tugas_id,
        body: {
          judul: editTugasForm.judul,
          deskripsi: editTugasForm.deskripsi || undefined,
          link_tugas: editTugasForm.link_tugas || undefined,
          link_submission: editTugasForm.link_submission || undefined,
          is_published_to_students: editTugasForm.is_published_to_students,
          is_nilai_published_to_students:
            editTugasForm.is_nilai_published_to_students,
          deadline: editTugasForm.deadline_local
            ? new Date(editTugasForm.deadline_local).toISOString()
            : undefined,
        },
      }).unwrap();
      setIsEditingTugas(false);
      notifySuccess("Tugas berhasil diperbarui.");
    } catch (error) {
      notifyError(buildErrorMessage(error, "Gagal memperbarui tugas."));
    }
  };

  const handleDeleteTugas = async () => {
    if (!selectedTugas) return;
    try {
      await deleteTugas(selectedTugas.tugas_id).unwrap();
      setIsDeletingTugas(false);
      setSelectedTugasId("");
      notifySuccess("Tugas berhasil dihapus.");
    } catch (error) {
      notifyError(buildErrorMessage(error, "Gagal menghapus tugas."));
    }
  };

  return {
    classOptions,
    dateFrom,
    dateTo,
    editTugasForm,
    filteredAssignments,
    filteredTugasList,
    gradesDraft,
    handleCreateTugas,
    handleDeleteTugas,
    handleOpenEditTugas,
    handleSaveGrades,
    handleUpdateTugas,
    isCreating,
    isCreatingTugas,
    isDeletingTugas,
    isDeletingTugasRequest,
    isEditingTugas,
    isSaving,
    isUpdatingTugas,
    newTugasForm,
    selectedAssignment,
    selectedAssignmentId,
    selectedClassId,
    selectedSemesterId,
    selectedTahunAjaranId,
    selectedTugas,
    selectedTugasId,
    semesterOptions,
    setDateFrom,
    setDateTo,
    setEditTugasForm,
    setGradesDraft,
    setIsCreatingTugas,
    setIsDeletingTugas,
    setIsEditingTugas,
    setNewTugasForm,
    setSelectedAssignmentId,
    setSelectedClassId,
    setSelectedSemesterId,
    setSelectedTahunAjaranId,
    setSelectedTugasId,
    setStatusFilter,
    statusFilter,
    students,
    submissionByUserId,
    submissions,
    tahunAjaranList,
  };
}
