import { UUID } from "../common";

export interface MapelResponse {
  mapel_id: UUID;
  tahun_ajaran_id: UUID;
  kode_mapel: string;
  nama_mapel: string;
  kelompok: string;
  is_active: boolean;
}

export interface MapelArchiveImpact {
  mapel_id: UUID;
  kurikulum_count: number;
  guru_mapel_count: number;
  jadwal_count: number;
  tugas_count: number;
  rapor_nilai_count: number;
  rapor_bobot_count: number;
}

export interface CreateMapelRequest {
  tahun_ajaran_id?: UUID;
  kode_mapel: string;
  nama_mapel: string;
  kelompok: string;
  is_active?: boolean;
}

export interface UpdateMapelRequest {
  kode_mapel?: string;
  nama_mapel?: string;
  kelompok?: string;
  is_active?: boolean;
}
