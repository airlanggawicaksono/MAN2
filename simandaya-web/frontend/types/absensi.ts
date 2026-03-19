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
  waktu_kembali: string | null;
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
  waktu_kembali: string | null;
}
