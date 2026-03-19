import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type {
  IzinKeluarResponse,
  PublicAbsensiResponse,
  PublicIzinKeluarResponse,
} from "@/types/absensi";

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
    listPublicAttendance: builder.query<PublicAbsensiResponse[], ListParams>({
      query: ({ tanggal, search, skip = 0, limit = 50 }) => {
        let url = `/public/attendance?tanggal=${tanggal}&skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (_r, _e, { tanggal }) => [{ type: "Absensi", id: `PUBLIC-${tanggal}` }],
    }),
    listPublicIzinKeluar: builder.query<PublicIzinKeluarResponse[], ListParams>({
      query: ({ tanggal, search, skip = 0, limit = 50 }) => {
        let url = `/public/izin-keluar?tanggal=${tanggal}&skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (_r, _e, { tanggal }) => [{ type: "IzinKeluar", id: `PUBLIC-${tanggal}` }],
    }),

    // ── Private Management ───────────────────────────────────────────────────
    listAllIzinKeluar: builder.query<IzinKeluarResponse[], void>({
      query: () => "/izin-keluar",
      providesTags: ["IzinKeluar"],
    }),
    getIzinKeluar: builder.query<IzinKeluarResponse, string>({
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
