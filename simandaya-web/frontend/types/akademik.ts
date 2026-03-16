import { UUID } from "./common";

export interface Mapel {
  mapel_id: UUID;
  nama_mapel: string;
  kode_mapel: string;
  kelompok?: string;
  kkm: number;
}

export interface CreateMapelRequest {
  nama_mapel: string;
  kode_mapel: string;
  kelompok?: string;
  kkm: number;
}

export interface UpdateMapelRequest {
  nama_mapel?: string;
  kode_mapel?: string;
  kelompok?: string;
  kkm?: number;
}

export interface Kelas {
  kelas_id: UUID;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  tahun_ajaran_id: UUID;
  wali_kelas_id?: UUID;
}

export interface CreateKelasRequest {
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  tahun_ajaran_id: UUID;
  wali_kelas_id?: UUID;
}

export interface UpdateKelasRequest {
  nama_kelas?: string;
  tingkat?: number;
  jurusan?: string;
  tahun_ajaran_id?: UUID;
  wali_kelas_id?: UUID;
}

export interface Jadwal {
  jadwal_id: UUID;
  kelas_id: UUID;
  mapel_id: UUID;
  guru_id: UUID;
  semester_id: UUID;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  mapel?: Mapel;
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

export interface TahunAjaran {
  tahun_ajaran_id: UUID;
  tahun: string;
  is_active: boolean;
}

export interface Semester {
  semester_id: UUID;
  tahun_ajaran_id: UUID;
  nama_semester: string;
  is_active: boolean;
}
