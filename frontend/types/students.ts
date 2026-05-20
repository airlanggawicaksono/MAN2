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
  no_telephone_wali: string | null;
  kelas_jurusan: string | null;
  kelas_nama?: string | null;
  tahun_masuk: number | null;
  status_siswa: StatusSiswa;
  semester_aktif_tipe?: string | null;
  semester_ke?: number | null;
  kontak: string | null;
  kewarganegaraan: string;
  rfid_number: string | null;
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
  no_telephone_wali?: string;
  kelas_jurusan?: string;
  tahun_masuk?: number;
  status_siswa?: StatusSiswa;
  kontak?: string;
  kewarganegaraan?: string;
  // rfid_number is intentionally NOT editable here. Card mutations must go
  // through the dedicated card endpoint so the BE can enqueue a Hikvision
  // sync job for the desktop worker.
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
  status_siswa?: import("./enums").StatusSiswa;
}

export interface CreateStudentRequest {
  nisn?: string;
  nama_lengkap: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nama_wali?: string;
  no_telephone_wali?: string;
  kelas_jurusan?: string;
  tahun_masuk?: number;
  status_siswa?: StatusSiswa;
  kontak?: string;
  kewarganegaraan?: string;
  // Optional. BE fans out to the canonical set_student_card path post-insert,
  // which enqueues a hik.card.sync DeviceJob.
  rfid_number?: string;
}

export interface CardSetRequest {
  rfid_number: string | null;
}

export interface CardSetResponse {
  user_id: string;
  old_rfid_number: string | null;
  new_rfid_number: string | null;
  job_id: string;
}

export interface BulkImportResultItem {
  row: number;
  nama_lengkap: string;
  nisn?: string;
  status: "created" | "filled" | "skipped" | "error";
  detail?: string;
}

export interface BulkImportResult {
  created: number;
  filled: number;
  skipped: number;
  errors: number;
  items: BulkImportResultItem[];
}
