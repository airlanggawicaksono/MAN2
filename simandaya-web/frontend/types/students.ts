import type { JenisKelamin, StatusSiswa } from "./enums";

export interface StudentProfile {
  siswa_id: string;
  user_id: string;
  nisn: string | null;
  nama_lengkap: string;
  dob: string | null;
  tempat_lahir: string | null;
  jenis_kelamin: JenisKelamin | null;
  alamat: string | null;
  nama_wali: string | null;
  kelas_jurusan: string | null;
  kelas_nama?: string | null;
  tahun_masuk: number | null;
  status_siswa: StatusSiswa;
  semester_aktif_tipe?: string | null;
  semester_ke?: number | null;
  kontak: string | null;
  kewarganegaraan: string;
  card_no: string | null;
  is_active: boolean;
}

export interface PreRegisterStudentRequest {
  nisn: string;
  nama_lengkap: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nama_wali?: string;
  kelas_jurusan?: string;
  tahun_masuk?: number;
  kontak?: string;
  kewarganegaraan?: string;
}

export interface PreRegisterResponse {
  message: string;
}

export interface UpdateStudentRequest {
  nisn?: string;
  nama_lengkap?: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nama_wali?: string;
  kelas_jurusan?: string;
  tahun_masuk?: number;
  status_siswa?: StatusSiswa;
  kontak?: string;
  kewarganegaraan?: string;
  card_no?: string;
}

export interface PaginatedStudentsResponse {
  items: StudentProfile[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListStudentsParams {
  skip: number;
  limit: number;
  search?: string;
}

export interface CreateStudentRequest {
  nisn?: string;
  nama_lengkap: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nama_wali?: string;
  kelas_jurusan?: string;
  tahun_masuk?: number;
  status_siswa?: StatusSiswa;
  kontak?: string;
  kewarganegaraan?: string;
  card_no?: string;
}

export interface BulkImportResultItem {
  row: number;
  nama_lengkap: string;
  nisn?: string;
  status: "created" | "skipped" | "error";
  detail?: string;
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: number;
  items: BulkImportResultItem[];
}
