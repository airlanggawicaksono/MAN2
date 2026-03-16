"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { JadwalResponse } from "@/types/akademik/jadwal";

export const jadwalColumns: ColumnDef<JadwalResponse>[] = [
  {
    accessorKey: "hari",
    header: "Hari",
  },
  {
    id: "waktu",
    header: "Waktu",
    cell: ({ row }) => {
      const j = row.original;
      return `${j.jam_mulai} - ${j.jam_selesai}`;
    },
  },
  {
    accessorKey: "mapel_nama",
    header: "Mata Pelajaran",
    cell: ({ row }) => row.original.mapel?.nama_mapel || row.original.mapel_id,
  },
  {
    accessorKey: "guru_nama",
    header: "Guru",
  },
  {
    accessorKey: "nama_kelas",
    header: "Kelas",
  },
  {
    accessorKey: "ruangan",
    header: "Ruangan",
    cell: ({ row }) => row.getValue("ruangan") || "-",
  },
];
