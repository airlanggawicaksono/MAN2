import { UUID } from "../common";

export interface KelasResponse {
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
  nama_kelas: string;
  tingkat: string;
  kategori_kelas_id: UUID;
  kategori_kelas_nama?: string;
  jurusan?: string;
  wali_kelas_id?: UUID;
  wali_kelas_nama?: string;
  kapasitas: number;
}

export interface CreateKelasRequest {
  tahun_ajaran_id: UUID;
  nama_kelas: string;
  tingkat: string;
  kategori_kelas_id: UUID;
  wali_kelas_id?: UUID;
  kapasitas?: number;
}

export interface UpdateKelasRequest {
  nama_kelas?: string;
  tingkat?: string;
  kategori_kelas_id?: UUID;
  wali_kelas_id?: UUID | null;
  kapasitas?: number;
}

export interface AssignSiswaRequest {
  user_id: UUID;
}

export interface SiswaKelasResponse {
  siswa_kelas_id: UUID;
  kelas_id: UUID;
  user_id: UUID;
  nama_lengkap?: string;
  nis?: string;
}

export interface PromoteStudentsResponse {
  promoted: number;
  graduated: number;
  skipped: number;
  message: string;
}
