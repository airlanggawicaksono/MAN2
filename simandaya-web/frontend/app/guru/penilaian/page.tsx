"use client";

import { useState, useMemo, useEffect } from "react";

import {
  useListMyGuruMapelQuery,
  useListSemestersQuery,
  useListKelasQuery,
  useListSiswaInKelasQuery
} from "@/api/shared/akademik";
import { 
  useListTugasByKelasQuery, 
  useCreateTugasMutation,
  useListNilaiByTugasQuery,
  useBulkCreateNilaiMutation
} from "@/api/shared/penilaian";
import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  TableRow 
} from "@/components/ui/table";
import { Plus, Save, GraduationCap, BookOpen, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function GuruPenilaianPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: assignments } = useListMyGuruMapelQuery();
  const { data: semesters } = useListSemestersQuery();
  const activeSemester = semesters?.find(s => s.is_active);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [selectedTugasId, setSelectedTugasId] = useState<string>("");
  const [isCreatingTugas, setIsCreatingTugas] = useState(false);

  const [createTugas, { isLoading: creatingTugas }] = useCreateTugasMutation();
  const [newTugasForm, setNewTugasForm] = useState({
    judul: "",
    jenis: "Tugas",
  });

  const handleCreateTugas = async () => {
    if (!selectedAssignment || !activeSemester) return;
    const result = await createTugas({
      ...newTugasForm,
      kelas_id: selectedAssignment.kelas_id,
      mapel_id: selectedAssignment.mapel_id,
      semester_id: activeSemester.semester_id,
    });
    if ("data" in result && result.data) {
      setIsCreatingTugas(false);
      setNewTugasForm({ judul: "", jenis: "Tugas" });
      setSelectedTugasId(result.data.tugas_id);
    }
  };

  // Derive selected info
  const selectedAssignment = useMemo(() => 
    assignments?.find(a => a.guru_mapel_id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  // Fetch assessments for selected class/subject
  const { data: assessments, isLoading: loadingTugas } = useListTugasByKelasQuery(
    { 
      kelasId: selectedAssignment?.kelas_id || "", 
      semesterId: activeSemester?.semester_id || "",
      mapelId: selectedAssignment?.mapel_id 
    },
    { skip: !selectedAssignment || !activeSemester }
  );

  // Fetch students in class
  const { data: students } = useListSiswaInKelasQuery(
    selectedAssignment?.kelas_id || "",
    { skip: !selectedAssignment }
  );

  // Fetch existing grades for selected tugas
  const { data: existingGrades } = useListNilaiByTugasQuery(
    selectedTugasId,
    { skip: !selectedTugasId }
  );

  const [bulkUpdateNilai, { isLoading: isSaving }] = useBulkCreateNilaiMutation();
  const [gradesDraft, setGradesDraft] = useState<Record<string, number>>({});

  // Sync draft with existing grades
  useEffect(() => {
    if (existingGrades) {
      const draft: Record<string, number> = {};
      existingGrades.forEach(g => {
        draft[g.user_id] = g.nilai;
      });
      setGradesDraft(draft);
    } else {
      setGradesDraft({});
    }
  }, [existingGrades]);

  const handleGradeChange = (userId: string, value: string) => {
    const numVal = parseFloat(value);
    setGradesDraft(prev => ({ ...prev, [userId]: isNaN(numVal) ? 0 : numVal }));
  };

  const handleSaveGrades = async () => {
    if (!selectedTugasId) return;
    const entries = Object.entries(gradesDraft).map(([userId, val]) => ({
      user_id: userId,
      nilai: val,
    }));
    
    await bulkUpdateNilai({ 
      tugasId: selectedTugasId, 
      body: { entries } 
    });
  };

  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Penilaian Siswa</h1>
        <p className="text-slate-500">Input nilai harian, UTS, dan UAS untuk siswa Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Select Class & Tugas */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Pilih Kelas & Mapel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select value={selectedAssignmentId} onValueChange={(val) => {
                  setSelectedAssignmentId(val);
                  setSelectedTugasId("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments?.map((a) => (
                      <SelectItem key={a.guru_mapel_id} value={a.guru_mapel_id}>
                        {a.kelas_nama} - {a.mapel_nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAssignment && (
                <div className="space-y-2 pt-4 border-t border-dashed">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Jenis Penilaian</Label>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600" onClick={() => setIsCreatingTugas(true)}>
                      <Plus className="w-3 h-3 mr-1" /> Baru
                    </Button>
                  </div>
                  <Select value={selectedTugasId} onValueChange={setSelectedTugasId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tugas/Assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments?.map((t) => (
                        <SelectItem key={t.tugas_id} value={t.tugas_id}>
                          {t.judul} ({t.jenis})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main: Student Grid */}
        <div className="lg:col-span-3">
          {!selectedTugasId ? (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-slate-50 text-slate-400">
              <BookOpen className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">Silakan pilih Kelas dan Penilaian untuk memulai penginputan nilai.</p>
            </div>
          ) : (
            <Card className="border-slate-200 shadow-xl overflow-hidden rounded-3xl">
              <CardHeader className="bg-slate-900 text-white py-6 px-8 flex flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500 p-3 rounded-2xl">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {assessments?.find(t => t.tugas_id === selectedTugasId)?.judul}
                    </h2>
                    <p className="text-blue-200 text-xs uppercase font-bold tracking-widest">
                      {selectedAssignment?.kelas_nama} • {selectedAssignment?.mapel_nama}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveGrades} 
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 gap-2 h-12 px-6 rounded-xl shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Semua Nilai"}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[80px] text-center">No</TableHead>
                      <TableHead>Nama Lengkap Siswa</TableHead>
                      <TableHead className="w-[120px] text-center">NIS</TableHead>
                      <TableHead className="w-[150px] text-center">Nilai (0-100)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students?.map((s, idx) => (
                      <TableRow key={s.user_id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell className="text-center font-mono text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-slate-900">{s.nama_lengkap}</TableCell>
                        <TableCell className="text-center text-slate-500 font-mono text-xs">{s.nis}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="w-20 mx-auto text-center font-bold text-lg h-11 border-2 focus:border-blue-500"
                            value={gradesDraft[s.user_id] ?? ""}
                            onChange={(e) => handleGradeChange(s.user_id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {(gradesDraft[s.user_id] ?? 0) >= 75 ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">TUNTAS</Badge>
                          ) : (
                            <Badge variant="destructive">REMIDIAL</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isCreatingTugas} onOpenChange={setIsCreatingTugas}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Penilaian Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="judul">Judul Penilaian</Label>
              <Input
                id="judul"
                placeholder="Contoh: Ulangan Harian 1"
                value={newTugasForm.judul}
                onChange={(e) => setNewTugasForm(prev => ({ ...prev, judul: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenis">Jenis</Label>
              <Select 
                value={newTugasForm.jenis} 
                onValueChange={(val) => setNewTugasForm(prev => ({ ...prev, jenis: val }))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingTugas(false)}>Batal</Button>
            <Button onClick={handleCreateTugas} disabled={creatingTugas || !newTugasForm.judul}>
              {creatingTugas ? "Membuat..." : "Buat Penilaian"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
