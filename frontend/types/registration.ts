import type { JenisKelamin } from "./enums";

export interface StudentLookupResponse {
  siswa_id: string;
  nis: string;
  nama_lengkap: string;
  kelas_jurusan: string | null;
  jenis_kelamin: JenisKelamin | null;
}

export interface TeacherLookupResponse {
  guru_id: string;
  nip: string;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin | null;
}

export interface ClaimStudentRequest {
  nis: string;
  username: string;
  password: string;
}

export interface ClaimTeacherRequest {
  nip: string;
  username: string;
  password: string;
}

export interface ClaimResponse {
  message: string;
  username: string;
  user_type: string;
}
