import { UUID } from "../common";

export interface AttendanceSummary {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  terlambat: number;
}

export interface RaporNilaiResponse {
  rapor_nilai_id: UUID;
  rapor_id: UUID;
  mapel_id: UUID;
  mapel_nama: string;
  nilai_akhir: number;
  is_manual_override: boolean;
  catatan?: string;
}

export interface RaporResponse {
  rapor_id: UUID;
  user_id: UUID;
  semester_id: UUID;
  kelas_id: UUID;
  catatan_wali_kelas?: string;
  is_published: boolean;
  published_at?: string;
  grades: RaporNilaiResponse[];
  attendance_summary: AttendanceSummary;
}

export interface RaporListItem {
  rapor_id: UUID;
  user_id: UUID;
  username: string;
  nama_lengkap: string;
  is_published: boolean;
  published_at?: string;
}

export interface GenerateRaporRequest {
  kelas_id: UUID;
  semester_id: UUID;
}

export interface GenerateRaporResponse {
  message: string;
  rapor_generated: number;
  rapor_skipped: number;
}

export interface UpdateRaporRequest {
  catatan_wali_kelas?: string;
}

export interface OverrideNilaiRequest {
  nilai_akhir: number;
  catatan?: string;
}
