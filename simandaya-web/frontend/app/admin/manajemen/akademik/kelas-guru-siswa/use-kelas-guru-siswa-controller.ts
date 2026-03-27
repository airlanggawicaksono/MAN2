"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useListTahunAjaranQuery,
  useListKelasByTahunAjaranQuery,
  useCreateKelasMutation,
  useUpdateKelasMutation,
  useDeleteKelasMutation,
  useListSiswaInKelasQuery,
  useAssignSiswaToKelasMutation,
  useRemoveSiswaFromKelasMutation,
  useListGuruMapelQuery,
  useCreateGuruMapelMutation,
  useUpdateGuruMapelMutation,
  useDeleteGuruMapelMutation,
  useListMapelQuery,
  useListKategoriKelasQuery,
  useCreateKategoriKelasMutation,
} from "@/api/shared/akademik";
import { useListTeachersQuery } from "@/api/admin/teachers";
import { useListStudentsQuery } from "@/api/admin/students";
import type { KelasResponse } from "@/types/akademik/kelas";
import type { GuruMapelResponse } from "@/types/akademik/jadwal";
import type { StudentProfile } from "@/types/students";
import { useClientSearchList } from "@/hooks/useClientSearchList";
import { useDebounce } from "@/hooks/useDebounce";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { getApiErrorMessage } from "@/lib/api-error";

export function useKelasGuruSiswaController() {
  const [kelasSearch, setKelasSearch] = useState("");
  const [gmSearch, setGmSearch] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const debouncedKelasSearch = useDebounce(kelasSearch, 250);
  const debouncedGmSearch = useDebounce(gmSearch, 250);

  const { data: tahunAjarans } = useListTahunAjaranQuery();
  const [selectedTA, setSelectedTA] = useState("");
  const {
    data: classes,
    isLoading: loadingKelas,
  } = useListKelasByTahunAjaranQuery(selectedTA, { skip: !selectedTA });
  const { data: guruMapels } = useListGuruMapelQuery();
  const { data: teachers } = useListTeachersQuery({ skip: 0, limit: 100 });
  const { data: mapels } = useListMapelQuery();
  const { data: kategoriKelas = [] } = useListKategoriKelasQuery();
  const { data: allStudents } = useListStudentsQuery({
    skip: 0,
    limit: 100,
  });

  const [createKelas] = useCreateKelasMutation();
  const [updateKelas] = useUpdateKelasMutation();
  const [deleteKelas] = useDeleteKelasMutation();
  const [assignSiswa] = useAssignSiswaToKelasMutation();
  const [removeSiswa] = useRemoveSiswaFromKelasMutation();
  const [createGuruMapel] = useCreateGuruMapelMutation();
  const [updateGuruMapel] = useUpdateGuruMapelMutation();
  const [deleteGuruMapel] = useDeleteGuruMapelMutation();
  const [createKategoriKelas] = useCreateKategoriKelasMutation();

  const [deleteKelasTarget, setDeleteKelasTarget] = useState<KelasResponse | null>(null);
  const [manageKelas, setManageKelas] = useState<KelasResponse | null>(null);
  const [addSiswaKelasId, setAddSiswaKelasId] = useState<string | null>(null);
  const {
    data: addClassStudents = [],
    isFetching: isFetchingAddClassStudents,
  } = useListSiswaInKelasQuery(addSiswaKelasId ?? "", {
    skip: !addSiswaKelasId,
  });
  const [selectionInitializedForKelasId, setSelectionInitializedForKelasId] = useState<string | null>(null);
  const [initialSelectedSiswaIds, setInitialSelectedSiswaIds] = useState<string[]>([]);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [removeSiswaTarget, setRemoveSiswaTarget] = useState<{
    kelasId: string;
    userId: string;
    nama: string;
  } | null>(null);
  const [deleteGMTarget, setDeleteGMTarget] = useState<GuruMapelResponse | null>(null);
  const [editGMTarget, setEditGMTarget] = useState<GuruMapelResponse | null>(null);
  const [editGmForm, setEditGmForm] = useState({
    user_id: "",
    mapel_id: "",
    kelas_id: "",
  });
  const [editKelasForm, setEditKelasForm] = useState({
    tingkat: "X",
    kategoriKelasId: "",
    nomor: "1",
    waliKelasId: "null",
  });
  const [kelasForm, setKelasForm] = useState({
    tingkat: "X",
    kategoriKelasId: "",
    nomor: "1",
    waliKelasId: "null",
  });
  const [kategoriForm, setKategoriForm] = useState({ kode: "", nama: "" });
  const [gmForm, setGmForm] = useState({
    user_id: "",
    mapel_id: "",
    kelas_id: "",
  });

  const taName = tahunAjarans?.find((t) => t.tahun_ajaran_id === selectedTA)?.nama;
  const hasTahunAjaran = (tahunAjarans?.length ?? 0) > 0;

  useEffect(() => {
    if (!tahunAjarans?.length) return;
    if (selectedTA && tahunAjarans.some((ta) => ta.tahun_ajaran_id === selectedTA)) return;
    const active = tahunAjarans.find((ta) => ta.is_active);
    setSelectedTA(active?.tahun_ajaran_id ?? tahunAjarans[0].tahun_ajaran_id);
  }, [tahunAjarans, selectedTA]);

  const kelasIds = new Set(classes?.map((c) => c.kelas_id) || []);
  const filteredGM =
    guruMapels?.filter((gm) => {
      if (!kelasIds.has(gm.kelas_id)) return false;
      const q = debouncedGmSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        (gm.guru_nama || "").toLowerCase().includes(q) ||
        (gm.mapel_nama || "").toLowerCase().includes(q) ||
        (gm.kelas_nama || "").toLowerCase().includes(q)
      );
    }) || [];
  const allStudentsItems = allStudents?.items || [];
  const { filteredItems: filteredStudents } = useClientSearchList<StudentProfile>({
    items: allStudentsItems,
    searchText: siswaSearch,
    debounceMs: 250,
    getSearchText: (siswa) =>
      `${siswa.nama_lengkap ?? ""} ${siswa.nis ?? ""} ${siswa.kelas_nama ?? ""} ${siswa.kelas_jurusan ?? ""}`,
  });
  const addTargetClass = useMemo(
    () => classes?.find((kelas) => kelas.kelas_id === addSiswaKelasId) ?? null,
    [addSiswaKelasId, classes],
  );
  const addCandidateStudents = useMemo(() => filteredStudents, [filteredStudents]);
  const siswaAssignedOtherClassIds = useMemo(() => {
    if (!addSiswaKelasId || !addTargetClass) return new Set<string>();
    const blocked = new Set<string>();
    for (const siswa of addCandidateStudents as any[]) {
      const kelasNama = (siswa.kelas_nama ?? siswa.kelas_jurusan ?? "").trim();
      if (kelasNama && kelasNama !== addTargetClass.nama_kelas) blocked.add(siswa.user_id);
    }
    return blocked;
  }, [addSiswaKelasId, addCandidateStudents, addTargetClass]);
  const filteredClasses = (classes || []).filter((kelas) => {
    const q = debouncedKelasSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      kelas.nama_kelas.toLowerCase().includes(q) ||
      (kelas.wali_kelas_nama || "").toLowerCase().includes(q) ||
      (kelas.kategori_kelas_nama || "").toLowerCase().includes(q)
    );
  });
  const takenWaliKelasIds = useMemo(() => {
    const ids = new Set<string>();
    for (const kelas of classes || []) {
      if (kelas.wali_kelas_id) ids.add(kelas.wali_kelas_id);
    }
    return ids;
  }, [classes]);
  const createWaliKelasOptions = useMemo(
    () => (teachers?.items || []).filter((teacher) => !takenWaliKelasIds.has(teacher.user_id)),
    [teachers?.items, takenWaliKelasIds],
  );
  const editWaliKelasOptions = useMemo(() => {
    const currentWaliId = manageKelas?.wali_kelas_id ?? null;
    return (teachers?.items || []).filter(
      (teacher) =>
        teacher.user_id === currentWaliId || !takenWaliKelasIds.has(teacher.user_id),
    );
  }, [manageKelas?.wali_kelas_id, teachers?.items, takenWaliKelasIds]);
  const activeKategori = kategoriKelas.filter((item) => item.is_active);
  const hasSelectionChanges = useMemo(() => {
    const initialSet = new Set(initialSelectedSiswaIds);
    const selectedSet = new Set(selectedSiswaIds);
    if (initialSet.size !== selectedSet.size) return true;
    for (const id of initialSet) {
      if (!selectedSet.has(id)) return true;
    }
    return false;
  }, [initialSelectedSiswaIds, selectedSiswaIds]);

  useEffect(() => {
    if (!kelasForm.kategoriKelasId && activeKategori.length > 0) {
      setKelasForm((prev) => ({
        ...prev,
        kategoriKelasId: activeKategori[0].kategori_kelas_id,
      }));
    }
  }, [activeKategori, kelasForm.kategoriKelasId]);

  useEffect(() => {
    if (kelasForm.waliKelasId === "null") return;
    if (createWaliKelasOptions.some((teacher) => teacher.user_id === kelasForm.waliKelasId)) return;
    setKelasForm((prev) => ({ ...prev, waliKelasId: "null" }));
  }, [createWaliKelasOptions, kelasForm.waliKelasId]);

  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTA || !kelasForm.kategoriKelasId) return;
    const kategori = kategoriKelas.find(
      (item) => item.kategori_kelas_id === kelasForm.kategoriKelasId,
    );
    const namaKelas = `${kelasForm.tingkat} ${kategori?.kode || "KAT"} ${kelasForm.nomor}`;
    try {
      await createKelas({
        tahun_ajaran_id: selectedTA,
        nama_kelas: namaKelas,
        tingkat: kelasForm.tingkat,
        kategori_kelas_id: kelasForm.kategoriKelasId,
        wali_kelas_id:
          kelasForm.waliKelasId === "null" ? undefined : kelasForm.waliKelasId,
      }).unwrap();
      setKelasForm((prev) => ({
        ...prev,
        nomor: String(parseInt(prev.nomor) + 1),
      }));
      notifySuccess("Kelas berhasil ditambahkan.");
    } catch (error) {
      const detail = (getApiErrorMessage(error) || "").toLowerCase();
      if (detail.includes("already exists") || detail.includes("sudah ada")) {
        notifyError("Nomor kelas sudah terbuat.");
      } else {
        notifyError("Gagal menambahkan kelas.");
      }
    }
  };

  const handleCreateGM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmForm.user_id || !gmForm.mapel_id || !gmForm.kelas_id || !selectedTA) return;
    try {
      await createGuruMapel({
        user_id: gmForm.user_id,
        mapel_id: gmForm.mapel_id,
        kelas_id: gmForm.kelas_id,
        tahun_ajaran_id: selectedTA,
      }).unwrap();
      setGmForm({ user_id: "", mapel_id: "", kelas_id: "" });
      notifySuccess("Penugasan guru mapel berhasil ditambahkan.");
    } catch {
      notifyError("Gagal menambahkan penugasan guru mapel.");
    }
  };

  const handleSaveGMEdit = async () => {
    if (!editGMTarget || !editGmForm.user_id || !editGmForm.mapel_id || !editGmForm.kelas_id) return;
    try {
      await updateGuruMapel({
        id: editGMTarget.guru_mapel_id,
        body: {
          user_id: editGmForm.user_id,
          mapel_id: editGmForm.mapel_id,
          kelas_id: editGmForm.kelas_id,
        },
      }).unwrap();
      setEditGMTarget(null);
      notifySuccess("Penugasan guru mapel berhasil diperbarui.");
    } catch {
      notifyError("Gagal memperbarui penugasan guru mapel.");
    }
  };

  useEffect(() => {
    if (!manageKelas) return;
    const numberMatch = manageKelas.nama_kelas.match(/(\d+)\s*$/);
    setEditKelasForm({
      tingkat: manageKelas.tingkat || "X",
      kategoriKelasId: manageKelas.kategori_kelas_id || "",
      nomor: numberMatch?.[1] || "1",
      waliKelasId: manageKelas.wali_kelas_id || "null",
    });
  }, [manageKelas]);

  useEffect(() => {
    if (!editGMTarget) return;
    setEditGmForm({
      user_id: editGMTarget.user_id,
      mapel_id: editGMTarget.mapel_id,
      kelas_id: editGMTarget.kelas_id,
    });
  }, [editGMTarget]);

  useEffect(() => {
    if (!addSiswaKelasId) return;
    if (isFetchingAddClassStudents) return;
    if (selectionInitializedForKelasId === addSiswaKelasId) return;
    const existingIds = Array.from(new Set(addClassStudents.map((siswa) => siswa.user_id)));
    setInitialSelectedSiswaIds(existingIds);
    setSelectedSiswaIds(existingIds);
    setSelectionInitializedForKelasId(addSiswaKelasId);
  }, [
    addSiswaKelasId,
    addClassStudents,
    isFetchingAddClassStudents,
    selectionInitializedForKelasId,
  ]);

  const handleSaveKelasEdit = async () => {
    try {
      if (!manageKelas || !editKelasForm.kategoriKelasId) return;
      const kategori = kategoriKelas.find(
        (k) => k.kategori_kelas_id === editKelasForm.kategoriKelasId,
      );
      const namaKelas = `${editKelasForm.tingkat} ${kategori?.kode || "KAT"} ${editKelasForm.nomor}`;
      const body = {
        nama_kelas: namaKelas,
        tingkat: editKelasForm.tingkat,
        kategori_kelas_id: editKelasForm.kategoriKelasId,
        wali_kelas_id:
          editKelasForm.waliKelasId === "null" ? null : editKelasForm.waliKelasId,
      };

      const updated = await updateKelas({
        id: manageKelas.kelas_id,
        body,
      }).unwrap();
      setManageKelas(updated);
      notifySuccess("Perubahan kelas berhasil disimpan.");
    } catch (error) {
      const detail = (getApiErrorMessage(error) || "").toLowerCase();
      if (detail.includes("already exists") || detail.includes("sudah ada")) {
        notifyError("Nomor kelas sudah terbuat.");
      } else {
        notifyError("Gagal menyimpan perubahan kelas.");
      }
    }
  };

  const closeAddSiswaDialog = () => {
    setAddSiswaKelasId(null);
    setSelectionInitializedForKelasId(null);
    setInitialSelectedSiswaIds([]);
    setSiswaSearch("");
    setSelectedSiswaIds([]);
  };

  const applyRosterChanges = async (
    kelasId: string,
    toAdd: string[],
    toRemove: string[],
  ) => {
    try {
      for (const userId of toAdd) {
        await assignSiswa({ kelasId, userId }).unwrap();
      }
      for (const userId of toRemove) {
        await removeSiswa({ kelasId, userId }).unwrap();
      }
      closeAddSiswaDialog();
      notifySuccess("Perubahan siswa kelas berhasil disimpan.");
    } catch {
      notifyError("Gagal menyimpan perubahan siswa kelas.");
    }
  };

  return {
    addCandidateStudents,
    addClassStudents,
    addSiswaKelasId,
    addTargetClass,
    allStudents,
    applyRosterChanges,
    classes,
    closeAddSiswaDialog,
    createKategoriKelas,
    createWaliKelasOptions,
    deleteGMTarget,
    editGMTarget,
    editGmForm,
    deleteGuruMapel,
    deleteKelas,
    deleteKelasTarget,
    editKelasForm,
    editWaliKelasOptions,
    filteredClasses,
    filteredGM,
    filteredStudents,
    gmForm,
    gmSearch,
    handleCreateGM,
    handleCreateKelas,
    handleSaveKelasEdit,
    handleSaveGMEdit,
    hasSelectionChanges,
    hasTahunAjaran,
    initialSelectedSiswaIds,
    isFetchingAddClassStudents,
    kategoriForm,
    kategoriKelas,
    kelasForm,
    kelasSearch,
    loadingKelas,
    manageKelas,
    mapels,
    removeSiswa,
    removeSiswaTarget,
    selectedSiswaIds,
    selectedTA,
    selectionInitializedForKelasId,
    setAddSiswaKelasId,
    setDeleteGMTarget,
    setEditGMTarget,
    setEditGmForm,
    setDeleteKelasTarget,
    setEditKelasForm,
    setGmForm,
    setGmSearch,
    setInitialSelectedSiswaIds,
    setKategoriForm,
    setKelasForm,
    setKelasSearch,
    setManageKelas,
    setRemoveSiswaTarget,
    setSelectedSiswaIds,
    setSelectedTA,
    setSelectionInitializedForKelasId,
    setSiswaSearch,
    siswaAssignedOtherClassIds,
    siswaSearch,
    taName,
    tahunAjarans,
    teachers,
    activeKategori,
  };
}
