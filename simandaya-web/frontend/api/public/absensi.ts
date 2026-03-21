import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type {
  IzinKeluarResponse,
  PublicAbsensiResponse,
  PublicIzinKeluarResponse,
  BulkAbsensiCreateRequest,
  BulkAbsensiResponse,
  UpdateAbsensiRequest,
  AbsensiResponse,
  AttendanceSettingsResponse,
  UpdateAttendanceSettingsRequest,
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
    bulkMarkAttendance: builder.mutation<BulkAbsensiResponse, BulkAbsensiCreateRequest>({
      query: (body) => ({
        url: "/attendance/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Absensi"],
    }),
    updateAttendance: builder.mutation<
      AbsensiResponse,
      { absensi_id: string; payload: UpdateAbsensiRequest }
    >({
      query: ({ absensi_id, payload }) => ({
        url: `/attendance/${absensi_id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Absensi"],
    }),
    deleteAttendance: builder.mutation<{ message: string }, { absensi_id: string }>({
      query: ({ absensi_id }) => ({
        url: `/attendance/${absensi_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Absensi"],
    }),
    getAttendanceSettings: builder.query<AttendanceSettingsResponse, void>({
      query: () => "/settings",
      providesTags: ["Absensi"],
    }),
    updateAttendanceSettings: builder.mutation<
      AttendanceSettingsResponse,
      UpdateAttendanceSettingsRequest
    >({
      query: (body) => ({
        url: "/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Absensi"],
    }),
  }),
});

export const {
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
  useListAllIzinKeluarQuery,
  useGetIzinKeluarQuery,
  useBulkMarkAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  useGetAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} = absensiApi;
