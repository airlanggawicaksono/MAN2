"use client";

import React, { useState } from "react";
import { useListPublicIzinKeluarQuery } from "@/api/absensi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Clock, LogOut, Filter } from "lucide-react";

export default function AdminIzinKesiswaanPage() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  const { data: izins, isLoading } = useListPublicIzinKeluarQuery({
    tanggal,
    search: search || undefined,
  });

  return (
    <div className="w-full space-y-8 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LogOut className="w-6 h-6 text-orange-600" />
            Log Izin Keluar Siswa
          </h1>
          <p className="text-sm text-slate-500">Monitoring data izin keluar/masuk siswa real-time</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="date"
              className="pl-10 w-full sm:w-[200px] rounded-xl border-slate-200"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama siswa..."
              className="pl-10 w-full sm:w-[300px] rounded-xl border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl bg-white">
          <CardHeader className="border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Riwayat Izin</CardTitle>
                <CardDescription>Menampilkan data untuk tanggal {new Date(tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
              </div>
              <Badge className="bg-orange-50 text-orange-700 border-orange-100">
                {izins?.length || 0} Data
              </Badge>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Waktu Keluar</TableHead>
                <TableHead className="font-bold text-slate-700">Nama Siswa</TableHead>
                <TableHead className="font-bold text-slate-700">Kelas</TableHead>
                <TableHead className="font-bold text-slate-700">Keterangan</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status Kembali</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : !izins || izins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic text-sm">
                    Tidak ada data izin keluar untuk tanggal ini.
                  </TableCell>
                </TableRow>
              ) : (
                izins.map((izin) => (
                  <TableRow key={izin.izin_id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(izin.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{izin.nama_siswa}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        {izin.kelas || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 max-w-xs truncate">
                      {izin.keterangan}
                    </TableCell>
                    <TableCell className="text-center">
                      {izin.waktu_kembali ? (
                        <div className="flex flex-col items-center">
                          <Badge className="bg-green-50 text-green-700 border-green-100">Sudah Kembali</Badge>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {new Date(izin.waktu_kembali).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-100">Belum Kembali</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
