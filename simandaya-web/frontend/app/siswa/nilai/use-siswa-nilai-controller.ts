"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCreateMySubmissionMutation,
  useUpdateMySubmissionMutation,
  useDeleteMySubmissionMutation,
  useGetSiswaOverviewQuery,
} from "@/api/shared/penilaian";
import {
  useListActiveSemestersQuery,
  useListMySemesterTimelineQuery,
} from "@/api/shared/akademik";
import { useGetMyStudentProfileQuery } from "@/api/admin/students";
import { useAppSelector } from "@/store/hooks";
import type { SiswaOverviewTugasItem } from "@/types/penilaian/siswa-overview";
import { notifyError, notifySuccess } from "@/lib/app-notify";

export type SemesterOption = {
  key: string;
  label: string;
  semester_id: string | null;
  tahun_ajaran_nama: string | null;
  tingkat: "X" | "XI" | "XII";
  tipe: "Ganjil" | "Genap";
  is_available: boolean;
  kelas_nama: string | null;
};

export function useSiswaNilaiController() {
  const currentUserId = useAppSelector((state) => state.auth.user?.user_id);

  const { data: timeline = [], isLoading: loadingTimeline } =
    useListMySemesterTimelineQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const { data: profile, isLoading: loadingProfile } = useGetMyStudentProfileQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: activeSemesters = [] } = useListActiveSemestersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const semesterOptions = useMemo<SemesterOption[]>(() => {
    if (!timeline.length) {
      return Array.from({ length: 6 }).map((_, idx) => {
        const semNo = idx + 1;
        const tingkat = semNo <= 2 ? "X" : semNo <= 4 ? "XI" : "XII";
        const tipe = semNo % 2 === 1 ? "Ganjil" : "Genap";
        return {
          key: String(semNo),
          label: `Semester ${semNo} (${tipe})`,
          semester_id: null,
          tahun_ajaran_nama: null,
          tingkat,
          tipe,
          is_available: false,
          kelas_nama: null,
        };
      });
    }
    return timeline
      .slice()
      .sort((a, b) => a.semester_ke - b.semester_ke)
      .map((item) => ({
        key: String(item.semester_ke),
        label: `Semester ${item.semester_ke} (${item.tipe})`,
        semester_id: item.semester_id,
        tahun_ajaran_nama: item.tahun_ajaran_nama,
        tingkat: item.tingkat,
        tipe: item.tipe,
        is_available: item.is_available,
        kelas_nama: item.kelas_nama,
      }));
  }, [timeline]);

  const [selectedSemesterKey, setSelectedSemesterKey] = useState<string>("");
  const [tugasStatusFilter, setTugasStatusFilter] = useState<
    "all" | "not_submitted" | "submitted" | "late_pending"
  >("not_submitted");
  const [tugasDateFrom, setTugasDateFrom] = useState<string>("");
  const [tugasDateTo, setTugasDateTo] = useState<string>("");
  const [deleteMySubmission, { isLoading: isCancellingSubmission }] =
    useDeleteMySubmissionMutation();
  const [createMySubmission, { isLoading: isMarkingSubmittedCreate }] =
    useCreateMySubmissionMutation();
  const [updateMySubmission, { isLoading: isMarkingSubmittedUpdate }] =
    useUpdateMySubmissionMutation();

  const defaultSemesterKey = useMemo(() => {
    const activeSemesterIds = new Set(activeSemesters.map((s) => s.semester_id));
    const activeAvailable = semesterOptions.find(
      (s) => s.is_available && !!s.semester_id && activeSemesterIds.has(s.semester_id),
    );
    if (activeAvailable) return activeAvailable.key;

    if (profile?.semester_ke) {
      const fromProfile = semesterOptions.find(
        (s) => s.key === String(profile.semester_ke) && s.is_available,
      );
      if (fromProfile) return fromProfile.key;
    }
    const latestAvailable = semesterOptions
      .filter((s) => s.is_available)
      .sort((a, b) => Number(b.key) - Number(a.key))[0];
    if (latestAvailable) return latestAvailable.key;
    return "1";
  }, [activeSemesters, profile?.semester_ke, semesterOptions]);

  const effectiveSemesterKey = selectedSemesterKey || defaultSemesterKey;
  const effectiveSemesterOption = useMemo(
    () => semesterOptions.find((s) => s.key === effectiveSemesterKey),
    [semesterOptions, effectiveSemesterKey],
  );
  const effectiveSemesterId = effectiveSemesterOption?.semester_id ?? "";
  const isProfileResolvedForCurrentUser =
    !currentUserId || !profile || profile.user_id === currentUserId;

  useEffect(() => {
    setSelectedSemesterKey("");
    setTugasStatusFilter("not_submitted");
    setTugasDateFrom("");
    setTugasDateTo("");
  }, [currentUserId]);

  const {
    data: overview,
    isFetching: isFetchingOverview,
    error: overviewError,
  } = useGetSiswaOverviewQuery(
    {
      semesterId: effectiveSemesterId || undefined,
    },
    {
      skip: !effectiveSemesterId,
      refetchOnMountOrArgChange: true,
    },
  );

  const overviewErrorStatus =
    overviewError && typeof overviewError === "object" && "status" in overviewError
      ? (overviewError.status as number | string)
      : undefined;
  const raporNotFound = overviewErrorStatus === 404 || !(overview?.rapor_published ?? false);
  const rapor = overview?.rapor ?? null;
  const nilaiMapel = overview?.nilai_mapel ?? [];
  const tugasList: SiswaOverviewTugasItem[] = overview?.tugas_list ?? [];

  const submittedTugasIdSet = useMemo(
    () => new Set(tugasList.filter((t) => t.is_submitted).map((t) => t.tugas_id)),
    [tugasList],
  );

  const filteredTugasList = useMemo(() => {
    const nowMs = Date.now();
    const fromMs = tugasDateFrom
      ? new Date(`${tugasDateFrom}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const toMs = tugasDateTo
      ? new Date(`${tugasDateTo}T23:59:59`).getTime()
      : Number.POSITIVE_INFINITY;

    return tugasList.filter((tugas) => {
      const createdMs = new Date(tugas.created_at).getTime();
      const deadlineMs = tugas.deadline
        ? new Date(tugas.deadline).getTime()
        : Number.POSITIVE_INFINITY;
      const isSubmitted = tugas.is_submitted;
      const isLatePending =
        !isSubmitted && Number.isFinite(deadlineMs) && deadlineMs < nowMs;

      const inDateRange = createdMs <= toMs && deadlineMs >= fromMs;
      if (!inDateRange) return false;
      if (tugasStatusFilter === "submitted") return isSubmitted;
      if (tugasStatusFilter === "not_submitted") return !isSubmitted;
      if (tugasStatusFilter === "late_pending") return isLatePending;
      return true;
    });
  }, [
    tugasList,
    submittedTugasIdSet,
    tugasDateFrom,
    tugasDateTo,
    tugasStatusFilter,
  ]);

  const selectedSemesterLabel = useMemo(() => {
    const found = semesterOptions.find((s) => s.key === effectiveSemesterKey);
    return found?.label ?? "-";
  }, [semesterOptions, effectiveSemesterKey]);

  const handleCancelSubmission = async (tugasId: string): Promise<boolean> => {
    try {
      await deleteMySubmission(tugasId).unwrap();
      notifySuccess("Pengumpulan berhasil dibatalkan.");
      return true;
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: unknown }).data === "object" &&
        (error as { data?: { detail?: string; message?: string } }).data
          ? (
              error as { data?: { detail?: string; message?: string } }
            ).data?.detail ||
            (
              error as { data?: { detail?: string; message?: string } }
            ).data?.message
          : undefined;
      notifyError(message || "Gagal membatalkan pengumpulan.");
      return false;
    }
  };

  const handleMarkSubmitted = async (
    tugas: Pick<
      SiswaOverviewTugasItem,
      "tugas_id" | "is_submitted" | "link_submission" | "link_tugas"
    >,
  ): Promise<boolean> => {
    const payload = {
      jawaban_text: "Ditandai mengumpulkan dari portal siswa.",
    };

    try {
      if (tugas.is_submitted) {
        await updateMySubmission({
          tugasId: tugas.tugas_id,
          body: payload,
        }).unwrap();
      } else {
        try {
          await createMySubmission({
            tugasId: tugas.tugas_id,
            body: payload,
          }).unwrap();
        } catch {
          // Fallback for stale UI state: if submission already exists, update instead.
          await updateMySubmission({
            tugasId: tugas.tugas_id,
            body: payload,
          }).unwrap();
        }
      }
      notifySuccess("Pengumpulan tugas berhasil disimpan.");
      return true;
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: unknown }).data === "object" &&
        (error as { data?: { detail?: string; message?: string } }).data
          ? (
              error as { data?: { detail?: string; message?: string } }
            ).data?.detail ||
            (
              error as { data?: { detail?: string; message?: string } }
            ).data?.message
          : undefined;
      notifyError(message || "Gagal menyimpan status pengumpulan tugas.");
      return false;
    }
  };

  return {
    effectiveSemesterId,
    effectiveSemesterKey,
    effectiveSemesterOption,
    filteredTugasList,
    isFetchingOverview,
    isProfileResolvedForCurrentUser,
    kelasId: overview?.kelas_id ?? null,
    loadingProfile,
    loadingTimeline,
    nilaiMapel,
    overviewError,
    profile,
    rapor,
    raporNotFound,
    handleCancelSubmission,
    handleMarkSubmitted,
    isCancellingSubmission,
    isMarkingSubmitted:
      isMarkingSubmittedCreate || isMarkingSubmittedUpdate,
    selectedSemesterKey,
    selectedSemesterLabel,
    setSelectedSemesterKey,
    setTugasDateFrom,
    setTugasDateTo,
    setTugasStatusFilter,
    submittedTugasIdSet,
    tugasDateFrom,
    tugasDateTo,
    tugasStatusFilter,
    semesterOptions,
  };
}
