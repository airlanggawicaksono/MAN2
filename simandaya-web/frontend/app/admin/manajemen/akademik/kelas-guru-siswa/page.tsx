"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Users, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
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
} from "@/api/akademik";
import { useListTeachersQuery } from "@/api/teachers";
import { useListStudentsQuery } from "@/api/students";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { KelasResponse, SiswaKelasResponse } from "@/types/akademik/kelas";
import type { GuruMapelResponse } from "@/types/akademik/jadwal";

const TINGKAT_OPTIONS = ["X", "XI", "XII"];
const JURUSAN_OPTIONS = ["IPA", "IPS", "Keagamaan"];

export default function KelasGuruSiswaPage() {
  const { data: tahunAjarans } = useListTahunAjaranQuery();
  const [selectedTA, setSelectedTA] = useState("");
  const { data: classes, isLoading: loadingKelas } = useListKelasByTahunAjaranQuery(selectedTA, { skip: !selectedTA });
  const { data: guruMapels } = useListGuruMapelQuery();
  const { data: teachers } = useListTeachersQuery({ skip: 0, limit: 200 });
  const { data: mapels } = useListMapelQuery();
  const { data: allStudents } = useListStudentsQuery({ skip: 0, limit: 500 });

  // Mutations
  const [createKelas] = useCreateKelasMutation();
  const [updateKelas] = useUpdateKelasMutation();
  const [deleteKelas] = useDeleteKelasMutation();
  const [assignSiswa] = useAssignSiswaToKelasMutation();
  const [removeSiswa] = useRemoveSiswaFromKelasMutation();
  const [promoteStudents] = usePromoteStudentsMutation();
  const [createGuruMapel] = useCreateGuruMapelMutation();
  const [deleteGuruMapel] = useDeleteGuruMapelMutation();

  // UI state
  const [deleteKelasTarget, setDeleteKelasTarget] = useState<KelasResponse | null>(null);
  const [expandedKelas, setExpandedKelas] = useState<string | null>(null);
  const [addSiswaKelasId, setAddSiswaKelasId] = useState<string | null>(null);
  const [removeSiswaTarget, setRemoveSiswaTarget] = useState<{ kelasId: string; userId: string; nama: string } | null>(null);
  const [promoteDialog, setPromoteDialog] = useState(false);
  const [promoteFrom, setPromoteFrom] = useState("");
  const [promoteResult, setPromoteResult] = useState<string | null>(null);
  const [deleteGMTarget, setDeleteGMTarget] = useState<GuruMapelResponse | null>(null);

  // Kelas form state
  const [kelasForm, setKelasForm] = useState({ tingkat: "X", jurusan: "IPA", nomor: "1", waliKelasId: "null" });

  // Guru mapel form state
  const [gmForm, setGmForm] = useState({ user_id: "", mapel_id: "", kelas_id: "" });

  const taName = tahunAjarans?.find(t => t.tahun_ajaran_id === selectedTA)?.nama;

  // Filter guru mapel by selected TA's classes
  const kelasIds = new Set(classes?.map(c => c.kelas_id) || []);
  const filteredGM = guruMapels?.filter(gm => kelasIds.has(gm.kelas_id)) || [];

  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTA) return;
    const namaKelas = `${kelasForm.tingkat} ${kelasForm.jurusan} ${kelasForm.nomor}`;
    await createKelas({
      tahun_ajaran_id: selectedTA,
      nama_kelas: namaKelas,
      tingkat: kelasForm.tingkat,
      jurusan: kelasForm.jurusan,
      wali_kelas_id: kelasForm.waliKelasId === "null" ? undefined : kelasForm.waliKelasId,
    });
    setKelasForm(prev => ({ ...prev, nomor: String(parseInt(prev.nomor) + 1) }));
  };

  const handleCreateGM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmForm.user_id || !gmForm.mapel_id || !gmForm.kelas_id || !selectedTA) return;
    await createGuruMapel({
      user_id: gmForm.user_id,
      mapel_id: gmForm.mapel_id,
      kelas_id: gmForm.kelas_id,
      tahun_ajaran_id: selectedTA,
    });
    setGmForm({ user_id: "", mapel_id: "", kelas_id: "" });
  };

  const handlePromote = async () => {
    if (!promoteFrom || !selectedTA) return;
    const result = await promoteStudents({
      from_tahun_ajaran_id: promoteFrom,
      to_tahun_ajaran_id: selectedTA,
    });
    if ("data" in result && result.data) {
      setPromoteResult(result.data.message);
    }
    setPromoteDialog(false);
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Kelas, Guru & Siswa</h1>
        <p className="text-muted-foreground">
          Kelola kelas, penugasan guru mata pelajaran, dan pengelolaan siswa per tahun ajaran.
        </p>
      </div>

      {/* ── Tahun Ajaran Selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Select value={selectedTA} onValueChange={setSelectedTA}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {tahunAjarans?.map(ta => (
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

            <form onSubmit={handleCreateKelas} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
              <div className="grid gap-1">
                <Label className="text-xs">Tingkat</Label>
                <Select value={kelasForm.tingkat} onValueChange={v => setKelasForm(p => ({ ...p, tingkat: v }))}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TINGKAT_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Jurusan</Label>
                <Select value={kelasForm.jurusan} onValueChange={v => setKelasForm(p => ({ ...p, jurusan: v }))}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JURUSAN_OPTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">No.</Label>
                <Input type="number" min={1} max={20} value={kelasForm.nomor} onChange={e => setKelasForm(p => ({ ...p, nomor: e.target.value }))} className="w-[70px]" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Wali Kelas</Label>
                <Select value={kelasForm.waliKelasId} onValueChange={v => setKelasForm(p => ({ ...p, waliKelasId: v }))}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">—</SelectItem>
                    {teachers?.items.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.nama_lengkap}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4 mr-1" />Tambah
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                → {kelasForm.tingkat} {kelasForm.jurusan} {kelasForm.nomor}
              </span>
            </form>

            {loadingKelas && <p className="text-muted-foreground">Memuat...</p>}

            <div className="space-y-2">
              {classes?.map(kelas => (
                <KelasCard
                  key={kelas.kelas_id}
                  kelas={kelas}
                  expanded={expandedKelas === kelas.kelas_id}
                  onToggle={() => setExpandedKelas(expandedKelas === kelas.kelas_id ? null : kelas.kelas_id)}
                  onDelete={() => setDeleteKelasTarget(kelas)}
                  onAddSiswa={() => setAddSiswaKelasId(kelas.kelas_id)}
                  onRemoveSiswa={(userId, nama) => setRemoveSiswaTarget({ kelasId: kelas.kelas_id, userId, nama })}
                />
              ))}
              {classes?.length === 0 && (
                <p className="text-muted-foreground text-center py-6">Belum ada kelas untuk tahun ajaran ini.</p>
              )}
            </div>
          </section>

          {/* ── Section 2: Promosi Siswa ──────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Promosi Siswa</h2>
              <Button variant="outline" onClick={() => setPromoteDialog(true)}>
                <ArrowUpDown className="h-4 w-4 mr-2" />Promosi dari Tahun Sebelumnya
              </Button>
            </div>
            {promoteResult && (
              <div className="rounded-lg border bg-green-50 p-4 text-sm text-green-800">{promoteResult}</div>
            )}
            <p className="text-sm text-muted-foreground">
              Promosi otomatis: X→XI, XI→XII. Siswa XII dianggap lulus. Siswa didistribusikan ke kelas yang sesuai (jurusan & tingkat).
            </p>
          </section>

          {/* ── Section 3: Penugasan Guru ──────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Penugasan Guru Mata Pelajaran</h2>

            <form onSubmit={handleCreateGM} className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
              <div className="grid gap-1">
                <Label className="text-xs">Guru</Label>
                <Select value={gmForm.user_id} onValueChange={v => setGmForm(p => ({ ...p, user_id: v }))}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
                  <SelectContent>
                    {teachers?.items.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.nama_lengkap}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Mata Pelajaran</Label>
                <Select value={gmForm.mapel_id} onValueChange={v => setGmForm(p => ({ ...p, mapel_id: v }))}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                  <SelectContent>
                    {mapels?.map(m => <SelectItem key={m.mapel_id} value={m.mapel_id}>{m.nama_mapel}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Kelas</Label>
                <Select value={gmForm.kelas_id} onValueChange={v => setGmForm(p => ({ ...p, kelas_id: v }))}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {classes?.map(c => <SelectItem key={c.kelas_id} value={c.kelas_id}>{c.nama_kelas}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" disabled={!gmForm.user_id || !gmForm.mapel_id || !gmForm.kelas_id}>
                <Plus className="h-4 w-4 mr-1" />Tambah
              </Button>
            </form>

            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Guru</th>
                    <th className="p-3 text-left font-medium">Mata Pelajaran</th>
                    <th className="p-3 text-left font-medium">Kelas</th>
                    <th className="p-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGM.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada penugasan guru.</td></tr>
                  )}
                  {filteredGM.map(gm => (
                    <tr key={gm.guru_mapel_id} className="border-b last:border-0">
                      <td className="p-3">{gm.guru_nama || "—"}</td>
                      <td className="p-3">{gm.mapel_nama || "—"}</td>
                      <td className="p-3">{gm.kelas_nama || "—"}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteGMTarget(gm)}>
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

      {/* Delete Kelas */}
      <AlertDialog open={!!deleteKelasTarget} onOpenChange={() => setDeleteKelasTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Kelas <strong>{deleteKelasTarget?.nama_kelas}</strong> dan semua data terkait (siswa, jadwal) akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={async () => { if (deleteKelasTarget) await deleteKelas(deleteKelasTarget.kelas_id); setDeleteKelasTarget(null); }}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Siswa to Kelas */}
      <AddSiswaDialog
        kelasId={addSiswaKelasId}
        students={allStudents?.items || []}
        onClose={() => setAddSiswaKelasId(null)}
        onAssign={async (userId) => { if (addSiswaKelasId) await assignSiswa({ kelasId: addSiswaKelasId, userId }); }}
      />

      {/* Remove Siswa */}
      <AlertDialog open={!!removeSiswaTarget} onOpenChange={() => setRemoveSiswaTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeSiswaTarget?.nama}</strong> akan dikeluarkan dari kelas ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (removeSiswaTarget) await removeSiswa({ kelasId: removeSiswaTarget.kelasId, userId: removeSiswaTarget.userId }); setRemoveSiswaTarget(null); }}>
              Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Dialog */}
      <AlertDialog open={promoteDialog} onOpenChange={setPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promosi Siswa dari Tahun Sebelumnya</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">Pilih tahun ajaran asal untuk mempromosikan siswa ke <strong>{taName}</strong>.</span>
              <Select value={promoteFrom} onValueChange={setPromoteFrom}>
                <SelectTrigger><SelectValue placeholder="Tahun ajaran asal" /></SelectTrigger>
                <SelectContent>
                  {tahunAjarans?.filter(ta => ta.tahun_ajaran_id !== selectedTA).map(ta => (
                    <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>{ta.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-xs">X→XI, XI→XII. Siswa XII dianggap lulus dan tidak dipindahkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={!promoteFrom}>Promosikan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Guru Mapel */}
      <AlertDialog open={!!deleteGMTarget} onOpenChange={() => setDeleteGMTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penugasan Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Penugasan <strong>{deleteGMTarget?.guru_nama}</strong> untuk <strong>{deleteGMTarget?.mapel_nama}</strong> di <strong>{deleteGMTarget?.kelas_nama}</strong> akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={async () => { if (deleteGMTarget) await deleteGuruMapel(deleteGMTarget.guru_mapel_id); setDeleteGMTarget(null); }}>
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
  expanded,
  onToggle,
  onDelete,
  onAddSiswa,
  onRemoveSiswa,
}: {
  kelas: KelasResponse;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddSiswa: () => void;
  onRemoveSiswa: (userId: string, nama: string) => void;
}) {
  const { data: students, isLoading } = useListSiswaInKelasQuery(kelas.kelas_id, { skip: !expanded });

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-bold">{kelas.tingkat}</Badge>
          <span className="font-medium">{kelas.nama_kelas}</span>
          {kelas.wali_kelas_nama && (
            <span className="text-sm text-muted-foreground">— Wali: {kelas.wali_kelas_nama}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Daftar Siswa</h4>
            <Button variant="outline" size="sm" onClick={onAddSiswa}>
              <Plus className="h-3 w-3 mr-1" />Tambah Siswa
            </Button>
          </div>
          {isLoading && <p className="text-xs text-muted-foreground">Memuat...</p>}
          {students && students.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Belum ada siswa.</p>
          )}
          {students && students.length > 0 && (
            <div className="space-y-1">
              {students.map((sk, i) => (
                <div key={sk.siswa_kelas_id} className="flex items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-muted/50 group">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                    <span>{sk.nama_lengkap || "—"}</span>
                    {sk.nis && <span className="text-xs text-muted-foreground">NIS: {sk.nis}</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => onRemoveSiswa(sk.user_id, sk.nama_lengkap || "siswa")}>
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

// ── Add Siswa Dialog ────────────────────────────────────────────────────────

function AddSiswaDialog({
  kelasId,
  students,
  onClose,
  onAssign,
}: {
  kelasId: string | null;
  students: any[];
  onClose: () => void;
  onAssign: (userId: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");

  const filtered = students.filter(s =>
    !search || s.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) || s.nis?.includes(search)
  );

  return (
    <Dialog open={!!kelasId} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Siswa ke Kelas</DialogTitle>
        </DialogHeader>
        <Input placeholder="Cari nama atau NIS..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {filtered.slice(0, 50).map((s: any) => (
            <div key={s.user_id || s.siswa_id} className="flex items-center justify-between rounded px-3 py-2 hover:bg-muted/50">
              <div>
                <span className="text-sm">{s.nama_lengkap}</span>
                {s.nis && <span className="text-xs text-muted-foreground ml-2">NIS: {s.nis}</span>}
              </div>
              <Button size="sm" variant="outline" onClick={async () => { await onAssign(s.user_id); }}>
                Tambah
              </Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Tidak ada siswa ditemukan.</p>}
          {filtered.length > 50 && <p className="text-xs text-muted-foreground text-center py-2">Menampilkan 50 dari {filtered.length}. Gunakan pencarian.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
