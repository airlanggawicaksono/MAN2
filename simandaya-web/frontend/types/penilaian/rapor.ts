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
  nilai_sumber: number;
  nilai_override?: number;
  is_manual_override: boolean;
  catatan?: string;
  komponen_nilai: {
    jenis_tugas: string;
    nilai_rata: number;
    jumlah_tugas: number;
  }[];
  rincian_tugas: {
    tugas_id: UUID;
    judul_tugas: string;
    jenis_tugas: string;
    nilai?: number;
  }[];
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
  rapor_id?: UUID;
  user_id: UUID;
  username: string;
  nama_lengkap: string;
  is_published: boolean;
  published_at?: string;
}

export interface UpdateRaporRequest {
  catatan_wali_kelas?: string;
}

export interface OverrideNilaiRequest {
  nilai_akhir: number;
  catatan?: string;
}

export interface SaveRaporNilaiEditorRequest {
  rapor_nilai_id?: UUID;
  mapel_id: UUID;
  nilai_override?: number | null;
  catatan?: string | null;
}

export interface SaveRaporEditorRequest {
  catatan_wali_kelas?: string | null;
  entries: SaveRaporNilaiEditorRequest[];
}

export interface RaporEditorResponse {
  rapor_id: UUID;
  user_id: UUID;
  username: string;
  nama_lengkap: string;
  semester_id: UUID;
  kelas_id: UUID;
  catatan_wali_kelas?: string;
  is_published: boolean;
  published_at?: string;
  grades: RaporNilaiResponse[];
  attendance_summary: AttendanceSummary;
}

export interface GuruRaporContextTahunAjaran {
  tahun_ajaran_id: UUID;
  nama: string;
  is_active: boolean;
}

export interface GuruRaporContextSemester {
  semester_id: UUID;
  tahun_ajaran_id: UUID;
  tipe: string;
  is_active: boolean;
}

export interface GuruRaporContextKelas {
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
  nama_kelas: string;
  wali_kelas_id?: UUID;
}

export interface GuruRaporContextResponse {
  tahun_ajaran: GuruRaporContextTahunAjaran[];
  semesters: GuruRaporContextSemester[];
  kelas: GuruRaporContextKelas[];
}
