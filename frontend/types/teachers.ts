import type {
  JenisKelamin,
  StatusGuru,
} from "./enums";
import type { GuruStructuralAssignment } from "./structural";

export interface GuruProfile {
  guru_id: string;
  user_id: string;
  nip: string | null;
  nama_lengkap: string;
  dob: string | null;
  tempat_lahir: string | null;
  jenis_kelamin: JenisKelamin | null;
  alamat: string | null;
  nik: string | null;
  tahun_masuk: number | null;
  status_guru: StatusGuru;
  kontak: string | null;
  kewarganegaraan: string;
  structural_assignments: GuruStructuralAssignment[];
  mata_pelajaran: string | null;
  pendidikan_terakhir: string | null;
  is_active: boolean;
}

export interface PreRegisterTeacherRequest {
  nip: string;
  nama_lengkap: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nik?: string;
  tahun_masuk?: number;
  kontak?: string;
  kewarganegaraan?: string;
  mata_pelajaran?: string | null;
  pendidikan_terakhir?: string | null;
}

export interface PreRegisterResponse {
  message: string;
}

export interface UpdateGuruRequest {
  nip?: string;
  nama_lengkap?: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nik?: string;
  tahun_masuk?: number;
  status_guru?: StatusGuru;
  kontak?: string;
  kewarganegaraan?: string;
  mata_pelajaran?: string | null;
  pendidikan_terakhir?: string | null;
}

export interface PaginatedTeachersResponse {
  items: GuruProfile[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListTeachersParams {
  skip: number;
  limit: number;
  search?: string;
}

export interface CreateGuruRequest {
  nip?: string;
  nama_lengkap: string;
  dob?: string;
  tempat_lahir?: string;
  jenis_kelamin?: JenisKelamin;
  alamat?: string;
  nik?: string;
  tahun_masuk?: number;
  status_guru?: StatusGuru;
  kontak?: string;
  kewarganegaraan?: string;
  mata_pelajaran?: string | null;
  pendidikan_terakhir?: string | null;
}

export interface BulkImportGuruResultItem {
  row: number;
  nama_lengkap: string;
  nip?: string;
  status: "created" | "skipped" | "error";
  detail?: string;
}

export interface BulkImportGuruResult {
  created: number;
  skipped: number;
  errors: number;
  items: BulkImportGuruResultItem[];
}
