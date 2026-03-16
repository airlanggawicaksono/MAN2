import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";

export interface Absensi {
  absensi_id: string;
  user_id: string;
  tanggal: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  marked_by?: string;
}

export interface IzinKeluar {
  izin_id: string;
  user_id: string;
  created_at: string;
  keterangan: string;
  waktu_kembali: string | null;
}

export interface PublicAbsensi {
  absensi_id: string;
  nama_siswa: string;
  kelas: string | null;
  tanggal: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
}

export interface PublicIzinKeluar {
  izin_id: string;
  nama_siswa: string;
  kelas: string | null;
  created_at: string;
  keterangan: string;
  waktu_kembali: string | null;
}

interface ListParams {
  tanggal: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const absensiApi = createApi({
  reducerPath: "absensiApi",
  baseQuery: createBaseQuery("/absensi"),
  tagTypes: ["Absensi", "IzinKeluar"],
  endpoints: (builder) => ({
    // ── Public Endpoints ─────────────────────────────────────────────────────
    listPublicAttendance: builder.query<PublicAbsensi[], ListParams>({
      query: ({ tanggal, search, skip = 0, limit = 50 }) => {
        let url = `/public/attendance?tanggal=${tanggal}&skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (_r, _e, { tanggal }) => [{ type: "Absensi", id: `PUBLIC-${tanggal}` }],
    }),
    listPublicIzinKeluar: builder.query<PublicIzinKeluar[], ListParams>({
      query: ({ tanggal, search, skip = 0, limit = 50 }) => {
        let url = `/public/izin-keluar?tanggal=${tanggal}&skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (_r, _e, { tanggal }) => [{ type: "IzinKeluar", id: `PUBLIC-${tanggal}` }],
    }),

    // ── Private Management ───────────────────────────────────────────────────
    listAllIzinKeluar: builder.query<IzinKeluar[], void>({
      query: () => "/izin-keluar",
      providesTags: ["IzinKeluar"],
    }),
    getIzinKeluar: builder.query<IzinKeluar, string>({
      query: (id) => `/izin-keluar/${id}`,
      providesTags: (_r, _e, id) => [{ type: "IzinKeluar", id }],
    }),
  }),
});

export const {
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
  useListAllIzinKeluarQuery,
  useGetIzinKeluarQuery,
} = absensiApi;
