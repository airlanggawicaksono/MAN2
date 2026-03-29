"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useGuruTugasController } from "./use-guru-tugas-controller";

export default function GuruTugasPage() {
  const {
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
  } = useGuruTugasController();

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Penugasan Siswa
        </h1>
        <p className="text-slate-500">
          Riwayat tugas per semester/kelas dengan filter tanggal dan status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Filter & Riwayat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Tahun Ajaran</Label>
              <Select
                value={selectedTahunAjaranId}
                onValueChange={(v) => {
                  setSelectedTahunAjaranId(v);
                  setSelectedAssignmentId("");
                  setSelectedTugasId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranList.map((ta) => (
                    <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                      {ta.nama} {ta.is_active ? "(Aktif)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Semester</Label>
              <Select
                value={selectedSemesterId}
                onValueChange={(v) => {
                  setSelectedSemesterId(v);
                  setSelectedTugasId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((s) => (
                    <SelectItem key={s.semester_id} value={s.semester_id}>
                      {s.tipe} {s.is_active ? "(Aktif)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Kelas</Label>
              <Select
                value={selectedClassId}
                onValueChange={(v) => {
                  setSelectedClassId(v);
                  setSelectedTugasId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classOptions.map((k) => (
                    <SelectItem key={k.kelas_id} value={k.kelas_id}>
                      {k.kelas_nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Mata Pelajaran</Label>
              <Select
                value={selectedAssignmentId}
                onValueChange={(v) => {
                  setSelectedAssignmentId(v);
                  setSelectedTugasId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mapel" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAssignments.map((a) => (
                    <SelectItem key={a.guru_mapel_id} value={a.guru_mapel_id}>
                      {a.kelas_nama} - {a.mapel_nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rentang Tanggal</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    Tanggal Mulai
                  </Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">
                    Tanggal Selesai
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="late">Lewat Deadline</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingTugas(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Tugas Baru
              </Button>
            </div>

            <div className="max-h-[330px] overflow-auto rounded-md border">
              <table className="w-full min-w-[340px] text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2">Judul</th>
                    <th className="text-left px-2 py-2">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTugasList.map((t) => (
                    <tr
                      key={t.tugas_id}
                      onClick={() => setSelectedTugasId(t.tugas_id)}
                      className={`cursor-pointer border-t ${
                        selectedTugasId === t.tugas_id
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <div className="max-w-[180px] overflow-x-auto whitespace-nowrap">
                          {t.judul}
                        </div>
                        {!t.is_published_to_students && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-amber-300 text-amber-700"
                          >
                            Tugas Disembunyikan
                          </Badge>
                        )}
                        {!t.is_nilai_published_to_students && (
                          <Badge
                            variant="outline"
                            className="mt-1 ml-1 border-orange-300 text-orange-700"
                          >
                            Nilai Disembunyikan
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="max-w-[120px] overflow-x-auto whitespace-nowrap">
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString("id-ID")
                            : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTugasList.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 py-6 text-center text-slate-500"
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {!selectedTugas ? (
            <div className="h-[560px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-slate-50 text-slate-400">
              <BookOpen className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">
                Pilih tugas dari panel kiri untuk input nilai.
              </p>
            </div>
          ) : (
            <Card className="overflow-hidden rounded-3xl">
              <CardHeader className="bg-primary text-primary-foreground py-6 px-8 flex flex-row justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{selectedTugas.judul}</h2>
                  <p className="text-primary-foreground/80 text-xs uppercase font-bold tracking-widest">
                    {selectedTugas.kelas_nama || "-"} |{" "}
                    {selectedTugas.mapel_nama || "-"}
                  </p>
                  <p className="text-xs text-primary-foreground/80">
                    Guru Pengajar:{" "}
                    {selectedTugas.guru_pengajar ||
                      selectedAssignment?.guru_nama ||
                      "-"}
                  </p>
                  <p className="text-[11px] text-primary-foreground/70 mt-1">
                    Deadline:{" "}
                    {selectedTugas.deadline
                      ? new Date(selectedTugas.deadline).toLocaleString("id-ID")
                      : "Tidak ditentukan"}{" "}
                    | Submisi: {submissions.length}
                  </p>
                  {!selectedTugas.is_published_to_students && (
                    <p className="text-[11px] text-amber-100 mt-1 font-medium">
                      Status: Tugas disembunyikan dari siswa
                    </p>
                  )}
                  {!selectedTugas.is_nilai_published_to_students && (
                    <p className="text-[11px] text-orange-100 mt-1 font-medium">
                      Status: Nilai disembunyikan dari siswa
                    </p>
                  )}
                  {selectedTugas.link_submission && (
                    <p className="text-[11px] text-primary-foreground/80 mt-1">
                      Link Pengumpulan:{" "}
                      <a
                        href={selectedTugas.link_submission}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:opacity-90"
                      >
                        Buka Form
                      </a>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenEditTugas}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Tugas
                  </Button>
                  <Button
                    onClick={() => setIsDeletingTugas(true)}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </Button>
                  <Button
                    onClick={handleSaveGrades}
                    disabled={isSaving}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Menyimpan..." : "Simpan Semua Nilai"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[68vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[80px] text-center">No</TableHead>
                        <TableHead>Nama Lengkap Siswa</TableHead>
                        <TableHead className="w-[120px] text-center">
                          NIS
                        </TableHead>
                        <TableHead className="w-[180px] text-center">
                          Status Pengumpulan
                        </TableHead>
                        <TableHead className="w-[150px] text-center">
                          Nilai (0-100)
                        </TableHead>
                        <TableHead className="w-[320px]">
                          Keterangan / Catatan
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s, idx) => {
                        const submission = submissionByUserId.get(s.user_id);
                        return (
                          <TableRow key={s.user_id}>
                            <TableCell className="text-center">
                              {idx + 1}
                            </TableCell>
                            <TableCell>{s.nama_lengkap}</TableCell>
                            <TableCell className="text-center">{s.nis}</TableCell>
                            <TableCell className="text-center">
                              {submission ? (
                                <div className="space-y-1">
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                    Sudah mengumpulkan
                                  </Badge>
                                  <p className="text-[11px] text-slate-500">
                                    {new Date(
                                      submission.updated_at,
                                    ).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline">
                                  Belum mengumpulkan
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                className="w-20 mx-auto text-center"
                                value={gradesDraft[s.user_id]?.nilai ?? ""}
                                onChange={(e) => {
                                  const n = parseFloat(e.target.value);
                                  setGradesDraft((prev) => ({
                                    ...prev,
                                    [s.user_id]: {
                                      nilai: isNaN(n) ? undefined : n,
                                      catatan: prev[s.user_id]?.catatan || "",
                                    },
                                  }));
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Catatan untuk siswa (opsional)"
                                value={gradesDraft[s.user_id]?.catatan ?? ""}
                                onChange={(e) => {
                                  setGradesDraft((prev) => ({
                                    ...prev,
                                    [s.user_id]: {
                                      nilai: prev[s.user_id]?.nilai,
                                      catatan: e.target.value,
                                    },
                                  }));
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isCreatingTugas} onOpenChange={setIsCreatingTugas}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Penugasan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Judul</Label>
              <Input
                value={newTugasForm.judul}
                onChange={(e) =>
                  setNewTugasForm((p) => ({ ...p, judul: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Jenis</Label>
              <Select
                value={newTugasForm.jenis}
                onValueChange={(v) =>
                  setNewTugasForm((p) => ({ ...p, jenis: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tugas">Tugas</SelectItem>
                  <SelectItem value="Ulangan Harian">Ulangan Harian</SelectItem>
                  <SelectItem value="UTS">UTS</SelectItem>
                  <SelectItem value="UAS">UAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Instruksi singkat"
              value={newTugasForm.deskripsi}
              onChange={(e) =>
                setNewTugasForm((p) => ({ ...p, deskripsi: e.target.value }))
              }
            />
            <Input
              placeholder="Link tugas materi (Drive/Docs, opsional)"
              value={newTugasForm.link_tugas}
              onChange={(e) =>
                setNewTugasForm((p) => ({ ...p, link_tugas: e.target.value }))
              }
            />
            <Input
              placeholder="Link pengumpulan (Google Form)"
              value={newTugasForm.link_submission}
              onChange={(e) =>
                setNewTugasForm((p) => ({
                  ...p,
                  link_submission: e.target.value,
                }))
              }
            />
            <Input
              type="datetime-local"
              value={newTugasForm.deadline_local}
              onChange={(e) =>
                setNewTugasForm((p) => ({
                  ...p,
                  deadline_local: e.target.value,
                }))
              }
            />
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Sembunyikan tugas dari siswa</p>
                <p className="text-xs text-slate-500">
                  Aktifkan jika tugas tidak boleh muncul di halaman siswa.
                </p>
              </div>
              <Switch
                checked={!newTugasForm.is_published_to_students}
                onCheckedChange={(checked) =>
                  setNewTugasForm((p) => ({
                    ...p,
                    is_published_to_students: !checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Sembunyikan nilai dari siswa</p>
                <p className="text-xs text-slate-500">
                  Aktifkan jika nilai tugas ini hanya untuk internal guru.
                </p>
              </div>
              <Switch
                checked={!newTugasForm.is_nilai_published_to_students}
                onCheckedChange={(checked) =>
                  setNewTugasForm((p) => ({
                    ...p,
                    is_nilai_published_to_students: !checked,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingTugas(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateTugas}
              disabled={isCreating || !newTugasForm.judul}
            >
              {isCreating ? "Membuat..." : "Buat Penugasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingTugas} onOpenChange={setIsEditingTugas}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Judul</Label>
              <Input
                value={editTugasForm.judul}
                onChange={(e) =>
                  setEditTugasForm((p) => ({ ...p, judul: e.target.value }))
                }
              />
            </div>
            <Input
              placeholder="Instruksi singkat"
              value={editTugasForm.deskripsi}
              onChange={(e) =>
                setEditTugasForm((p) => ({ ...p, deskripsi: e.target.value }))
              }
            />
            <Input
              placeholder="Link tugas materi (Drive/Docs, opsional)"
              value={editTugasForm.link_tugas}
              onChange={(e) =>
                setEditTugasForm((p) => ({ ...p, link_tugas: e.target.value }))
              }
            />
            <Input
              placeholder="Link pengumpulan (Google Form)"
              value={editTugasForm.link_submission}
              onChange={(e) =>
                setEditTugasForm((p) => ({
                  ...p,
                  link_submission: e.target.value,
                }))
              }
            />
            <Input
              type="datetime-local"
              value={editTugasForm.deadline_local}
              onChange={(e) =>
                setEditTugasForm((p) => ({
                  ...p,
                  deadline_local: e.target.value,
                }))
              }
            />
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Sembunyikan tugas dari siswa</p>
                <p className="text-xs text-slate-500">
                  Aktifkan jika tugas tidak boleh muncul di halaman siswa.
                </p>
              </div>
              <Switch
                checked={!editTugasForm.is_published_to_students}
                onCheckedChange={(checked) =>
                  setEditTugasForm((p) => ({
                    ...p,
                    is_published_to_students: !checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Sembunyikan nilai dari siswa</p>
                <p className="text-xs text-slate-500">
                  Aktifkan jika nilai tugas ini hanya untuk internal guru.
                </p>
              </div>
              <Switch
                checked={!editTugasForm.is_nilai_published_to_students}
                onCheckedChange={(checked) =>
                  setEditTugasForm((p) => ({
                    ...p,
                    is_nilai_published_to_students: !checked,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTugas(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdateTugas}
              disabled={isUpdatingTugas || !editTugasForm.judul}
            >
              {isUpdatingTugas ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeletingTugas} onOpenChange={setIsDeletingTugas}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Yakin ingin menghapus tugas{" "}
            <span className="font-semibold">{selectedTugas?.judul}</span>?
            Data nilai/submisi terkait bisa ikut terpengaruh.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletingTugas(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTugas}
              disabled={isDeletingTugasRequest}
            >
              {isDeletingTugasRequest ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
