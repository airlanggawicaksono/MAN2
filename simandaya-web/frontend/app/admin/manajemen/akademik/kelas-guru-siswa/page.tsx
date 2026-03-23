"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Users, ArrowUpDown } from "lucide-react";
import {
  useListTahunAjaranQuery,
  useListKelasByTahunAjaranQuery,
  useCreateKelasMutation,
  useUpdateKelasMutation,
  useDeleteKelasMutation,
  useListSiswaInKelasQuery,
  useAssignSiswaToKelasMutation,
  useRemoveSiswaFromKelasMutation,
  usePromoteStudentsMutation,
  useListGuruMapelQuery,
  useCreateGuruMapelMutation,
  useDeleteGuruMapelMutation,
  useListMapelQuery,
  useListKategoriKelasQuery,
  useCreateKategoriKelasMutation,
} from "@/api/shared/akademik";
import { useListTeachersQuery } from "@/api/admin/teachers";
import { useListStudentsQuery } from "@/api/admin/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KelasResponse } from "@/types/akademik/kelas";
import type { GuruMapelResponse } from "@/types/akademik/jadwal";
import { SelectionAssignDialog } from "@/app/components/admin/selection-assign-dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { notifyError, notifySuccess } from "@/lib/app-notify";
import { getApiErrorMessage } from "@/lib/api-error";

const TINGKAT_OPTIONS = ["X", "XI", "XII"];

type KelasGuruSiswaPageProps = {
  embedded?: boolean;
};

export default function KelasGuruSiswaPage({
  embedded = false,
}: KelasGuruSiswaPageProps) {
  const [kelasSearch, setKelasSearch] = useState("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const debouncedSiswaSearch = useDebounce(siswaSearch, 350);

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
    search: debouncedSiswaSearch || undefined,
  });

  // Mutations
  const [createKelas] = useCreateKelasMutation();
  const [updateKelas] = useUpdateKelasMutation();
  const [deleteKelas] = useDeleteKelasMutation();
  const [assignSiswa] = useAssignSiswaToKelasMutation();
  const [removeSiswa] = useRemoveSiswaFromKelasMutation();
  const [promoteStudents] = usePromoteStudentsMutation();
  const [createGuruMapel] = useCreateGuruMapelMutation();
  const [deleteGuruMapel] = useDeleteGuruMapelMutation();
  const [createKategoriKelas] = useCreateKategoriKelasMutation();

  // UI state
  const [
    deleteKelasTarget,
    setDeleteKelasTarget,
  ] = useState<KelasResponse | null>(null);
  const [manageKelas, setManageKelas] = useState<KelasResponse | null>(null);
  const [addSiswaKelasId, setAddSiswaKelasId] = useState<string | null>(null);
  const {
    data: addClassStudents = [],
    isFetching: isFetchingAddClassStudents,
  } = useListSiswaInKelasQuery(addSiswaKelasId ?? "", {
    skip: !addSiswaKelasId,
  });
  const [
    selectionInitializedForKelasId,
    setSelectionInitializedForKelasId,
  ] = useState<string | null>(null);
  const [initialSelectedSiswaIds, setInitialSelectedSiswaIds] = useState<
    string[]
  >([]);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [removeSiswaTarget, setRemoveSiswaTarget] = useState<{
    kelasId: string;
    userId: string;
    nama: string;
  } | null>(null);
  const [promoteDialog, setPromoteDialog] = useState(false);
  const [promoteFrom, setPromoteFrom] = useState("");
  const [promoteResult, setPromoteResult] = useState<string | null>(null);
  const [
    deleteGMTarget,
    setDeleteGMTarget,
  ] = useState<GuruMapelResponse | null>(null);
  const [editKelasForm, setEditKelasForm] = useState({
    tingkat: "X",
    kategoriKelasId: "",
    nomor: "1",
    waliKelasId: "null",
  });

  // Kelas form state
  const [kelasForm, setKelasForm] = useState({
    tingkat: "X",
    kategoriKelasId: "",
    nomor: "1",
    waliKelasId: "null",
  });
  const [kategoriForm, setKategoriForm] = useState({ kode: "", nama: "" });

  // Guru mapel form state
  const [gmForm, setGmForm] = useState({
    user_id: "",
    mapel_id: "",
    kelas_id: "",
  });

  const taName = tahunAjarans?.find((t) => t.tahun_ajaran_id === selectedTA)
    ?.nama;
  const hasTahunAjaran = (tahunAjarans?.length ?? 0) > 0;

  useEffect(() => {
    if (!tahunAjarans?.length) return;
    if (
      selectedTA &&
      tahunAjarans.some((ta) => ta.tahun_ajaran_id === selectedTA)
    )
      return;

    const active = tahunAjarans.find((ta) => ta.is_active);
    setSelectedTA(active?.tahun_ajaran_id ?? tahunAjarans[0].tahun_ajaran_id);
  }, [tahunAjarans, selectedTA]);

  // Filter guru mapel by selected TA's classes
  const kelasIds = new Set(classes?.map((c) => c.kelas_id) || []);
  const filteredGM =
    guruMapels?.filter((gm) => kelasIds.has(gm.kelas_id)) || [];
  const filteredStudents = allStudents?.items || [];
  const addTargetClass = useMemo(
    () => classes?.find((kelas) => kelas.kelas_id === addSiswaKelasId) ?? null,
    [addSiswaKelasId, classes],
  );
  const addCandidateStudents = useMemo(
    () => filteredStudents,
    [filteredStudents],
  );
  const siswaAssignedOtherClassIds = useMemo(() => {
    if (!addSiswaKelasId || !addTargetClass) return new Set<string>();
    const blocked = new Set<string>();
    for (const siswa of addCandidateStudents as any[]) {
      const kelasNama = (siswa.kelas_nama ?? siswa.kelas_jurusan ?? "").trim();
      if (kelasNama && kelasNama !== addTargetClass.nama_kelas) {
        blocked.add(siswa.user_id);
      }
    }
    return blocked;
  }, [addSiswaKelasId, addCandidateStudents, addTargetClass]);
  const filteredClasses = (classes || []).filter((kelas) => {
    const q = kelasSearch.trim().toLowerCase();
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
    () =>
      (teachers?.items || []).filter((teacher) => !takenWaliKelasIds.has(teacher.user_id)),
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
    if (createWaliKelasOptions.some((teacher) => teacher.user_id === kelasForm.waliKelasId))
      return;
    setKelasForm((prev) => ({ ...prev, waliKelasId: "null" }));
  }, [createWaliKelasOptions, kelasForm.waliKelasId]);

  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTA || !kelasForm.kategoriKelasId) return;
    const kategori = kategoriKelas.find(
      (item) => item.kategori_kelas_id === kelasForm.kategoriKelasId,
    );
    const namaKelas = `${kelasForm.tingkat} ${kategori?.kode || "KAT"} ${
      kelasForm.nomor
    }`;
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
    if (!gmForm.user_id || !gmForm.mapel_id || !gmForm.kelas_id || !selectedTA)
      return;
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

  const handlePromote = async () => {
    if (!promoteFrom || !selectedTA) return;
    try {
      const result = await promoteStudents({
        from_tahun_ajaran_id: promoteFrom,
        to_tahun_ajaran_id: selectedTA,
      }).unwrap();
      setPromoteResult(result.message);
      notifySuccess(result.message);
    } catch {
      notifyError("Gagal melakukan promosi siswa.");
    }
    setPromoteDialog(false);
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
    if (!addSiswaKelasId) return;
    if (isFetchingAddClassStudents) return;
    if (selectionInitializedForKelasId === addSiswaKelasId) return;
    const existingIds = Array.from(
      new Set(addClassStudents.map((siswa) => siswa.user_id)),
    );
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
      const namaKelas = `${editKelasForm.tingkat} ${kategori?.kode || "KAT"} ${
        editKelasForm.nomor
      }`;
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

  return (
    <div className={embedded ? "space-y-8" : "space-y-8 p-8"}>
      <div className="flex flex-col gap-2">
        <h1
          className={
            embedded
              ? "text-2xl font-semibold tracking-tight"
              : "text-3xl font-bold tracking-tight"
          }
        >
          Kelas, Guru & Siswa
        </h1>
        <p className="text-muted-foreground">
          Kelola kelas, penugasan guru mata pelajaran, dan pengelolaan siswa per
          tahun ajaran. Pastikan Periode Akademik sudah dibuat dulu.
        </p>
      </div>

      {!hasTahunAjaran && (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Belum ada tahun ajaran. Buat dulu di tab{" "}
          <span className="font-medium">Periode Akademik</span>, lalu kembali ke
          tab ini untuk assign kelas dan siswa.
        </div>
      )}

      {/* ── Tahun Ajaran Selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedTA}
          onValueChange={setSelectedTA}
          disabled={!hasTahunAjaran}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {tahunAjarans?.map((ta) => (
              <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                {ta.nama} {ta.is_active ? "(Aktif)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {taName && <Badge variant="outline">Tahun Ajaran: {taName}</Badge>}
      </div>

      {!selectedTA && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          Pilih tahun ajaran untuk mengelola kelas, guru, dan siswa.
        </div>
      )}

      {selectedTA && (
        <>
          {/* ── Section 1: Daftar Kelas ──────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Daftar Kelas</h2>

            <form
              onSubmit={handleCreateKelas}
              className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
            >
              <div className="grid gap-1">
                <Label className="text-xs">Kategori Kelas</Label>
                <Select
                  value={kelasForm.kategoriKelasId}
                  onValueChange={(v) =>
                    setKelasForm((p) => ({ ...p, kategoriKelasId: v }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeKategori.map((k) => (
                      <SelectItem
                        key={k.kategori_kelas_id}
                        value={k.kategori_kelas_id}
                      >
                        {k.nama} ({k.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Tingkat</Label>
                <Select
                  value={kelasForm.tingkat}
                  onValueChange={(v) =>
                    setKelasForm((p) => ({ ...p, tingkat: v }))
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TINGKAT_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">No.</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={kelasForm.nomor}
                  onChange={(e) =>
                    setKelasForm((p) => ({ ...p, nomor: e.target.value }))
                  }
                  className="w-[70px]"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Wali Kelas</Label>
                <Select
                  value={kelasForm.waliKelasId}
                  onValueChange={(v) =>
                    setKelasForm((p) => ({ ...p, waliKelasId: v }))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">—</SelectItem>
                    {createWaliKelasOptions.map((t) => (
                      <SelectItem key={t.user_id} value={t.user_id}>
                        {t.nama_lengkap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!kelasForm.kategoriKelasId}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                {"->"} {kelasForm.tingkat}{" "}
                {kategoriKelas.find(
                  (k) => k.kategori_kelas_id === kelasForm.kategoriKelasId,
                )?.kode || "KAT"}{" "}
                {kelasForm.nomor}
              </span>
            </form>

            {kategoriKelas.length === 0 && (
              <div className="rounded-lg border border-dashed p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Isi pengaturan kategori kelas dulu sebelum membuat kelas.
                </p>
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!kategoriForm.kode.trim() || !kategoriForm.nama.trim())
                      return;
                    try {
                      await createKategoriKelas({
                        kode: kategoriForm.kode.trim().toUpperCase(),
                        nama: kategoriForm.nama.trim(),
                        is_active: true,
                      }).unwrap();
                      setKategoriForm({ kode: "", nama: "" });
                      notifySuccess("Kategori kelas berhasil ditambahkan.");
                    } catch {
                      notifyError("Gagal menambahkan kategori kelas.");
                    }
                  }}
                >
                  <div className="grid gap-1">
                    <Label className="text-xs">Kode</Label>
                    <Input
                      value={kategoriForm.kode}
                      onChange={(event) =>
                        setKategoriForm((prev) => ({
                          ...prev,
                          kode: event.target.value,
                        }))
                      }
                      placeholder="IPA"
                      className="w-[120px]"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Nama</Label>
                    <Input
                      value={kategoriForm.nama}
                      onChange={(event) =>
                        setKategoriForm((prev) => ({
                          ...prev,
                          nama: event.target.value,
                        }))
                      }
                      placeholder="Ilmu Pengetahuan Alam"
                      className="w-[260px]"
                    />
                  </div>
                  <Button type="submit" size="sm">
                    Tambah Kategori
                  </Button>
                </form>
              </div>
            )}

            <div className="max-w-xs">
              <Label className="text-xs">Cari Kelas</Label>
              <Input
                value={kelasSearch}
                onChange={(event) => setKelasSearch(event.target.value)}
                placeholder="Cari nama kelas / wali kelas..."
              />
            </div>

            {loadingKelas && <p className="text-muted-foreground">Memuat...</p>}

            <div className="max-h-[540px] space-y-2 overflow-y-auto rounded-lg border p-2">
              {filteredClasses.map((kelas) => (
                <KelasCard
                  key={kelas.kelas_id}
                  kelas={kelas}
                  onDelete={() => setDeleteKelasTarget(kelas)}
                  onManage={() => setManageKelas(kelas)}
                />
              ))}
              {filteredClasses.length === 0 && (
                <p className="text-muted-foreground text-center py-6">
                  Belum ada kelas untuk tahun ajaran ini.
                </p>
              )}
            </div>
          </section>

          {/* ── Section 2: Promosi Siswa ──────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Promosi Siswa</h2>
              <Button variant="outline" onClick={() => setPromoteDialog(true)}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Promosi dari Tahun Sebelumnya
              </Button>
            </div>
            {promoteResult && (
              <div className="rounded-lg border bg-green-50 p-4 text-sm text-green-800">
                {promoteResult}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Promosi otomatis: X{"->"}XI, XI{"->"}XII. Siswa XII dianggap lulus. Siswa
              didistribusikan ke kelas yang sesuai (kategori & tingkat).
            </p>
          </section>

          {/* ── Section 3: Penugasan Guru ──────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Penugasan Guru Mata Pelajaran
            </h2>

            <form
              onSubmit={handleCreateGM}
              className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
            >
              <div className="grid gap-1">
                <Label className="text-xs">Guru</Label>
                <Select
                  value={gmForm.user_id}
                  onValueChange={(v) =>
                    setGmForm((p) => ({ ...p, user_id: v }))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.items.map((t) => (
                      <SelectItem key={t.user_id} value={t.user_id}>
                        {t.nama_lengkap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Mata Pelajaran</Label>
                <Select
                  value={gmForm.mapel_id}
                  onValueChange={(v) =>
                    setGmForm((p) => ({ ...p, mapel_id: v }))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pilih Mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    {mapels?.map((m) => (
                      <SelectItem key={m.mapel_id} value={m.mapel_id}>
                        {m.nama_mapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Kelas</Label>
                <Select
                  value={gmForm.kelas_id}
                  onValueChange={(v) =>
                    setGmForm((p) => ({ ...p, kelas_id: v }))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((c) => (
                      <SelectItem key={c.kelas_id} value={c.kelas_id}>
                        {c.nama_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !gmForm.user_id || !gmForm.mapel_id || !gmForm.kelas_id
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </form>

            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Guru</th>
                    <th className="p-3 text-left font-medium">
                      Mata Pelajaran
                    </th>
                    <th className="p-3 text-left font-medium">Kelas</th>
                    <th className="p-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGM.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-muted-foreground"
                      >
                        Belum ada penugasan guru.
                      </td>
                    </tr>
                  )}
                  {filteredGM.map((gm) => (
                    <tr
                      key={gm.guru_mapel_id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3">{gm.guru_nama || "—"}</td>
                      <td className="p-3">{gm.mapel_nama || "—"}</td>
                      <td className="p-3">{gm.kelas_nama || "—"}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteGMTarget(gm)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}

      <Dialog
        open={!!manageKelas}
        onOpenChange={(open) => !open && setManageKelas(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Kelas</DialogTitle>
            <DialogDescription>
              Edit data kelas dan kelola siswa di sini.
            </DialogDescription>
          </DialogHeader>
          {manageKelas ? (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
                <div className="grid gap-1">
                  <Label className="text-xs">Kategori</Label>
                  <Select
                    value={editKelasForm.kategoriKelasId}
                    onValueChange={(v) =>
                      setEditKelasForm((p) => ({ ...p, kategoriKelasId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeKategori.map((k) => (
                        <SelectItem
                          key={k.kategori_kelas_id}
                          value={k.kategori_kelas_id}
                        >
                          {k.nama} ({k.kode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Tingkat</Label>
                  <Select
                    value={editKelasForm.tingkat}
                    onValueChange={(v) =>
                      setEditKelasForm((p) => ({ ...p, tingkat: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TINGKAT_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Nomor Kelas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editKelasForm.nomor}
                    onChange={(event) =>
                      setEditKelasForm((p) => ({
                        ...p,
                        nomor: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Wali Kelas</Label>
                  <Select
                    value={editKelasForm.waliKelasId}
                    onValueChange={(v) =>
                      setEditKelasForm((p) => ({ ...p, waliKelasId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">-</SelectItem>
                      {editWaliKelasOptions.map((t) => (
                        <SelectItem key={t.user_id} value={t.user_id}>
                          {t.nama_lengkap}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Nama kelas:{" "}
                  <span className="font-medium text-foreground">
                    {editKelasForm.tingkat}{" "}
                    {kategoriKelas.find(
                      (k) =>
                        k.kategori_kelas_id === editKelasForm.kategoriKelasId,
                    )?.kode || "KAT"}{" "}
                    {editKelasForm.nomor}
                  </span>
                </p>
                <Button onClick={handleSaveKelasEdit}>Simpan Perubahan</Button>
              </div>

              <ManageKelasStudents
                kelas={manageKelas}
                onAdd={() => {
                  setAddSiswaKelasId(manageKelas.kelas_id);
                  setSelectionInitializedForKelasId(null);
                  setInitialSelectedSiswaIds([]);
                  setSiswaSearch("");
                }}
                onRemove={(userId, nama) =>
                  setRemoveSiswaTarget({
                    kelasId: manageKelas.kelas_id,
                    userId,
                    nama,
                  })
                }
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Kelas */}
      <AlertDialog
        open={!!deleteKelasTarget}
        onOpenChange={() => setDeleteKelasTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Hapus Kelas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Kelas <strong>{deleteKelasTarget?.nama_kelas}</strong> dan semua
              data terkait (siswa, jadwal) akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (deleteKelasTarget)
                    await deleteKelas(deleteKelasTarget.kelas_id).unwrap();
                  notifySuccess("Kelas berhasil dihapus.");
                } catch {
                  notifyError("Gagal menghapus kelas.");
                }
                setDeleteKelasTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Siswa to Kelas */}
      <SelectionAssignDialog
        open={!!addSiswaKelasId}
        onOpenChange={(open) => {
          if (open) return;
          closeAddSiswaDialog();
        }}
        title="Tambah Siswa ke Kelas"
        items={addCandidateStudents.map((s: any) => ({ ...s, id: s.user_id }))}
        selectedIds={selectedSiswaIds}
        onToggle={(id) =>
          setSelectedSiswaIds((prev) =>
            prev.includes(id)
              ? prev.filter((userId) => userId !== id)
              : [...prev, id],
          )
        }
        isItemDisabled={(s: any) => siswaAssignedOtherClassIds.has(s.user_id)}
        onSubmit={async () => {
          if (!addSiswaKelasId) return;
          const initialSet = new Set(initialSelectedSiswaIds);
          const selectedSet = new Set(selectedSiswaIds);
          const toAdd = selectedSiswaIds.filter(
            (userId) => !initialSet.has(userId),
          );
          const toRemove = initialSelectedSiswaIds.filter(
            (userId) => !selectedSet.has(userId),
          );
          await applyRosterChanges(addSiswaKelasId, toAdd, toRemove);
        }}
        submitDisabled={!hasSelectionChanges}
        submitLabel="Simpan Perubahan Siswa"
        searchValue={siswaSearch}
        onSearchChange={setSiswaSearch}
        searchPlaceholder="Cari nama atau NIS..."
        emptyText="Tidak ada data siswa."
        bottomContent={
          <div className="space-y-1 py-1 text-center text-xs text-muted-foreground">
            {(allStudents?.total || 0) > filteredStudents.length ? (
              <p>
                Menampilkan {filteredStudents.length} dari total{" "}
                {allStudents?.total || 0}. Gunakan pencarian untuk menemukan
                siswa lain.
              </p>
            ) : null}
            <p>
              Dipilih: {selectedSiswaIds.length} | Awal:{" "}
              {initialSelectedSiswaIds.length}
            </p>
            <p>
              Siswa yang sudah terdaftar di kelas lain akan nonaktif dan tidak
              bisa dipilih.
            </p>
          </div>
        }
        renderItem={(s: any) => (
          <div>
            <span className="text-sm">{s.nama_lengkap}</span>
            {s.nis ? (
              <span className="ml-2 text-xs text-muted-foreground">
                NIS: {s.nis}
              </span>
            ) : null}
            {siswaAssignedOtherClassIds.has(s.user_id) ? (
              <span className="ml-2 text-xs text-destructive">
                Sudah di kelas lain ({s.kelas_nama ?? s.kelas_jurusan})
              </span>
            ) : null}
          </div>
        )}
      />

      {/* Remove Siswa */}
      <AlertDialog
        open={!!removeSiswaTarget}
        onOpenChange={() => setRemoveSiswaTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeSiswaTarget?.nama}</strong> akan dikeluarkan dari
              kelas ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (removeSiswaTarget)
                    await removeSiswa({
                      kelasId: removeSiswaTarget.kelasId,
                      userId: removeSiswaTarget.userId,
                    }).unwrap();
                  notifySuccess("Siswa berhasil dikeluarkan dari kelas.");
                } catch {
                  notifyError("Gagal mengeluarkan siswa dari kelas.");
                }
                setRemoveSiswaTarget(null);
              }}
            >
              Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Dialog */}
      <AlertDialog open={promoteDialog} onOpenChange={setPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Promosi Siswa dari Tahun Sebelumnya
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Pilih tahun ajaran asal untuk mempromosikan siswa ke{" "}
                <strong>{taName}</strong>.
              </span>
              <Select value={promoteFrom} onValueChange={setPromoteFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Tahun ajaran asal" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjarans
                    ?.filter((ta) => ta.tahun_ajaran_id !== selectedTA)
                    .map((ta) => (
                      <SelectItem
                        key={ta.tahun_ajaran_id}
                        value={ta.tahun_ajaran_id}
                      >
                        {ta.nama}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <span className="block text-xs">
                X{"->"}XI, XI{"->"}XII. Siswa XII dianggap lulus dan tidak dipindahkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={!promoteFrom}>
              Promosikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Guru Mapel */}
      <AlertDialog
        open={!!deleteGMTarget}
        onOpenChange={() => setDeleteGMTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penugasan Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Penugasan <strong>{deleteGMTarget?.guru_nama}</strong> untuk{" "}
              <strong>{deleteGMTarget?.mapel_nama}</strong> di{" "}
              <strong>{deleteGMTarget?.kelas_nama}</strong> akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  if (deleteGMTarget)
                    await deleteGuruMapel(deleteGMTarget.guru_mapel_id).unwrap();
                  notifySuccess("Penugasan guru mapel berhasil dihapus.");
                } catch {
                  notifyError("Gagal menghapus penugasan guru mapel.");
                }
                setDeleteGMTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Kelas Card with expandable student list ─────────────────────────────────

function KelasCard({
  kelas,
  onDelete,
  onManage,
}: {
  kelas: KelasResponse;
  onDelete: () => void;
  onManage: () => void;
}) {
  const { data: students, isLoading } = useListSiswaInKelasQuery(
    kelas.kelas_id,
  );
  const total = students?.length || 0;
  const onAddSiswa = () => {};
  const onRemoveSiswa = (_userId: string, _nama: string) => {};

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-bold">
            {kelas.tingkat}
          </Badge>
          <span className="font-medium">{kelas.nama_kelas}</span>
          {kelas.kategori_kelas_nama && (
            <span className="text-sm text-muted-foreground">
              ({kelas.kategori_kelas_nama})
            </span>
          )}
          {kelas.wali_kelas_nama && (
            <span className="text-sm text-muted-foreground">
              Wali guru: {kelas.wali_kelas_nama}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onManage}>
            Kelola
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Wali: {kelas.wali_kelas_nama || "Belum ditentukan"} •{" "}
        {isLoading ? "Memuat..." : `Total siswa: ${total}`}
      </div>

      {false && (
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Daftar Siswa</h4>
            <Button variant="outline" size="sm" onClick={onAddSiswa}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah Siswa
            </Button>
          </div>
          {isLoading && (
            <p className="text-xs text-muted-foreground">Memuat...</p>
          )}
          {students && students.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Belum ada siswa.
            </p>
          )}
          {students && students.length > 0 && (
            <div className="space-y-1">
              {students.map((sk, i) => (
                <div
                  key={sk.siswa_kelas_id}
                  className="flex items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-muted/50 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">
                      {i + 1}.
                    </span>
                    <span>{sk.nama_lengkap || "—"}</span>
                    {sk.nis && (
                      <span className="text-xs text-muted-foreground">
                        NIS: {sk.nis}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() =>
                      onRemoveSiswa(sk.user_id, sk.nama_lengkap || "siswa")
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManageKelasStudents({
  kelas,
  onAdd,
  onRemove,
}: {
  kelas: KelasResponse;
  onAdd: () => void;
  onRemove: (userId: string, nama: string) => void;
}) {
  const { data: students, isLoading } = useListSiswaInKelasQuery(
    kelas.kelas_id,
  );

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Daftar Siswa ({students?.length || 0})
        </h4>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" />
          Tambah Siswa
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Memuat siswa...</p>
      ) : null}

      {students && students.length > 0 ? (
        <div className="max-h-[360px] space-y-1 overflow-y-auto rounded border p-2">
          {students.map((sk, i) => (
            <div
              key={sk.siswa_kelas_id}
              className="flex items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span>{sk.nama_lengkap || "—"}</span>
                {sk.nis ? (
                  <span className="text-xs text-muted-foreground">
                    NIS: {sk.nis}
                  </span>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onRemove(sk.user_id, sk.nama_lengkap || "siswa")}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {students && students.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Belum ada siswa di kelas ini.
        </p>
      ) : null}
    </div>
  );
}
