export interface AbsensiResponse {
  absensi_id: string;
  user_id: string;
  tanggal: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  marked_by?: string;
}

export interface IzinKeluarResponse {
  izin_id: string;
  user_id: string;
  created_at: string;
  keterangan: string;
  perkiraan_kembali: string | null;
}

export interface PublicAbsensiResponse {
  absensi_id: string;
  nama_siswa: string;
  kelas: string | null;
  tanggal: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
}

export interface PublicIzinKeluarResponse {
  izin_id: string;
  nama_siswa: string;
  kelas: string | null;
  created_at: string;
  keterangan: string;
  perkiraan_kembali: string | null;
}

export interface BulkAttendanceEntry {
  user_id: string;
  status: "Hadir" | "Terlambat" | "Izin" | "Sakit" | "Alfa";
}

export interface BulkAbsensiCreateRequest {
  kelas_id: string;
  tanggal: string;
  entries: BulkAttendanceEntry[];
}

export interface BulkAbsensiResponse {
  created_count: number;
  updated_count: number;
  message: string;
}

export interface UpdateAbsensiRequest {
  status?: "Hadir" | "Izin" | "Sakit" | "Alfa" | "Terlambat";
  time_in?: string | null;
  time_out?: string | null;
}

export interface AttendanceSettingsResponse {
  late_cutoff_time: string;
}

export interface UpdateAttendanceSettingsRequest {
  late_cutoff_time: string;
}
