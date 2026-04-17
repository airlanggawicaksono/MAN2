"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, Filter, BookOpen, ClipboardList, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SiswaOverviewTugasItem } from "@/types/penilaian/siswa-overview";
import { useSiswaNilaiController } from "./use-siswa-nilai-controller";

export default function SiswaNilaiPage() {
  const {
    effectiveSemesterId,
    effectiveSemesterKey,
    effectiveSemesterOption,
    filteredTugasList,
    isFetchingOverview,
    isProfileResolvedForCurrentUser,
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
    isMarkingSubmitted,
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
  } = useSiswaNilaiController();
  const [selectedTugas, setSelectedTugas] = useState<SiswaOverviewTugasItem | null>(null);
  const selectedIsSubmitted = !!(
    selectedTugas &&
    (selectedTugas.is_submitted || submittedTugasIdSet.has(selectedTugas.tugas_id))
  );
  const selectedIsLatePending = !!(
    selectedTugas &&
    !selectedIsSubmitted &&
    selectedTugas.deadline &&
    new Date(selectedTugas.deadline).getTime() < Date.now()
  );

  if (!isProfileResolvedForCurrentUser || loadingTimeline || loadingProfile) {
    return <div className="p-8 text-center text-slate-500">Memuat data...</div>;
  }
  if (overviewError && !(typeof overviewError === "object" && "status" in overviewError && overviewError.status === 404)) {
    return (
      <div className="p-8 text-destructive text-center font-medium">
        Gagal memuat data akademik siswa.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Hasil Nilai, Rapor, dan Tugas
          </h1>
          <p className="text-slate-500">
            Semua progres belajar siswa dalam satu halaman.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">
              Kelas: {effectiveSemesterOption?.kelas_nama || profile?.kelas_nama || "-"}
            </Badge>
            <Badge variant="outline">{selectedSemesterLabel}</Badge>
            <Badge variant="outline">
              Tingkat: {effectiveSemesterOption?.tingkat || "-"}
            </Badge>
            <Badge variant="outline">
              Tahun Ajaran: {effectiveSemesterOption?.tahun_ajaran_nama || "-"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="bg-slate-100 p-2 rounded-lg">
            <Filter className="w-4 h-4 text-slate-500" />
          </div>
          <Select value={effectiveSemesterKey} onValueChange={setSelectedSemesterKey}>
            <SelectTrigger className="w-[220px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Pilih Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesterOptions.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg font-bold text-slate-800">
                Ringkasan Rapor
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!effectiveSemesterId ? (
              <p className="text-sm text-slate-500">Periode semester ini belum tersedia.</p>
            ) : isFetchingOverview && !rapor ? (
              <p className="text-sm text-slate-500">Memuat ringkasan rapor...</p>
            ) : rapor ? (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Hadir</p>
                  <p className="text-lg font-bold">{rapor.attendance_summary.hadir}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Sakit</p>
                  <p className="text-lg font-bold text-blue-600">{rapor.attendance_summary.sakit}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Izin</p>
                  <p className="text-lg font-bold text-orange-600">{rapor.attendance_summary.izin}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Alfa</p>
                  <p className="text-lg font-bold text-red-600">{rapor.attendance_summary.alfa}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Terlambat</p>
                  <p className="text-lg font-bold">{rapor.attendance_summary.terlambat}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Status</p>
                  <p className="text-sm font-semibold">Published</p>
                </div>
                <div className="col-span-2 md:col-span-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  Catatan wali kelas: {rapor.catatan_wali_kelas || "Tidak ada catatan."}
                </div>
              </div>
            ) : raporNotFound ? (
              <p className="text-sm text-slate-500">
                Rapor belum dipublikasikan untuk semester ini.
              </p>
            ) : (
              <p className="text-sm text-destructive">Gagal memuat rapor semester ini.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg font-bold text-slate-800">
                Detail Nilai per Mata Pelajaran
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-auto">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="font-semibold w-[36%]">Tugas</TableHead>
                    <TableHead className="font-semibold w-[18%]">Jenis</TableHead>
                    <TableHead className="font-semibold text-center w-[16%]">Nilai</TableHead>
                    <TableHead className="font-semibold w-[30%]">Keterangan / Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nilaiMapel.flatMap((group) => {
                    const rows = group.tugas_details.length
                      ? group.tugas_details.map((item) => (
                          <TableRow key={`${group.mapel_id}-${item.tugas_id}`} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-semibold text-slate-900 break-words">
                              {item.judul_tugas || "Tugas"}
                            </TableCell>
                            <TableCell className="break-words">
                              <Badge variant="outline">{item.jenis_tugas || "-"}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {item.nilai_disembunyikan ? (
                                <span className="text-slate-500 italic font-normal">
                                  Disembunyikan
                                </span>
                              ) : (
                                <span className="text-slate-900">
                                  {item.nilai ?? "-"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 break-words">
                              {item.catatan || <span className="text-slate-300 italic">Tidak ada catatan.</span>}
                            </TableCell>
                          </TableRow>
                        ))
                      : [
                          <TableRow key={`${group.mapel_id}-empty`}>
                            <TableCell colSpan={4} className="text-sm text-slate-500 italic">
                              Belum ada detail tugas pada mata pelajaran ini.
                            </TableCell>
                          </TableRow>,
                        ];
                    return [
                      <TableRow key={`header-${group.mapel_id}`} className="bg-slate-50/70">
                        <TableCell colSpan={2} className="font-semibold text-slate-900">
                          {group.mapel_nama}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-semibold">
                            {group.nilai_akhir}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 break-words">
                          {group.catatan || (
                            <span className="text-slate-300 italic">Tidak ada catatan.</span>
                          )}
                        </TableCell>
                      </TableRow>,
                      ...rows,
                    ];
                  })}
                </TableBody>
              </Table>
            </div>
            {isFetchingOverview && nilaiMapel.length === 0 && (
              <div className="py-20 text-center bg-slate-50/30 text-slate-500">
                Memuat detail nilai...
              </div>
            )}
            {nilaiMapel.length === 0 && !isFetchingOverview && (
              <div className="py-20 text-center bg-slate-50/30">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">
                  {raporNotFound
                    ? "Nilai mengikuti rapor yang sudah dipublikasikan."
                    : "Periode semester ini belum dibuat di data akademik."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg font-bold text-slate-800">
                Tugas Saya
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-3 md:grid-cols-4 p-4 border-b border-slate-100">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Status Tugas</label>
                <Select value={tugasStatusFilter} onValueChange={(v) => setTugasStatusFilter(v as "all" | "not_submitted" | "submitted" | "late_pending")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_submitted">Belum dikumpulkan</SelectItem>
                    <SelectItem value="late_pending">Belum dikumpulkan (terlambat)</SelectItem>
                    <SelectItem value="submitted">Sudah dikumpulkan</SelectItem>
                    <SelectItem value="all">Semua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Dari tanggal</label>
                <Input
                  type="date"
                  value={tugasDateFrom}
                  onChange={(e) => setTugasDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Sampai tanggal</label>
                <Input
                  type="date"
                  value={tugasDateTo}
                  onChange={(e) => setTugasDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Hasil Filter</label>
                <div className="h-10 rounded-md border bg-slate-50 px-3 flex items-center text-sm text-slate-600">
                  {isFetchingOverview ? "Memuat..." : `${filteredTugasList.length} tugas`}
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead className="font-semibold">Judul</TableHead>
                  <TableHead className="font-semibold">Mata Pelajaran</TableHead>
                  <TableHead className="font-semibold">Deadline</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTugasList.map((tugas) => {
                  const isSubmitted = tugas.is_submitted || submittedTugasIdSet.has(tugas.tugas_id);
                  return (
                    <TableRow
                      key={tugas.tugas_id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedTugas(tugas)}
                    >
                      <TableCell className="font-semibold text-slate-900">{tugas.judul}</TableCell>
                      <TableCell>{tugas.mapel_nama || "-"}</TableCell>
                      <TableCell>
                        {tugas.deadline
                          ? new Date(tugas.deadline).toLocaleString("id-ID")
                          : "Tidak ditentukan"}
                      </TableCell>
                      <TableCell>
                        {isSubmitted ? (
                          <div className="space-y-1">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Sudah mengumpulkan
                            </Badge>
                            {tugas.submitted_at ? (
                              <p className="text-[11px] text-slate-500">
                                {new Date(tugas.submitted_at).toLocaleString("id-ID")}
                              </p>
                            ) : null}
                            {tugas.is_late_submission ? (
                              <p className="text-[11px] font-medium text-amber-600">Terlambat</p>
                            ) : null}
                          </div>
                        ) : (
                          <Badge variant="outline">Belum mengumpulkan</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredTugasList.length === 0 && (
              <div className="py-16 text-center bg-slate-50/30">
                <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">
                  {effectiveSemesterOption?.is_available
                    ? "Tidak ada tugas untuk semester ini."
                    : "Periode semester ini belum dibuat di data akademik."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTugas} onOpenChange={(open) => (!open ? setSelectedTugas(null) : null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedTugas?.judul || "Detail Tugas"}</DialogTitle>
            <DialogDescription>
              {selectedTugas?.mapel_nama || "-"} • {selectedTugas?.jenis || "-"}
            </DialogDescription>
          </DialogHeader>
          {selectedTugas ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-[11px] uppercase text-slate-400">Deadline</p>
                  <p className="font-medium text-slate-800">
                    {selectedTugas.deadline
                      ? new Date(selectedTugas.deadline).toLocaleString("id-ID")
                      : "Tidak ditentukan"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-[11px] uppercase text-slate-400">Status</p>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-800">
                      {selectedIsSubmitted ? "Sudah mengumpulkan" : "Belum mengumpulkan"}
                    </p>
                    {selectedTugas.submitted_at ? (
                      <p className="text-xs text-slate-500">
                        Waktu submit: {new Date(selectedTugas.submitted_at).toLocaleString("id-ID")}
                      </p>
                    ) : null}
                    {selectedTugas.is_late_submission || selectedIsLatePending ? (
                      <p className="text-xs font-medium text-amber-600">Status submit: Terlambat</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-[11px] uppercase text-slate-400">Mata Pelajaran</p>
                  <p className="font-medium text-slate-800">{selectedTugas.mapel_nama || "-"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-[11px] uppercase text-slate-400">Guru Pengajar</p>
                  <p className="font-medium text-slate-800">{selectedTugas.guru_pengajar || "-"}</p>
                </div>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] uppercase text-slate-400">Deskripsi</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">
                  {selectedTugas.deskripsi || "Tidak ada deskripsi."}
                </p>
              </div>
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-[11px] uppercase text-slate-400">Link Detail</p>
                <div className="text-sm text-slate-700">
                  Link Tugas:{" "}
                  {selectedTugas.link_tugas ? (
                    <a
                      href={selectedTugas.link_tugas}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 text-blue-600 hover:text-blue-500"
                    >
                      Buka Materi
                    </a>
                  ) : (
                    <span className="text-slate-500">Tidak tersedia</span>
                  )}
                </div>
                <div className="text-sm text-slate-700">
                  Link Pengumpulan:{" "}
                  {selectedTugas.link_submission ? (
                    <a
                      href={selectedTugas.link_submission}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 text-blue-600 hover:text-blue-500"
                    >
                      Buka Form
                    </a>
                  ) : (
                    <span className="text-slate-500">Tidak tersedia</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selectedIsSubmitted ? (
                  <Button
                    onClick={async () => {
                      const ok = await handleMarkSubmitted(selectedTugas);
                      if (!ok) return;
                      setSelectedTugas((prev) =>
                        prev && prev.tugas_id === selectedTugas.tugas_id
                          ? {
                              ...prev,
                              is_submitted: true,
                              submitted_at: new Date().toISOString(),
                              is_late_submission:
                                prev.is_late_submission ||
                                (!!prev.deadline &&
                                  new Date(prev.deadline).getTime() < Date.now()),
                            }
                          : prev,
                      );
                    }}
                    disabled={isMarkingSubmitted}
                  >
                    {isMarkingSubmitted
                      ? "Menyimpan..."
                      : selectedIsLatePending
                        ? "Tandai Sudah Mengumpulkan (Terlambat)"
                        : "Tandai Sudah Mengumpulkan"}
                  </Button>
                ) : null}
                {selectedIsSubmitted ? (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      const ok = await handleCancelSubmission(selectedTugas.tugas_id);
                      if (ok) {
                        setSelectedTugas((prev) =>
                          prev && prev.tugas_id === selectedTugas.tugas_id
                            ? {
                                ...prev,
                                is_submitted: false,
                                submitted_at: null,
                                is_late_submission: false,
                              }
                            : prev,
                        );
                      }
                    }}
                    disabled={isCancellingSubmission}
                  >
                    {isCancellingSubmission
                      ? "Membatalkan..."
                      : "Batalkan Pengumpulan"}
                  </Button>
                ) : null}
                {selectedTugas.link_tugas ? (
                  <Button asChild variant="outline">
                    <a href={selectedTugas.link_tugas} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Buka Link Tugas
                    </a>
                  </Button>
                ) : null}
                {selectedTugas.link_submission ? (
                  <Button asChild>
                    <a href={selectedTugas.link_submission} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Buka Google Form
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
