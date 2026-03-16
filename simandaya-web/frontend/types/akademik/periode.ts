import { UUID } from "../common";

export interface TahunAjaranResponse {
  tahun_ajaran_id: UUID;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active: boolean;
}

export interface CreateTahunAjaranRequest {
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active?: boolean;
}

export interface UpdateTahunAjaranRequest {
  nama?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  is_active?: boolean;
}

export interface SemesterResponse {
  semester_id: UUID;
  tahun_ajaran_id: UUID;
  tipe: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active: boolean;
}

export interface CreateSemesterRequest {
  tahun_ajaran_id: UUID;
  tipe: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active?: boolean;
}

export interface UpdateSemesterRequest {
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  is_active?: boolean;
}
