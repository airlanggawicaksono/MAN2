import { UUID } from "../common";

export interface TugasResponse {
  tugas_id: UUID;
  semester_id: UUID;
  kelas_id: UUID;
  mapel_id: UUID;
  created_by?: UUID;
  jenis: string;
  judul: string;
  deskripsi?: string;
  link_tugas?: string;
  deadline?: string;
  created_at: string;
}

export interface CreateTugasRequest {
  semester_id: UUID;
  kelas_id: UUID;
  mapel_id: UUID;
  jenis: string;
  judul: string;
  deskripsi?: string;
  link_tugas?: string;
  deadline?: string;
}

export interface UpdateTugasRequest {
  judul?: string;
  deskripsi?: string;
  link_tugas?: string;
  deadline?: string;
}
