import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type {
  Mapel, CreateMapelRequest, UpdateMapelRequest,
  Kelas, CreateKelasRequest, UpdateKelasRequest,
  Jadwal, CreateJadwalRequest, UpdateJadwalRequest,
  TahunAjaran, Semester,
} from "@/types/akademik";
import type { MessageResponse } from "@/types/common";
import { UUID } from "@/types/common";

export const akademikApi = createApi({
  reducerPath: "akademikApi",
  baseQuery: createBaseQuery("/akademik"),
  tagTypes: ["Mapel", "Kelas", "Jadwal", "TahunAjaran", "Semester"],
  endpoints: (builder) => ({
    // ── Mata Pelajaran ──────────────────────────────────────────────────────────
    listMapel: builder.query<Mapel[], void>({
      query: () => "/mapel",
      providesTags: ["Mapel"],
    }),
    getMapel: builder.query<Mapel, UUID>({
      query: (id) => `/mapel/${id}`,
      providesTags: (result, error, id) => [{ type: "Mapel", id }],
    }),
    createMapel: builder.mutation<Mapel, CreateMapelRequest>({
      query: (body) => ({ url: "/mapel", method: "POST", body }),
      invalidatesTags: ["Mapel"],
    }),
    updateMapel: builder.mutation<Mapel, { id: UUID; body: UpdateMapelRequest }>({
      query: ({ id, body }) => ({ url: `/mapel/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Mapel", { type: "Mapel", id }],
    }),
    deleteMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["Mapel"],
    }),

    // ── Kelas ───────────────────────────────────────────────────────────────────
    listKelas: builder.query<Kelas[], void>({
      query: () => "/kelas",
      providesTags: ["Kelas"],
    }),
    getKelas: builder.query<Kelas, UUID>({
      query: (id) => `/kelas/${id}`,
      providesTags: (result, error, id) => [{ type: "Kelas", id }],
    }),
    createKelas: builder.mutation<Kelas, CreateKelasRequest>({
      query: (body) => ({ url: "/kelas", method: "POST", body }),
      invalidatesTags: ["Kelas"],
    }),
    updateKelas: builder.mutation<Kelas, { id: UUID; body: UpdateKelasRequest }>({
      query: ({ id, body }) => ({ url: `/kelas/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Kelas", { type: "Kelas", id }],
    }),
    deleteKelas: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/kelas/${id}`, method: "DELETE" }),
      invalidatesTags: ["Kelas"],
    }),

    // ── Jadwal ──────────────────────────────────────────────────────────────────
    listJadwalByKelas: builder.query<Jadwal[], UUID>({
      query: (kelasId) => `/jadwal/kelas/${kelasId}`,
      providesTags: ["Jadwal"],
    }),
    listJadwalByGuru: builder.query<Jadwal[], UUID>({
      query: (guruId) => `/jadwal/guru/${guruId}`,
      providesTags: ["Jadwal"],
    }),
    createJadwal: builder.mutation<Jadwal, CreateJadwalRequest>({
      query: (body) => ({ url: "/jadwal", method: "POST", body }),
      invalidatesTags: ["Jadwal"],
    }),
    updateJadwal: builder.mutation<Jadwal, { id: UUID; body: UpdateJadwalRequest }>({
      query: ({ id, body }) => ({ url: `/jadwal/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Jadwal"],
    }),
    deleteJadwal: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/jadwal/${id}`, method: "DELETE" }),
      invalidatesTags: ["Jadwal"],
    }),
  }),
});

export const {
  useListMapelQuery,
  useGetMapelQuery,
  useCreateMapelMutation,
  useUpdateMapelMutation,
  useDeleteMapelMutation,
  useListKelasQuery,
  useGetKelasQuery,
  useCreateKelasMutation,
  useUpdateKelasMutation,
  useDeleteKelasMutation,
  useListJadwalByKelasQuery,
  useListJadwalByGuruQuery,
  useCreateJadwalMutation,
  useUpdateJadwalMutation,
  useDeleteJadwalMutation,
} = akademikApi;
