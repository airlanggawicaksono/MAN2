"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAbsensiDate,
  shiftAbsensiDate,
  setAbsensiSearch,
  setIzinKeluarDate,
  shiftIzinKeluarDate,
  setIzinKeluarSearch,
  todayStr,
} from "@/store/slices/absensi";
import {
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
} from "@/api/absensi";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  hadir: "default",
  terlambat: "outline",
  alfa: "destructive",
  sakit: "secondary",
  izin: "secondary",
};

function formatTime(dtStr: string | null) {
  if (!dtStr) return "-";
  return new Date(dtStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DateNav({
  date,
  onDateChange,
  onShift,
}: {
  date: string;
  onDateChange: (d: string) => void;
  onShift: (delta: number) => void;
}) {
  if (!date) return <div className="h-10 w-[240px]" />; // Skeleton/spacer

  const selected = new Date(date + "T00:00:00");

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => onShift(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[150px] justify-start text-left text-sm font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selected, "d MMM yyyy", { locale: localeId })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) onDateChange(format(d, "yyyy-MM-dd"));
            }}
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={() => onShift(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AbsensiPage() {
  const dispatch = useAppDispatch();
  const {
    absensiDate,
    absensiSearch,
    izinKeluarDate,
    izinKeluarSearch,
  } = useAppSelector((s) => s.absensi);

  useEffect(() => {
    if (!absensiDate) dispatch(setAbsensiDate(todayStr()));
    if (!izinKeluarDate) dispatch(setIzinKeluarDate(todayStr()));
  }, [dispatch, absensiDate, izinKeluarDate]);

  const debouncedAbsensiSearch = useDebounce(absensiSearch, 400);
  const debouncedIzinSearch = useDebounce(izinKeluarSearch, 400);

  const {
    data: attendance = [],
    isFetching: fetchingAtt,
  } = useListPublicAttendanceQuery(
    {
      tanggal: absensiDate,
      search: debouncedAbsensiSearch || undefined,
    },
    { skip: !absensiDate },
  );

  const {
    data: izinKeluar = [],
    isFetching: fetchingIzin,
  } = useListPublicIzinKeluarQuery(
    {
      tanggal: izinKeluarDate,
      search: debouncedIzinSearch || undefined,
    },
    { skip: !izinKeluarDate },
  );

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold mb-1">Absensi</h1>
      <p className="text-muted-foreground mb-6">
        Informasi absensi dan izin keluar siswa
      </p>

      {/* Stacked on mobile, side by side on desktop */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Absensi */}
        <Card className="flex flex-col lg:flex-1 min-w-0">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">Data Absensi</CardTitle>
              <DateNav
                date={absensiDate}
                onDateChange={(d) => dispatch(setAbsensiDate(d))}
                onShift={(n) => dispatch(shiftAbsensiDate(n))}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa..."
                value={absensiSearch}
                onChange={(e) => dispatch(setAbsensiSearch(e.target.value))}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-[400px] overflow-y-auto">
              {fetchingAtt ? (
                <p className="text-center text-muted-foreground py-8">
                  Memuat...
                </p>
              ) : attendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {debouncedAbsensiSearch
                    ? "Tidak ada hasil."
                    : "Tidak ada data absensi untuk tanggal ini."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Masuk</TableHead>
                      <TableHead>Keluar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((row) => (
                      <TableRow key={row.absensi_id}>
                        <TableCell className="font-medium">
                          {row.nama_siswa}
                        </TableCell>
                        <TableCell>{row.kelas ?? "-"}</TableCell>
                        <TableCell>{formatTime(row.time_in)}</TableCell>
                        <TableCell>{formatTime(row.time_out)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_VARIANT[row.status] ?? "secondary"}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Izin Keluar */}
        <Card className="flex flex-col lg:flex-1 min-w-0">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">Izin Keluar</CardTitle>
              <DateNav
                date={izinKeluarDate}
                onDateChange={(d) => dispatch(setIzinKeluarDate(d))}
                onShift={(n) => dispatch(shiftIzinKeluarDate(n))}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa..."
                value={izinKeluarSearch}
                onChange={(e) => dispatch(setIzinKeluarSearch(e.target.value))}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-[400px] overflow-y-auto">
              {fetchingIzin ? (
                <p className="text-center text-muted-foreground py-8">
                  Memuat...
                </p>
              ) : izinKeluar.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {debouncedIzinSearch
                    ? "Tidak ada hasil."
                    : "Tidak ada data izin keluar untuk tanggal ini."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Kembali</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {izinKeluar.map((row) => (
                      <TableRow key={row.izin_id}>
                        <TableCell className="font-medium">
                          {row.nama_siswa}
                        </TableCell>
                        <TableCell>{row.kelas ?? "-"}</TableCell>
                        <TableCell>{formatTime(row.created_at)}</TableCell>
                        <TableCell>{row.keterangan}</TableCell>
                        <TableCell>
                          {row.waktu_kembali ? (
                            formatTime(row.waktu_kembali)
                          ) : (
                            <Badge variant="outline">Belum</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
