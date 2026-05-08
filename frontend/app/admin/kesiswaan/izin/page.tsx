"use client";

import React, { useState } from "react";
import { useListPublicIzinKeluarQuery } from "@/api/public/absensi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateInputId } from "@/components/ui/date-input-id";
import { formatIsoToIdDate } from "@/lib/date-id";
import { Search, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";
import { TableBodyRowSkeleton } from "@/app/components/skeletons";

export default function AdminIzinKesiswaanPage() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const { data: izins, isLoading } = useListPublicIzinKeluarQuery({
    tanggal,
    search: debouncedSearch || undefined,
  });

  return (
    <AdminPageShell
      eyebrow="Kesiswaan"
      title="Log Izin Keluar"
      description="Monitor catatan izin keluar siswa."
      actions={
        <div className="flex flex-col items-stretch gap-3 sm:flex-row">
          <DateInputId className="w-full sm:w-[200px]" value={tanggal} onValueChange={setTanggal} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa..."
              className="w-full pl-10 sm:w-[300px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      }
    >
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Riwayat Izin</CardTitle>
              <CardDescription>Menampilkan data untuk tanggal {formatIsoToIdDate(tanggal)}</CardDescription>
            </div>
            <Badge variant="secondary">{izins?.length || 0} Data</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/35">
              <TableRow>
                <TableHead>Waktu Keluar</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-center">Perkiraan Kembali</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableBodyRowSkeleton rows={5} cols={5} />
              ) : !izins || izins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-sm italic text-muted-foreground">
                    Tidak ada data izin keluar untuk tanggal ini.
                  </TableCell>
                </TableRow>
              ) : (
                izins.map((izin) => (
                  <TableRow key={izin.izin_id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(izin.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{izin.nama_siswa}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{izin.kelas || "-"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{izin.keterangan}</TableCell>
                    <TableCell className="text-center">
                      {izin.perkiraan_kembali ? (
                        <Badge variant="secondary">
                          {new Date(izin.perkiraan_kembali).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
