import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type { NilaiResponse, CreateNilaiRequest, BulkCreateNilaiRequest, UpdateNilaiRequest, BulkNilaiResponse } from "@/types/penilaian/nilai";
import type { RaporResponse, RaporListItem, GenerateRaporRequest, GenerateRaporResponse, UpdateRaporRequest, OverrideNilaiRequest } from "@/types/penilaian/rapor";
import type { TugasResponse, CreateTugasRequest, UpdateTugasRequest } from "@/types/penilaian/tugas";
import type { MessageResponse } from "@/types/common";
import { UUID } from "@/types/common";

export const penilaianApi = createApi({
  reducerPath: "penilaianApi",
  baseQuery: createBaseQuery(""), // Base paths are /penilaian and /rapor
  tagTypes: ["Nilai", "Rapor", "Tugas"],
  endpoints: (builder) => ({
    // ── Tugas ───────────────────────────────────────────────────────────────────
    listTugasByKelas: builder.query<TugasResponse[], { kelasId: UUID; semesterId: UUID; mapelId?: UUID }>({
      query: ({ kelasId, semesterId, mapelId }) => ({
        url: `/penilaian/tugas/kelas/${kelasId}`,
        params: { semester_id: semesterId, mapel_id: mapelId },
      }),
      providesTags: ["Tugas"],
    }),
    getTugas: builder.query<TugasResponse, UUID>({
      query: (id) => `/penilaian/tugas/${id}`,
      providesTags: (result, error, id) => [{ type: "Tugas", id }],
    }),
    createTugas: builder.mutation<TugasResponse, CreateTugasRequest>({
      query: (body) => ({ url: "/penilaian/tugas", method: "POST", body }),
      invalidatesTags: ["Tugas"],
    }),
    updateTugas: builder.mutation<TugasResponse, { id: UUID; body: UpdateTugasRequest }>({
      query: ({ id, body }) => ({ url: `/penilaian/tugas/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["Tugas", { type: "Tugas", id }],
    }),
    deleteTugas: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/penilaian/tugas/${id}`, method: "DELETE" }),
      invalidatesTags: ["Tugas"],
    }),

    // ── Nilai ───────────────────────────────────────────────────────────────────
    listNilaiByTugas: builder.query<NilaiResponse[], UUID>({
      query: (tugasId) => `/penilaian/tugas/${tugasId}/nilai`,
      providesTags: ["Nilai"],
    }),
    getMyScores: builder.query<NilaiResponse[], { semesterId?: UUID }>({
      query: ({ semesterId }) => ({
        url: "/penilaian/nilai/my-scores",
        params: semesterId ? { semester_id: semesterId } : undefined,
      }),
      providesTags: ["Nilai"],
    }),
    createNilai: builder.mutation<NilaiResponse, { tugasId: UUID; body: CreateNilaiRequest }>({
      query: ({ tugasId, body }) => ({
        url: `/penilaian/tugas/${tugasId}/nilai`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Nilai"],
    }),
    bulkCreateNilai: builder.mutation<BulkNilaiResponse, { tugasId: UUID; body: BulkCreateNilaiRequest }>({
      query: ({ tugasId, body }) => ({
        url: `/penilaian/tugas/${tugasId}/nilai/bulk`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Nilai", "Rapor"],
    }),
    updateNilai: builder.mutation<NilaiResponse, { id: UUID; body: UpdateNilaiRequest }>({
      query: ({ id, body }) => ({
        url: `/penilaian/nilai/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Nilai", "Rapor"],
    }),

    // ── Rapor ───────────────────────────────────────────────────────────────────
    listRaporByKelas: builder.query<RaporListItem[], { kelasId: UUID; semesterId: UUID }>({
      query: ({ kelasId, semesterId }) => `/rapor/kelas/${kelasId}?semester_id=${semesterId}`,
      providesTags: ["Rapor"],
    }),
    getMyRapor: builder.query<RaporResponse, UUID>({
      query: (semesterId) => `/rapor/my-rapor?semester_id=${semesterId}`,
      providesTags: ["Rapor"],
    }),
    getRapor: builder.query<RaporResponse, UUID>({
      query: (id) => `/rapor/${id}`,
      providesTags: (result, error, id) => [{ type: "Rapor", id }],
    }),
    generateRapor: builder.mutation<GenerateRaporResponse, GenerateRaporRequest>({
      query: (body) => ({ url: "/rapor/generate", method: "POST", body }),
      invalidatesTags: ["Rapor"],
    }),
    publishRapor: builder.mutation<RaporResponse, UUID>({
      query: (id) => ({ url: `/rapor/${id}/publish`, method: "POST" }),
      invalidatesTags: (result, error, id) => [{ type: "Rapor", id }, "Rapor"],
    }),
    publishAllRapor: builder.mutation<MessageResponse, { kelasId: UUID; semesterId: UUID }>({
      query: ({ kelasId, semesterId }) => ({
        url: `/rapor/kelas/${kelasId}/publish-all?semester_id=${semesterId}`,
        method: "POST",
      }),
      invalidatesTags: ["Rapor"],
    }),
  }),
});

export const {
  useListTugasByKelasQuery,
  useGetTugasQuery,
  useCreateTugasMutation,
  useUpdateTugasMutation,
  useDeleteTugasMutation,
  useListNilaiByTugasQuery,
  useGetMyScoresQuery,
  useCreateNilaiMutation,
  useBulkCreateNilaiMutation,
  useUpdateNilaiMutation,
  useListRaporByKelasQuery,
  useGetMyRaporQuery,
  useGetRaporQuery,
  useGenerateRaporMutation,
  usePublishRaporMutation,
  usePublishAllRaporMutation,
} = penilaianApi;
