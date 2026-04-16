import { UUID } from "../common";

export interface KategoriKelasResponse {
  kategori_kelas_id: UUID;
  tahun_ajaran_id: UUID;
  kode: string;
  nama: string;
  is_active: boolean;
}

export interface KategoriKelasArchiveImpact {
  kategori_kelas_id: UUID;
  kelas_count: number;
  kurikulum_count: number;
}

export interface CreateKategoriKelasRequest {
  tahun_ajaran_id?: UUID;
  kode: string;
  nama: string;
  is_active?: boolean;
}

export interface UpdateKategoriKelasRequest {
  kode?: string;
  nama?: string;
  is_active?: boolean;
}
