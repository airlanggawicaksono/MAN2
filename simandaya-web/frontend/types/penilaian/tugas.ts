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
  kelas_nama?: string;
  mapel_nama?: string;
  guru_pengajar?: string;
  link_tugas?: string;
  link_submission?: string;
  is_archived_context: boolean;
  is_published_to_students: boolean;
  is_nilai_published_to_students: boolean;
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
  link_submission?: string;
  is_published_to_students?: boolean;
  is_nilai_published_to_students?: boolean;
  deadline?: string;
}

export interface UpdateTugasRequest {
  judul?: string;
  deskripsi?: string;
  link_tugas?: string;
  link_submission?: string;
  is_published_to_students?: boolean;
  is_nilai_published_to_students?: boolean;
  deadline?: string;
}

export interface TugasSubmissionResponse {
  submission_id: UUID;
  tugas_id: UUID;
  user_id: UUID;
  student_name?: string;
  student_nis?: string;
  submission_link?: string;
  jawaban_text?: string;
  is_late: boolean;
  submitted_at: string;
  updated_at: string;
}

export interface CreateTugasSubmissionRequest {
  submission_link?: string;
  jawaban_text?: string;
}

export interface UpdateTugasSubmissionRequest {
  submission_link?: string;
  jawaban_text?: string;
}
