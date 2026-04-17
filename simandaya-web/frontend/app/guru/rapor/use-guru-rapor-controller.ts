"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGetGuruRaporContextQuery,
  useGetRaporEditorQuery,
  useListRaporByKelasQuery,
  usePublishRaporMutation,
  useSaveRaporEditorMutation,
  useUnpublishRaporMutation,
} from "@/api/shared/penilaian";
import { useGuruAcademicContext } from "@/hooks/useGuruAcademicContext";
import type { UUID } from "@/types/common";

type DraftEntryState = {
  rapor_nilai_id: UUID;
  mapel_id: UUID;
  nilai_override: string;
  catatan: string;
};

export function useGuruRaporController() {
  const { data: context } = useGetGuruRaporContextQuery();
  const tahunAjaranList = context?.tahun_ajaran ?? [];
  const semesters = context?.semesters ?? [];
  const classes = context?.kelas ?? [];

  const {
    selectedTahunAjaranId,
    selectedSemesterId,
    selectedKelasId,
    setSelectedTahunAjaranId,
    setSelectedSemesterId,
    setSelectedKelasId,
    semesterOptions,
    classOptions,
  } = useGuruAcademicContext({
    tahunAjaranList,
    semesters,
    kelasList: classes,
  });

  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.semester_id === selectedSemesterId),
    [semesters, selectedSemesterId],
  );
  const selectedClass = useMemo(
    () => classes.find((kelas) => kelas.kelas_id === selectedKelasId),
    [classes, selectedKelasId],
  );

  const { data: reports, isLoading: loadingReports, refetch: refetchReports } =
    useListRaporByKelasQuery(
      {
        kelasId: selectedKelasId,
        semesterId: selectedSemesterId,
      },
      { skip: !selectedKelasId || !selectedSemesterId, refetchOnMountOrArgChange: true },
    );

  const [selectedSiswaId, setSelectedSiswaId] = useState<UUID | null>(null);
  const { data: editor, isFetching: loadingEditor, refetch: refetchEditor } =
    useGetRaporEditorQuery(
      {
        kelasId: selectedKelasId,
        semesterId: selectedSemesterId,
        siswaId: selectedSiswaId || "",
      },
      {
        skip: !selectedKelasId || !selectedSemesterId || !selectedSiswaId,
        refetchOnMountOrArgChange: true,
      },
    );

  const [saveEditor, { isLoading: saving }] = useSaveRaporEditorMutation();
  const [publishOne, { isLoading: publishing }] = usePublishRaporMutation();
  const [unpublishOne, { isLoading: unpublishing }] = useUnpublishRaporMutation();

  const [catatanWaliKelas, setCatatanWaliKelas] = useState("");
  const [draftByRaporNilaiId, setDraftByRaporNilaiId] = useState<
    Record<string, DraftEntryState>
  >({});
  const [message, setMessage] = useState<string>("");

  const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (
      error &&
      typeof error === "object" &&
      "data" in error &&
      typeof (error as { data?: unknown }).data === "object"
    ) {
      const data = (error as { data?: { detail?: string; message?: string } }).data;
      if (data?.detail) return data.detail;
      if (data?.message) return data.message;
    }
    return fallback;
  };

  useEffect(() => {
    if (!reports?.length) return;
    if (!selectedSiswaId || !reports.some((r) => r.user_id === selectedSiswaId)) {
      setSelectedSiswaId(reports[0].user_id);
    }
  }, [reports, selectedSiswaId]);

  useEffect(() => {
    if (!editor) return;
    setCatatanWaliKelas(editor.catatan_wali_kelas || "");
    const initState: Record<string, DraftEntryState> = {};
    for (const row of editor.grades) {
      initState[row.rapor_nilai_id] = {
        rapor_nilai_id: row.rapor_nilai_id,
        mapel_id: row.mapel_id,
        nilai_override:
          row.nilai_override === undefined || row.nilai_override === null
            ? ""
            : String(row.nilai_override),
        catatan: row.catatan || "",
      };
    }
    setDraftByRaporNilaiId(initState);
  }, [editor]);

  const selectedStudent = useMemo(
    () => reports?.find((r) => r.user_id === selectedSiswaId),
    [reports, selectedSiswaId],
  );

  const handleSaveDraft = async () => {
    if (!editor) return;
    try {
      const entries = Object.values(draftByRaporNilaiId).map((entry) => {
        const rawOverride = entry.nilai_override.trim();
        let parsedOverride: number | null = null;
        if (rawOverride !== "") {
          const normalized = rawOverride.replace(",", ".");
          const asNumber = Number(normalized);
          if (Number.isNaN(asNumber) || asNumber < 0 || asNumber > 100) {
            throw new Error("Nilai override harus angka 0-100.");
          }
          parsedOverride = asNumber;
        }
        const trimmedCatatan = entry.catatan.trim();
        return {
          rapor_nilai_id: entry.rapor_nilai_id,
          mapel_id: entry.mapel_id,
          nilai_override: parsedOverride,
          catatan: trimmedCatatan === "" ? null : trimmedCatatan,
        };
      });

      await saveEditor({
        raporId: editor.rapor_id,
        body: {
          catatan_wali_kelas:
            catatanWaliKelas.trim() === "" ? null : catatanWaliKelas.trim(),
          entries,
        },
      }).unwrap();
      setMessage("Draft rapor berhasil disimpan.");
      await Promise.all([refetchEditor(), refetchReports()]);
    } catch (error) {
      setMessage(extractErrorMessage(error, "Gagal menyimpan draft rapor."));
    }
  };

  const handlePublish = async () => {
    if (!editor) return;
    try {
      await publishOne(editor.rapor_id).unwrap();
      setMessage("Rapor berhasil dipublikasikan.");
      await Promise.all([refetchEditor(), refetchReports()]);
    } catch (error) {
      setMessage(extractErrorMessage(error, "Gagal mempublikasikan rapor."));
    }
  };

  const handleUnpublish = async () => {
    if (!editor) return;
    try {
      await unpublishOne(editor.rapor_id).unwrap();
      setMessage("Rapor ditarik dari publikasi.");
      await Promise.all([refetchEditor(), refetchReports()]);
    } catch (error) {
      setMessage(extractErrorMessage(error, "Gagal menarik publikasi rapor."));
    }
  };

  return {
    catatanWaliKelas,
    classOptions,
    classes,
    draftByRaporNilaiId,
    editor,
    handlePublish,
    handleSaveDraft,
    handleUnpublish,
    loadingEditor,
    loadingReports,
    message,
    publishing,
    reports,
    saving,
    selectedClass,
    selectedKelasId,
    selectedSemester,
    selectedSemesterId,
    selectedSiswaId,
    selectedStudent,
    selectedTahunAjaranId,
    semesterOptions,
    setCatatanWaliKelas,
    setDraftByRaporNilaiId,
    setMessage,
    setSelectedKelasId,
    setSelectedSemesterId,
    setSelectedSiswaId,
    setSelectedTahunAjaranId,
    tahunAjaranList,
    unpublishing,
  };
}
