"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile } from "@/types/students";

export const studentColumns: ColumnDef<StudentProfile>[] = [
  {
    accessorKey: "nisn",
    header: "NISN",
  },
  {
    accessorKey: "nama_lengkap",
    header: "Nama",
  },
  {
    accessorKey: "kelas_nama",
    header: "Kelas/Jurusan",
    cell: ({ row }) => row.original.kelas_nama || row.original.kelas_jurusan || "-",
  },
  {
    accessorKey: "tahun_masuk",
    header: "Tahun Masuk",
  },
  {
    accessorKey: "status_siswa",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status_siswa") as string;
      const variant =
        status === "Aktif"
          ? "default"
          : status === "Lulus"
            ? "secondary"
            : "destructive";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "is_active",
    header: "Status Akun",
    cell: ({ row }) => {
      const active = row.getValue("is_active") as boolean;
      return (
        <Badge variant={active ? "default" : "outline"}>
          {active ? "Terdaftar" : "Belum Daftar"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "kontak",
    header: "Kontak",
  },
];
