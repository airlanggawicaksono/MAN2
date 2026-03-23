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

export interface CopyTahunAjaranStructureRequest {
  source_tahun_ajaran_id: UUID;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active?: boolean;
  copy_semester?: boolean;
  copy_kelas?: boolean;
  copy_guru_mapel?: boolean;
  copy_kurikulum?: boolean;
}

export interface CopyTahunAjaranStructureResponse {
  tahun_ajaran: TahunAjaranResponse;
  copied_semester: number;
  copied_kelas: number;
  copied_guru_mapel: number;
  copied_kurikulum: number;
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

export interface CopySemesterStructureRequest {
  source_semester_id: UUID;
  tipe: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active?: boolean;
}

export interface CopySemesterStructureResponse {
  semester: SemesterResponse;
  copied_jadwal: number;
  copied_rapor_bobot: number;
}
