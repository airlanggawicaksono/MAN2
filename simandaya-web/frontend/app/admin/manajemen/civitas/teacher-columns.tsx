"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { GuruProfile } from "@/types/teachers";

export const teacherColumns: ColumnDef<GuruProfile>[] = [
  {
    accessorKey: "nip",
    header: "NIP",
  },
  {
    accessorKey: "nama_lengkap",
    header: "Nama",
  },
  {
    accessorKey: "structural_role",
    header: "Jabatan",
    cell: ({ row }) => {
      return row.getValue("structural_role") as string;
    },
  },
  {
    accessorKey: "mata_pelajaran",
    header: "Mata Pelajaran",
    cell: ({ row }) => row.getValue("mata_pelajaran") || "-",
  },
  {
    accessorKey: "tahun_masuk",
    header: "Tahun Masuk",
  },
  {
    accessorKey: "status_guru",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status_guru") as string;
      const variant = status === "Aktif" ? "default" : "destructive";
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
