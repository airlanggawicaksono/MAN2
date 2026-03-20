"use client";

import { useGetMyRaporQuery } from "@/api/shared/penilaian";
import { useListSemestersQuery } from "@/api/shared/akademik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BookOpen, FileText, Download, UserCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SiswaRaporPage() {
  const { data: semesters } = useListSemestersQuery();
  const activeSemester = semesters?.find(s => s.is_active);
  
  const [selectedSemester, setSelectedSemester] = useState<string>(
    activeSemester?.semester_id || ""
  );

  const { data: rapor, isLoading, error } = useGetMyRaporQuery(
    selectedSemester,
    { skip: !selectedSemester }
  );

  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data rapor...</div>;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Rapor Digital
          </h1>
          <p className="text-slate-500">
            Laporan hasil belajar dan kehadiran siswa per semester.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[220px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Pilih Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters?.map((s) => (
                <SelectItem key={s.semester_id} value={s.semester_id}>
                  {s.tipe} {s.is_active ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedSemester ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-white">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Silakan pilih semester untuk melihat rapor.</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center border-2 border-dashed border-red-100 rounded-2xl bg-red-50/30">
          <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Rapor belum tersedia atau belum dipublikasikan.</p>
          <p className="text-sm text-red-400 mt-1">Hubungi wali kelas Anda untuk informasi lebih lanjut.</p>
        </div>
      ) : rapor && (
        <div className="grid gap-8">
          {/* Header Rapor */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Laporan Hasil Belajar</h2>
                  <p className="text-slate-400 text-sm">Status: {rapor.is_published ? "Sudah Dipublikasikan" : "Draft / Belum Final"}</p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-12 px-6 rounded-xl shadow-lg shadow-blue-900/20">
                <Download className="w-4 h-4" />
                Unduh PDF
              </Button>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1 p-4 rounded-xl bg-slate-50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Catatan Wali Kelas</p>
                  <p className="text-slate-700 italic">"{rapor.catatan_wali_kelas || "Tidak ada catatan."}"</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="text-center p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Hadir</p>
                    <p className="text-xl font-bold text-slate-900">{rapor.attendance_summary.hadir}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Sakit</p>
                    <p className="text-xl font-bold text-blue-600">{rapor.attendance_summary.sakit}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Izin</p>
                    <p className="text-xl font-bold text-orange-600">{rapor.attendance_summary.izin}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Alfa</p>
                    <p className="text-xl font-bold text-red-600">{rapor.attendance_summary.alfa}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Late</p>
                    <p className="text-xl font-bold text-slate-500">{rapor.attendance_summary.terlambat}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabel Nilai Rapor */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-bold text-slate-800">Capaian Kompetensi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="font-semibold">Mata Pelajaran</TableHead>
                    <TableHead className="font-semibold text-center w-[120px]">Nilai Akhir</TableHead>
                    <TableHead className="font-semibold text-center w-[120px]">Predikat</TableHead>
                    <TableHead className="font-semibold">Catatan Kompetensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.grades.map((grade) => (
                    <TableRow key={grade.rapor_nilai_id}>
                      <TableCell className="font-bold text-slate-900">{grade.mapel_nama}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-lg font-mono font-bold ${grade.nilai_akhir >= 75 ? "text-slate-900" : "text-red-600"}`}>
                          {grade.nilai_akhir}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={grade.nilai_akhir >= 85 ? "default" : "secondary"} className="font-bold px-3">
                          {grade.nilai_akhir >= 90 ? "A" : grade.nilai_akhir >= 80 ? "B" : grade.nilai_akhir >= 75 ? "C" : "D"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 leading-relaxed max-w-md">
                        {grade.catatan || "Ananda menunjukkan penguasaan yang sangat baik dalam memahami materi ini."}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
