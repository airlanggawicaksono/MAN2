import { UUID } from "../common";

export interface KonsentrasiResponse {
  konsentrasi_id: UUID;
  tahun_ajaran_id: UUID;
  tingkat: string;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  is_active: boolean;
  total_mapel: number;
  total_kelas: number;
}

export interface CreateKonsentrasiRequest {
  tahun_ajaran_id: UUID;
  tingkat: string;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  is_active?: boolean;
}

export interface UpdateKonsentrasiRequest {
  tingkat?: string;
  kode?: string;
  nama?: string;
  deskripsi?: string | null;
  is_active?: boolean;
}

export interface KonsentrasiMapelResponse {
  konsentrasi_mapel_id: UUID;
  konsentrasi_id: UUID;
  mapel_id: UUID;
  is_wajib: boolean;
  mapel_nama?: string | null;
  kode_mapel?: string | null;
  kelompok?: string | null;
}

export interface AssignKonsentrasiMapelRequest {
  mapel_id: UUID;
  is_wajib?: boolean;
}

export interface KelasKonsentrasiResponse {
  kelas_konsentrasi_id: UUID;
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
  konsentrasi_id: UUID;
  konsentrasi_nama?: string | null;
  kelas_nama?: string | null;
  tingkat?: string | null;
}

export interface AssignKelasKonsentrasiRequest {
  kelas_id: UUID;
}
