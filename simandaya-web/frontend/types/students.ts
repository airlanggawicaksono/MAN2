import type { JenisKelamin, StatusSiswa } from "./enums";

export interface StudentProfile {
  siswa_id: string;
  user_id: string;
  nis: string | null;
  nama_lengkap: string;
  dob: string | null;
  tempat_lahir: string | null;
  jenis_kelamin: JenisKelamin | null;
  alamat: string | null;
  nama_wali: string | null;
  kelas_jurusan: string | null;
  tahun_masuk: number | null;
  status_siswa: StatusSiswa;
  kontak: string | null;
  kewarganegaraan: string;
  is_active: boolean;
}

export interface PreRegisterStudentRequest {
  nis: string;
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
  nis?: string;
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
