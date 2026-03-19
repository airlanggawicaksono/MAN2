import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type { MapelResponse, CreateMapelRequest, UpdateMapelRequest } from "@/types/akademik/mapel";
import type {
  KelasResponse,
  CreateKelasRequest,
  UpdateKelasRequest,
  SiswaKelasResponse,
  PromoteStudentsResponse,
} from "@/types/akademik/kelas";
import type { JadwalResponse, CreateJadwalRequest, UpdateJadwalRequest, GuruMapelResponse, CreateGuruMapelRequest } from "@/types/akademik/jadwal";
import type { 
  TahunAjaranResponse, CreateTahunAjaranRequest, UpdateTahunAjaranRequest,
  SemesterResponse, CreateSemesterRequest, UpdateSemesterRequest 
} from "@/types/akademik/periode";
import type {
  KurikulumMapelResponse, CreateKurikulumMapelRequest,
  BulkAssignKurikulumMapelRequest, UpdateKurikulumMapelRequest,
} from "@/types/akademik/kurikulum";
import type { MessageResponse } from "@/types/common";
import { UUID } from "@/types/common";

export const akademikApi = createApi({
  reducerPath: "akademikApi",
  baseQuery: createBaseQuery("/akademik"),
  tagTypes: ["Mapel", "Kelas", "Jadwal", "GuruMapel", "TahunAjaran", "Semester", "Kurikulum"],
  endpoints: (builder) => ({
    // ── Mata Pelajaran ──────────────────────────────────────────────────────────
    listMapel: builder.query<MapelResponse[], void>({
      query: () => "/mapel",
      providesTags: ["Mapel"],
    }),
    getMapel: builder.query<MapelResponse, UUID>({
      query: (id) => `/mapel/${id}`,
      providesTags: (result, error, id) => [{ type: "Mapel", id }],
    }),
    createMapel: builder.mutation<MapelResponse, CreateMapelRequest>({
      query: (body) => ({ url: "/mapel", method: "POST", body }),
      invalidatesTags: ["Mapel"],
    }),
    updateMapel: builder.mutation<MapelResponse, { id: UUID; body: UpdateMapelRequest }>({
      query: ({ id, body }) => ({ url: `/mapel/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Mapel", { type: "Mapel", id }],
    }),
    deleteMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["Mapel"],
    }),

    // ── Kelas ───────────────────────────────────────────────────────────────────
    listKelas: builder.query<KelasResponse[], void>({
      query: () => "/kelas",
      providesTags: ["Kelas"],
    }),
    getKelas: builder.query<KelasResponse, UUID>({
      query: (id) => `/kelas/${id}`,
      providesTags: (result, error, id) => [{ type: "Kelas", id }],
    }),
    createKelas: builder.mutation<KelasResponse, CreateKelasRequest>({
      query: (body) => ({ url: "/kelas", method: "POST", body }),
      invalidatesTags: ["Kelas"],
    }),
    updateKelas: builder.mutation<KelasResponse, { id: UUID; body: UpdateKelasRequest }>({
      query: ({ id, body }) => ({ url: `/kelas/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Kelas", { type: "Kelas", id }],
    }),
    deleteKelas: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/kelas/${id}`, method: "DELETE" }),
      invalidatesTags: ["Kelas"],
    }),
    listKelasByTahunAjaran: builder.query<KelasResponse[], UUID>({
      query: (taId) => `/kelas/tahun-ajaran/${taId}`,
      providesTags: ["Kelas"],
    }),
    listSiswaInKelas: builder.query<SiswaKelasResponse[], UUID>({
      query: (kelasId) => `/kelas/${kelasId}/siswa`,
      providesTags: ["Kelas"],
    }),
    assignSiswaToKelas: builder.mutation<SiswaKelasResponse, { kelasId: UUID; userId: UUID }>({
      query: ({ kelasId, userId }) => ({ url: `/kelas/${kelasId}/siswa`, method: "POST", body: { user_id: userId } }),
      invalidatesTags: ["Kelas"],
    }),
    removeSiswaFromKelas: builder.mutation<MessageResponse, { kelasId: UUID; userId: UUID }>({
      query: ({ kelasId, userId }) => ({ url: `/kelas/${kelasId}/siswa/${userId}`, method: "DELETE" }),
      invalidatesTags: ["Kelas"],
    }),
    promoteStudents: builder.mutation<PromoteStudentsResponse, { from_tahun_ajaran_id: UUID; to_tahun_ajaran_id: UUID }>({
      query: (body) => ({ url: "/kelas/promote", method: "POST", body }),
      invalidatesTags: ["Kelas"],
    }),

    // ── Guru Mapel ──────────────────────────────────────────────────────────────
    listGuruMapel: builder.query<GuruMapelResponse[], void>({
      query: () => "/guru-mapel",
      providesTags: ["GuruMapel"],
    }),
    listMyGuruMapel: builder.query<GuruMapelResponse[], void>({
      query: () => "/guru-mapel/me",
      providesTags: ["GuruMapel"],
    }),
    createGuruMapel: builder.mutation<GuruMapelResponse, CreateGuruMapelRequest>({
      query: (body) => ({ url: "/guru-mapel", method: "POST", body }),
      invalidatesTags: ["GuruMapel"],
    }),
    deleteGuruMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/guru-mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["GuruMapel"],
    }),

    // ── Jadwal ──────────────────────────────────────────────────────────────────
    listJadwalByKelas: builder.query<JadwalResponse[], UUID>({
      query: (kelasId) => `/jadwal/kelas/${kelasId}`,
      providesTags: ["Jadwal"],
    }),
    listJadwalByGuru: builder.query<JadwalResponse[], UUID>({
      query: (guruId) => `/jadwal/guru/${guruId}`,
      providesTags: ["Jadwal"],
    }),
    createJadwal: builder.mutation<JadwalResponse, CreateJadwalRequest>({
      query: (body) => ({ url: "/jadwal", method: "POST", body }),
      invalidatesTags: ["Jadwal"],
    }),
    updateJadwal: builder.mutation<JadwalResponse, { id: UUID; body: UpdateJadwalRequest }>({
      query: ({ id, body }) => ({ url: `/jadwal/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Jadwal", { type: "Jadwal", id }],
    }),
    deleteJadwal: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/jadwal/${id}`, method: "DELETE" }),
      invalidatesTags: ["Jadwal"],
    }),
    getMyJadwal: builder.query<JadwalResponse[], void>({
      query: () => "/jadwal/my-jadwal",
      providesTags: ["Jadwal"],
    }),

    // ── Tahun Ajaran ───────────────────────────────────────────────────────────
    listTahunAjaran: builder.query<TahunAjaranResponse[], void>({
      query: () => "/tahun-ajaran",
      providesTags: ["TahunAjaran"],
    }),
    createTahunAjaran: builder.mutation<TahunAjaranResponse, CreateTahunAjaranRequest>({
      query: (body) => ({ url: "/tahun-ajaran", method: "POST", body }),
      invalidatesTags: ["TahunAjaran"],
    }),
    updateTahunAjaran: builder.mutation<TahunAjaranResponse, { id: UUID; body: UpdateTahunAjaranRequest }>({
      query: ({ id, body }) => ({ url: `/tahun-ajaran/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["TahunAjaran", { type: "TahunAjaran", id }],
    }),
    deleteTahunAjaran: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/tahun-ajaran/${id}`, method: "DELETE" }),
      invalidatesTags: ["TahunAjaran"],
    }),

    // ── Semester ───────────────────────────────────────────────────────────────
    listSemesters: builder.query<SemesterResponse[], void>({
      query: () => "/semester",
      providesTags: ["Semester"],
    }),
    createSemester: builder.mutation<SemesterResponse, CreateSemesterRequest>({
      query: (body) => ({ url: "/semester", method: "POST", body }),
      invalidatesTags: ["Semester"],
    }),
    updateSemester: builder.mutation<SemesterResponse, { id: UUID; body: UpdateSemesterRequest }>({
      query: ({ id, body }) => ({ url: `/semester/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Semester", { type: "Semester", id }],
    }),
    deleteSemester: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/semester/${id}`, method: "DELETE" }),
      invalidatesTags: ["Semester"],
    }),

    // ── Kurikulum Mapel ──────────────────────────────────────────────────────
    listKurikulumByTahunAjaran: builder.query<KurikulumMapelResponse[], UUID>({
      query: (taId) => `/kurikulum-mapel/tahun-ajaran/${taId}`,
      providesTags: ["Kurikulum"],
    }),
    listKurikulumByTingkat: builder.query<KurikulumMapelResponse[], { taId: UUID; tingkat: string }>({
      query: ({ taId, tingkat }) => `/kurikulum-mapel/tahun-ajaran/${taId}/tingkat/${tingkat}`,
      providesTags: ["Kurikulum"],
    }),
    createKurikulumMapel: builder.mutation<KurikulumMapelResponse, CreateKurikulumMapelRequest>({
      query: (body) => ({ url: "/kurikulum-mapel", method: "POST", body }),
      invalidatesTags: ["Kurikulum"],
    }),
    bulkAssignKurikulum: builder.mutation<KurikulumMapelResponse[], BulkAssignKurikulumMapelRequest>({
      query: (body) => ({ url: "/kurikulum-mapel/bulk", method: "POST", body }),
      invalidatesTags: ["Kurikulum"],
    }),
    updateKurikulumMapel: builder.mutation<KurikulumMapelResponse, { id: UUID; body: UpdateKurikulumMapelRequest }>({
      query: ({ id, body }) => ({ url: `/kurikulum-mapel/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Kurikulum"],
    }),
    deleteKurikulumMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/kurikulum-mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["Kurikulum"],
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
  useListKelasByTahunAjaranQuery,
  useListSiswaInKelasQuery,
  useAssignSiswaToKelasMutation,
  useRemoveSiswaFromKelasMutation,
  usePromoteStudentsMutation,
  useListGuruMapelQuery,
  useListMyGuruMapelQuery,
  useCreateGuruMapelMutation,
  useDeleteGuruMapelMutation,
  useListJadwalByKelasQuery,
  useListJadwalByGuruQuery,
  useCreateJadwalMutation,
  useUpdateJadwalMutation,
  useDeleteJadwalMutation,
  useGetMyJadwalQuery,
  useListTahunAjaranQuery,
  useCreateTahunAjaranMutation,
  useUpdateTahunAjaranMutation,
  useDeleteTahunAjaranMutation,
  useListSemestersQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useListKurikulumByTahunAjaranQuery,
  useListKurikulumByTingkatQuery,
  useCreateKurikulumMapelMutation,
  useBulkAssignKurikulumMutation,
  useUpdateKurikulumMapelMutation,
  useDeleteKurikulumMapelMutation,
} = akademikApi;
