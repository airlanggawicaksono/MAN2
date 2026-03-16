"use client";

import { useMemo } from "react";
import { 
  useListKelasQuery, 
  useListSemestersQuery 
} from "@/api/akademik";
import { 
  useListRaporByKelasQuery, 
  useGenerateRaporMutation,
  usePublishAllRaporMutation,
  usePublishRaporMutation
} from "@/api/penilaian";
import { useGetMyTeacherProfileQuery } from "@/api/teachers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ClipboardCheck, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GuruRaporPage() {
  const { data: profile } = useGetMyTeacherProfileQuery();
  const { data: classes } = useListKelasQuery();
  const { data: semesters } = useListSemestersQuery();
  
  const activeSemester = semesters?.find(s => s.is_active);

  // Find the class where this teacher is Wali Kelas
  const myManagedClass = useMemo(() => 
    classes?.find(c => c.wali_kelas_id === profile?.user_id),
    [classes, profile]
  );

  const { data: reports, isLoading: loadingRapor, refetch } = useListRaporByKelasQuery(
    { 
      kelasId: myManagedClass?.kelas_id || "", 
      semesterId: activeSemester?.semester_id || "" 
    },
    { skip: !myManagedClass || !activeSemester }
  );

  const [generateRapor, { isLoading: generating }] = useGenerateRaporMutation();
  const [publishAll, { isLoading: publishingAll }] = usePublishAllRaporMutation();
  const [publishOne, { isLoading: publishingOne }] = usePublishRaporMutation();

  const handleGenerate = async () => {
    if (!myManagedClass || !activeSemester) return;
    await generateRapor({
      kelas_id: myManagedClass.kelas_id,
      semester_id: activeSemester.semester_id
    });
    refetch();
  };

  const handlePublishAll = async () => {
    if (!myManagedClass || !activeSemester) return;
    await publishAll({
      kelasId: myManagedClass.kelas_id,
      semesterId: activeSemester.semester_id
    });
  };

  if (!myManagedClass) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto space-y-4">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Akses Terbatas</h1>
        <p className="text-slate-500">
          Halaman ini hanya dapat diakses oleh Guru yang ditugaskan sebagai <strong>Wali Kelas</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Manajemen Rapor - {myManagedClass.nama_kelas}
          </h1>
          <p className="text-slate-500">
            Semester: {activeSemester?.tipe} | Tahun: {activeSemester?.tahun_ajaran_id}
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerate} 
            disabled={generating}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            Generate / Update Rapor
          </Button>
          <Button 
            onClick={handlePublishAll} 
            disabled={publishingAll || !reports?.length}
            className="bg-blue-600 hover:bg-blue-500 gap-2"
          >
            <Send className="w-4 h-4" />
            Publikasikan Semua
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-bold text-slate-800">
              Daftar Siswa & Status Rapor
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/30">
                <TableHead className="w-[80px] text-center">No</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-[150px] text-center">Status Publikasi</TableHead>
                <TableHead className="w-[200px] text-center">Tanggal Publikasi</TableHead>
                <TableHead className="w-[150px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.map((r, idx) => (
                <TableRow key={r.rapor_id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-center font-mono text-slate-400">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{r.nama_lengkap}</div>
                    <div className="text-xs text-slate-500 font-mono italic">{r.username}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.is_published ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terbit
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-slate-500 text-sm">
                    {r.published_at ? new Date(r.published_at).toLocaleDateString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {!r.is_published && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => publishOne(r.rapor_id)}
                        disabled={publishingOne}
                      >
                        Publikasikan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!reports || reports.length === 0) && (
            <div className="py-20 text-center bg-slate-50/30">
              <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Data rapor belum dibuat. Klik "Generate" untuk memulai.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
