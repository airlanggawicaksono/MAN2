import type { StructuralRole } from "./enums";

export interface PublicCivitasResponse {
  nama: string;
  nip: string;
  nik: string;
  jabatan_struktural: StructuralRole;
  matapelajaran?: string;
  kontak?: string;
}

export interface PaginatedPublicCivitasResponse {
  items: PublicCivitasResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListPublicCivitasParams {
  skip?: number;
  limit?: number;
  search?: string;
}
