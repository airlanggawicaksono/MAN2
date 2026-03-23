"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { MapelResponse } from "@/types/akademik/mapel";

export const mapelColumns: ColumnDef<MapelResponse>[] = [
  {
    accessorKey: "kode_mapel",
    header: "Kode",
  },
  {
    accessorKey: "nama_mapel",
    header: "Nama Mata Pelajaran",
  },
  {
    accessorKey: "kelompok",
    header: "Kelompok",
    cell: ({ row }) => String(row.getValue("kelompok") || "-"),
  },
];
