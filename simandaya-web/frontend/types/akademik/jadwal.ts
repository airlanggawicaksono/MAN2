import { UUID } from "../common";
import { MapelResponse } from "./mapel";

export interface JadwalResponse {
  jadwal_id: UUID;
  kelas_id: UUID;
  mapel_id: UUID;
  guru_id: UUID;
  semester_id: UUID;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  mapel?: MapelResponse;
  guru_nama?: string;
  nama_kelas?: string;
}

export interface CreateJadwalRequest {
  kelas_id: UUID;
  mapel_id: UUID;
  guru_id: UUID;
  semester_id: UUID;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
}

export interface UpdateJadwalRequest {
  kelas_id?: UUID;
  mapel_id?: UUID;
  guru_id?: UUID;
  semester_id?: UUID;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  ruangan?: string;
}

export interface GuruMapelResponse {
  guru_mapel_id: UUID;
  user_id: UUID;
  mapel_id: UUID;
  kelas_id: UUID;
  tahun_ajaran_id: UUID;
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
