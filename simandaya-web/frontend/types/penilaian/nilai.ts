import { UUID } from "../common";

export interface NilaiResponse {
  nilai_id: UUID;
  tugas_id: UUID;
  user_id: UUID;
  nilai: number;
  catatan?: string;
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
