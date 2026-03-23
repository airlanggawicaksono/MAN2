import { UUID } from "../common";

export interface KategoriKelasResponse {
  kategori_kelas_id: UUID;
  kode: string;
  nama: string;
  is_active: boolean;
}

export interface CreateKategoriKelasRequest {
  kode: string;
  nama: string;
  is_active?: boolean;
}

export interface UpdateKategoriKelasRequest {
  kode?: string;
  nama?: string;
  is_active?: boolean;
}
