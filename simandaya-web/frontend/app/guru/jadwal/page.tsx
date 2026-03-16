"use client";

import { useListJadwalByGuruQuery } from "@/api/akademik";
import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function GuruJadwalPage() {
  const user = useAppSelector((s) => s.auth.user);
  const {
    data: schedules,
    isLoading,
    error,
  } = useListJadwalByGuruQuery(user?.user_id || "", { skip: !user?.user_id });

  if (isLoading)
    return <div className="p-8 text-center">Memuat jadwal mengajar...</div>;
  if (error)
    return (
      <div className="p-8 text-destructive text-center">
        Gagal memuat jadwal.
      </div>
    );

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Jadwal Mengajar
        </h1>
        <p className="text-slate-500">
          Agenda mengajar mingguan Anda untuk semester berjalan.
        </p>
      </div>

      <div className="grid gap-8">
        {DAYS.map((day) => {
          const daySchedules = schedules?.filter((s) => s.hari === day) || [];
          if (daySchedules.length === 0) return null;

          return (
            <Card
              key={day}
              className="border-slate-200 shadow-sm overflow-hidden"
            >
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg font-bold text-slate-800">
                    {day}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="bg-white">
                  {daySchedules.length} Jam Pelajaran
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                      <TableHead className="w-[150px] font-semibold text-slate-700">
                        Waktu
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Mata Pelajaran
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Kelas
                      </TableHead>
                      <TableHead className="w-[150px] font-semibold text-slate-700">
                        Ruangan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daySchedules.map((item) => (
                      <TableRow
                        key={item.jadwal_id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.jam_mulai} - {item.jam_selesai}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900">
                            {item.mapel?.nama_mapel || item.mapel_id}
                          </div>
                          <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                            {item.mapel?.kode_mapel}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">
                              {item.nama_kelas}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.ruangan ? (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3.5 h-3.5" />
                              {item.ruangan}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        {(!schedules || schedules.length === 0) && (
          <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              Anda belum memiliki jadwal mengajar.
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Hubungi admin untuk penugasan mata pelajaran.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
