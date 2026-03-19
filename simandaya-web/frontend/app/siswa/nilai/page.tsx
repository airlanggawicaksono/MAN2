"use client";

import { useGetMyScoresQuery, useListSemestersQuery } from "@/api/usertype/siswa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { GraduationCap, Filter, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState } from "react";

export default function SiswaNilaiPage() {
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  
  const { data: semesters } = useListSemestersQuery();
  const { data: scores, isLoading, error } = useGetMyScoresQuery({
    semesterId: selectedSemester === "all" ? undefined : selectedSemester
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data nilai...</div>;
  if (error) return <div className="p-8 text-destructive text-center font-medium">Gagal memuat data nilai.</div>;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Nilai Saya
          </h1>
          <p className="text-slate-500">
            Pantau hasil belajar dan perkembangan akademik Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="bg-slate-100 p-2 rounded-lg">
            <Filter className="w-4 h-4 text-slate-500" />
          </div>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[200px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Pilih Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              {semesters?.map((s) => (
                <SelectItem key={s.semester_id} value={s.semester_id}>
                  {s.tipe}
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
              <GraduationCap className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg font-bold text-slate-800">
                Rekapitulasi Nilai Tugas & Ulangan
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead className="font-semibold">Mata Pelajaran</TableHead>
                  <TableHead className="font-semibold text-center">Nilai</TableHead>
                  <TableHead className="font-semibold">Keterangan / Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores?.map((item, idx) => (
                  <TableRow key={item.nilai_id || idx} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-slate-900">Mata Pelajaran ID: {item.tugas_id}</div>
                      <div className="text-[10px] text-slate-400 font-mono italic">ID Tugas: {item.tugas_id}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2 ${
                        item.nilai >= 75 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>
                        {item.nilai}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">
                        {item.catatan || <span className="text-slate-300 italic">Tidak ada catatan.</span>}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!scores || scores.length === 0) && (
              <div className="py-20 text-center bg-slate-50/30">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Belum ada data nilai untuk periode ini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
