import type { UUID } from "../common";
import type { RaporResponse } from "./rapor";

export interface SiswaOverviewTaskDetail {
  tugas_id: UUID;
  judul_tugas: string;
  jenis_tugas: string;
  nilai?: number | null;
  nilai_disembunyikan: boolean;
  catatan?: string | null;
  deadline?: string | null;
  link_tugas?: string | null;
  link_submission?: string | null;
}

export interface SiswaOverviewMapel {
  mapel_id: UUID;
  mapel_nama: string;
  nilai_akhir: number;
  nilai_sumber: number;
  nilai_override?: number | null;
  is_manual_override: boolean;
  catatan?: string | null;
  komponen_nilai: Array<{
    jenis_tugas: string;
    nilai_rata: number;
    jumlah_tugas: number;
  }>;
  tugas_details: SiswaOverviewTaskDetail[];
}

export interface SiswaOverviewTugasItem {
  tugas_id: UUID;
  semester_id: UUID;
  kelas_id: UUID;
  mapel_id: UUID;
  mapel_nama?: string | null;
  guru_pengajar?: string | null;
  jenis: string;
  judul: string;
  deskripsi?: string | null;
  deadline?: string | null;
  created_at: string;
  link_tugas?: string | null;
  link_submission?: string | null;
  is_submitted: boolean;
  submitted_at?: string | null;
  is_late_submission: boolean;
}

export interface SiswaOverviewResponse {
  semester_id: UUID;
  semester_ke?: number | null;
  kelas_id: UUID;
  rapor_published: boolean;
  rapor?: RaporResponse | null;
  nilai_mapel: SiswaOverviewMapel[];
  tugas_list: SiswaOverviewTugasItem[];
}
