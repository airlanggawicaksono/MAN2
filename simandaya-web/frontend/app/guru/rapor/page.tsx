"use client";

import { Fragment } from "react";
import type { ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Save, Send } from "lucide-react";
import { useGuruRaporController } from "./use-guru-rapor-controller";

export default function GuruRaporPage() {
  const {
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
    selectedTahunAjaranId,
    selectedSemesterId,
    selectedSiswaId,
    selectedStudent,
    semesterOptions,
    setCatatanWaliKelas,
    setDraftByRaporNilaiId,
    setMessage,
    setSelectedTahunAjaranId,
    setSelectedSemesterId,
    setSelectedKelasId,
    setSelectedSiswaId,
    tahunAjaranList,
    unpublishing,
  } = useGuruRaporController();

  if (!classes.length) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto space-y-4">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Akses Terbatas</h1>
        <p className="text-slate-500">
          Anda belum memiliki penugasan kelas untuk melihat rapor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Rapor Kelas
        </h1>
        <p className="text-slate-500">
          Pilih tahun ajaran, semester, dan kelas untuk melihat dan mengelola rapor.
        </p>
        <div className="grid max-w-3xl gap-3 md:grid-cols-3">
          <Select
            value={selectedTahunAjaranId}
            onValueChange={(value) => {
              setSelectedTahunAjaranId(value);
              setSelectedSiswaId(null);
              setMessage("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tahun ajaran" />
            </SelectTrigger>
            <SelectContent>
              {tahunAjaranList.map((ta) => (
                <SelectItem key={ta.tahun_ajaran_id} value={ta.tahun_ajaran_id}>
                  {ta.nama}
                  {ta.is_active ? " (Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedSemesterId}
            onValueChange={(value) => {
              setSelectedSemesterId(value);
              setSelectedSiswaId(null);
              setMessage("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih semester" />
            </SelectTrigger>
            <SelectContent>
              {semesterOptions.map((semester) => (
                <SelectItem key={semester.semester_id} value={semester.semester_id}>
                  {semester.tipe}
                  {semester.is_active ? " (Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedKelasId}
            onValueChange={(value) => {
              setSelectedKelasId(value);
              setSelectedSiswaId(null);
              setMessage("");
            }}
            disabled={!classOptions.length}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((kelas) => (
                <SelectItem key={kelas.kelas_id} value={kelas.kelas_id}>
                  {kelas.nama_kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSemesterId && !classOptions.length ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Tidak ada kelas yang ditugaskan untuk semester ini.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-800">
              Daftar Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.map((item) => (
                    <TableRow
                      key={item.user_id}
                      className={`cursor-pointer ${
                        selectedSiswaId === item.user_id ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedSiswaId(item.user_id)}
                    >
                      <TableCell>
                        <div className="font-semibold text-slate-900">{item.nama_lengkap}</div>
                        <div className="text-xs text-slate-500">{item.username}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_published ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                            Terbit
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loadingReports && (!reports || reports.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-slate-500 py-8">
                        Belum ada siswa pada kelas ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-800">
                  Editor Rapor
                </CardTitle>
                <p className="text-xs text-slate-500">
                  {selectedStudent
                    ? `${selectedStudent.nama_lengkap} - ${
                        selectedSemester ? selectedSemester.tipe : "-"
                      } - ${selectedClass?.nama_kelas || "-"}`
                    : "Pilih siswa dulu."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSaveDraft}
                  disabled={!editor || saving}
                >
                  <Save className="w-4 h-4" />
                  Simpan Draft
                </Button>
                {editor?.is_published ? (
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={handleUnpublish}
                    disabled={!editor || unpublishing}
                  >
                    Tarik Publikasi
                  </Button>
                ) : (
                  <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-500"
                    onClick={handlePublish}
                    disabled={!editor || publishing}
                  >
                    <Send className="w-4 h-4" />
                    Publish
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {message ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {message}
              </div>
            ) : null}

            {!selectedSiswaId ? (
              <div className="py-16 text-center text-slate-500">
                Pilih siswa dari panel kiri untuk mulai edit rapor.
              </div>
            ) : loadingEditor || !editor ? (
              <div className="py-16 text-center text-slate-500">Memuat editor rapor...</div>
            ) : (
              <>
                <div className="grid gap-2 md:grid-cols-5">
                  <div className="rounded-md border p-3">
                    <p className="text-[11px] uppercase text-slate-400">Hadir</p>
                    <p className="text-lg font-bold">{editor.attendance_summary.hadir}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-[11px] uppercase text-slate-400">Sakit</p>
                    <p className="text-lg font-bold">{editor.attendance_summary.sakit}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-[11px] uppercase text-slate-400">Izin</p>
                    <p className="text-lg font-bold">{editor.attendance_summary.izin}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-[11px] uppercase text-slate-400">Alfa</p>
                    <p className="text-lg font-bold">{editor.attendance_summary.alfa}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-[11px] uppercase text-slate-400">Status</p>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      {editor.is_published ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Published
                        </>
                      ) : (
                        "Draft"
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Catatan wali kelas
                  </label>
                  <textarea
                    value={catatanWaliKelas}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setCatatanWaliKelas(e.target.value)
                    }
                    placeholder="Catatan rapor (opsional)"
                    className="min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>

                <div className="rounded-lg border">
                  <div className="max-h-[48vh] overflow-auto">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow className="bg-slate-50/40">
                          <TableHead className="w-[25%]">Mapel</TableHead>
                          <TableHead className="w-[12%] text-center">Nilai Sumber</TableHead>
                          <TableHead className="w-[16%] text-center">Override</TableHead>
                          <TableHead className="w-[12%] text-center">Nilai Final</TableHead>
                          <TableHead className="w-[10%] text-center">Manual</TableHead>
                          <TableHead className="w-[25%]">Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editor.grades.map((row) => {
                          const draft = draftByRaporNilaiId[row.rapor_nilai_id] ?? {
                            rapor_nilai_id: row.rapor_nilai_id,
                            mapel_id: row.mapel_id,
                            nilai_override: "",
                            catatan: "",
                          };
                          const overrideNum =
                            draft.nilai_override.trim() === ""
                              ? undefined
                              : Number(draft.nilai_override);
                          const finalValue =
                            overrideNum === undefined || Number.isNaN(overrideNum)
                              ? row.nilai_sumber
                              : overrideNum;
                          return (
                            <Fragment key={row.rapor_nilai_id}>
                            <TableRow>
                              <TableCell>
                                <div className="font-semibold">{row.mapel_nama}</div>
                                <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                                  {(["UTS", "UAS"] as const).map((jenis) => {
                                    const comp = row.komponen_nilai.find(
                                      (item) => item.jenis_tugas === jenis,
                                    );
                                    return (
                                      <div key={jenis}>
                                        {jenis}: {comp ? `${comp.nilai_rata} (${comp.jumlah_tugas})` : "-"}
                                      </div>
                                    );
                                  })}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{row.nilai_sumber}</TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.01}
                                  value={draft.nilai_override}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setDraftByRaporNilaiId((prev) => ({
                                      ...prev,
                                      [row.rapor_nilai_id]: {
                                        ...draft,
                                        nilai_override: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Kosong = pakai sumber"
                                  className="text-center"
                                />
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {Number.isNaN(finalValue) ? row.nilai_sumber : finalValue}
                              </TableCell>
                              <TableCell className="text-center">
                                {overrideNum === undefined ? "Tidak" : "Ya"}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={draft.catatan}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setDraftByRaporNilaiId((prev) => ({
                                      ...prev,
                                      [row.rapor_nilai_id]: {
                                        ...draft,
                                        catatan: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Catatan mapel (opsional)"
                                />
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-slate-50/40">
                              <TableCell colSpan={6} className="py-2">
                                <div className="text-xs font-medium text-slate-600 mb-2">
                                  Referensi tugas (Tugas/UTS/UAS)
                                </div>
                                <div className="space-y-1">
                                  {row.rincian_tugas.length ? (
                                    row.rincian_tugas.map((tugas) => (
                                      <div
                                        key={tugas.tugas_id}
                                        className="grid grid-cols-[140px_1fr_80px] gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                                      >
                                        <div className="font-medium text-slate-700">{tugas.jenis_tugas}</div>
                                        <div className="truncate text-slate-600">{tugas.judul_tugas}</div>
                                        <div className="text-right font-semibold text-slate-800">
                                          {tugas.nilai ?? "-"}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs italic text-slate-500">
                                      Belum ada detail tugas untuk mapel ini.
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
