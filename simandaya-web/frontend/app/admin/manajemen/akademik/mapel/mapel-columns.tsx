"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
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
  {
    accessorKey: "jam_per_minggu",
    header: "Jam/Minggu",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue("jam_per_minggu")}
      </Badge>
    ),
  },
];
