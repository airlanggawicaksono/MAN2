import { UUID } from "../common";
import { MapelResponse } from "./mapel";

export interface JadwalResponse {
  jadwal_id: UUID;
  kelas_id: UUID;
  mapel_id: UUID;
  guru_user_id?: UUID;
  guru_id?: UUID;
  semester_id: UUID;
  hari: string;
  slot_waktu_id?: UUID;
  is_active?: boolean;
  jam_mulai?: string;
  jam_selesai?: string;
  mapel?: MapelResponse;
  mapel_nama?: string;
  guru_nama?: string;
  nama_kelas?: string;
  resolved_mapel_nama?: string;
  resolved_guru_nama?: string;
  resolved_nama_kelas?: string;
  resolved_jam_mulai?: string;
  resolved_jam_selesai?: string;
}

export interface CreateJadwalRequest {
  kelas_id: UUID;
  mapel_id: UUID;
  guru_user_id: UUID;
  semester_id: UUID;
  hari: string;
  slot_waktu_id: UUID;
}

export interface UpdateJadwalRequest {
  kelas_id?: UUID;
  mapel_id?: UUID;
  guru_user_id?: UUID;
  semester_id?: UUID;
  hari?: string;
  slot_waktu_id?: UUID;
}

export interface GuruMapelResponse {
  guru_mapel_id: UUID;
  user_id: UUID;
  mapel_id: UUID;
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
  is_active?: boolean;
  guru_nama?: string;
  mapel_nama?: string;
  kelas_nama?: string;
}

export interface CreateGuruMapelRequest {
  user_id: UUID;
  mapel_id: UUID;
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
}

export interface UpdateGuruMapelRequest {
  user_id?: UUID;
  mapel_id?: UUID;
  kelas_id?: UUID;
}

export interface GuruAcademicContextTahunAjaran {
  tahun_ajaran_id: UUID;
  nama: string;
  is_active: boolean;
}

export interface GuruAcademicContextSemester {
  semester_id: UUID;
  tahun_ajaran_id: UUID;
  tipe: string;
  is_active: boolean;
}

export interface GuruAcademicContextKelas {
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
  nama_kelas: string;
}

export interface GuruAcademicContextResponse {
  assignments: GuruMapelResponse[];
  tahun_ajaran: GuruAcademicContextTahunAjaran[];
  semesters: GuruAcademicContextSemester[];
  kelas: GuruAcademicContextKelas[];
}
