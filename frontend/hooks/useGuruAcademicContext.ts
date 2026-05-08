import { useEffect, useMemo, useState } from "react";

type TahunAjaranLike = {
  tahun_ajaran_id: string;
  is_active?: boolean;
};

type SemesterLike = {
  semester_id: string;
  tahun_ajaran_id: string;
  is_active?: boolean;
};

type KelasLike = {
  kelas_id: string;
  tahun_ajaran_id: string;
};

export function useGuruAcademicContext<
  TahunAjaranT extends TahunAjaranLike,
  SemesterT extends SemesterLike,
  KelasT extends KelasLike,
>({
  tahunAjaranList,
  semesters,
  kelasList = [],
  allowAllKelas = false,
}: {
  tahunAjaranList: TahunAjaranT[];
  semesters: SemesterT[];
  kelasList?: KelasT[];
  allowAllKelas?: boolean;
}) {
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedKelasId, setSelectedKelasId] = useState(allowAllKelas ? "all" : "");

  const activeTahunAjaran = useMemo(
    () => tahunAjaranList.find((ta) => ta.is_active) ?? tahunAjaranList[0],
    [tahunAjaranList],
  );

  useEffect(() => {
    if (!selectedTahunAjaranId && activeTahunAjaran?.tahun_ajaran_id) {
      setSelectedTahunAjaranId(activeTahunAjaran.tahun_ajaran_id);
    }
  }, [activeTahunAjaran, selectedTahunAjaranId]);

  const semesterOptions = useMemo(() => {
    if (!selectedTahunAjaranId) return semesters;
    return semesters.filter((s) => s.tahun_ajaran_id === selectedTahunAjaranId);
  }, [semesters, selectedTahunAjaranId]);

  useEffect(() => {
    if (!semesterOptions.length) {
      if (selectedSemesterId) setSelectedSemesterId("");
      return;
    }
    const activeSemester = semesterOptions.find((s) => s.is_active) ?? semesterOptions[0];
    if (
      !selectedSemesterId ||
      !semesterOptions.some((s) => s.semester_id === selectedSemesterId)
    ) {
      setSelectedSemesterId(activeSemester.semester_id);
    }
  }, [selectedSemesterId, semesterOptions]);

  const classOptions = useMemo(() => {
    if (!selectedTahunAjaranId) return kelasList;
    return kelasList.filter((k) => k.tahun_ajaran_id === selectedTahunAjaranId);
  }, [kelasList, selectedTahunAjaranId]);

  useEffect(() => {
    if (allowAllKelas) {
      if (!classOptions.length) {
        if (selectedKelasId !== "all") setSelectedKelasId("all");
        return;
      }
      if (selectedKelasId === "") {
        setSelectedKelasId("all");
        return;
      }
      if (selectedKelasId !== "all" && !classOptions.some((k) => k.kelas_id === selectedKelasId)) {
        setSelectedKelasId("all");
      }
      return;
    }

    if (!classOptions.length) {
      if (selectedKelasId) setSelectedKelasId("");
      return;
    }
    if (!selectedKelasId || !classOptions.some((k) => k.kelas_id === selectedKelasId)) {
      setSelectedKelasId(classOptions[0].kelas_id);
    }
  }, [allowAllKelas, classOptions, selectedKelasId]);

  const resetAfterTahunAjaranChange = (nextTahunAjaranId: string) => {
    setSelectedTahunAjaranId(nextTahunAjaranId);
    setSelectedSemesterId("");
    setSelectedKelasId(allowAllKelas ? "all" : "");
  };

  return {
    selectedTahunAjaranId,
    selectedSemesterId,
    selectedKelasId,
    setSelectedSemesterId,
    setSelectedKelasId,
    setSelectedTahunAjaranId: resetAfterTahunAjaranChange,
    semesterOptions,
    classOptions,
  };
}
