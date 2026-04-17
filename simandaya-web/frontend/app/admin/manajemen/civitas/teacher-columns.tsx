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
    id: "jabatan",
    header: "Jabatan Struktural",
    cell: ({ row }) => {
      const activeRoles = row.original.structural_assignments
        .filter((assignment) => assignment.is_active)
        .map((assignment) => assignment.structural_role ?? assignment.role_name)
        .filter((role): role is string => Boolean(role));
      return activeRoles.length > 0 ? activeRoles.join(", ") : "-";
    },
  },
  {
    accessorKey: "mata_pelajaran",
    header: "Jabatan Fungsional",
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
