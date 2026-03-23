import { UUID } from "../common";

export interface KurikulumMapelResponse {
  kurikulum_mapel_id: UUID;
  mapel_id: UUID;
  tahun_ajaran_id: UUID;
  tingkat: string; // "X" | "XI" | "XII"
  kategori_kelas_id: UUID;
  kategori_kelas_nama?: string;
  is_wajib: boolean;
  jam_override?: number | null;
  mapel_nama?: string;
  kode_mapel?: string;
  kelompok?: string;
}

export interface CreateKurikulumMapelRequest {
  mapel_id: UUID;
  tahun_ajaran_id: UUID;
  tingkat: string;
  kategori_kelas_id: UUID;
  is_wajib?: boolean;
  jam_override?: number | null;
}

export interface BulkAssignKurikulumMapelRequest {
  tahun_ajaran_id: UUID;
  tingkat: string;
  kategori_kelas_id: UUID;
  mapel_ids: UUID[];
  is_wajib?: boolean;
}

export interface UpdateKurikulumMapelRequest {
  is_wajib?: boolean;
  jam_override?: number | null;
}
