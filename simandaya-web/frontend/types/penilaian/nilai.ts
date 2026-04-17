import { UUID } from "../common";

export interface NilaiResponse {
  nilai_id: UUID;
  tugas_id: UUID;
  user_id: UUID;
  nilai: number;
  is_nilai_published_to_students: boolean;
  catatan?: string;
  mapel_id?: UUID;
  mapel_nama?: string;
  tugas_judul?: string;
  tugas_jenis?: string;
}

export interface NilaiByMapelResponse {
  mapel_id: UUID;
  mapel_nama: string;
  scores: NilaiResponse[];
  average: number;
}

export interface CreateNilaiRequest {
  user_id: UUID;
  nilai: number;
  catatan?: string;
}

export interface BulkCreateNilaiRequest {
  entries: CreateNilaiRequest[];
}

export interface BulkNilaiResponse {
  created_count: number;
  updated_count: number;
  message: string;
}

export interface UpdateNilaiRequest {
  nilai?: number;
  catatan?: string;
}
