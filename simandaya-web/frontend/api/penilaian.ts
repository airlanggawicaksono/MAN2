import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type {
  Nilai, CreateNilaiRequest, BulkCreateNilaiRequest, UpdateNilaiRequest, BulkNilaiResponse,
  Rapor, RaporListItem, GenerateRaporRequest, GenerateRaporResponse, UpdateRaporRequest, OverrideNilaiRequest,
} from "@/types/penilaian";
import type { MessageResponse } from "@/types/common";
import { UUID } from "@/types/common";

export const penilaianApi = createApi({
  reducerPath: "penilaianApi",
  baseQuery: createBaseQuery(""), // Base paths are /penilaian and /rapor
  tagTypes: ["Nilai", "Rapor"],
  endpoints: (builder) => ({
    // ── Nilai ───────────────────────────────────────────────────────────────────
    listNilaiByTugas: builder.query<Nilai[], UUID>({
      query: (tugasId) => `/penilaian/tugas/${tugasId}/nilai`,
      providesTags: ["Nilai"],
    }),
    getMyScores: builder.query<Nilai[], { semesterId?: UUID }>({
      query: (params) => ({
        url: "/penilaian/nilai/my-scores",
        params,
      }),
      providesTags: ["Nilai"],
    }),
    createNilai: builder.mutation<Nilai, { tugasId: UUID; body: CreateNilaiRequest }>({
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
    updateNilai: builder.mutation<Nilai, { id: UUID; body: UpdateNilaiRequest }>({
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
    getMyRapor: builder.query<Rapor, UUID>({
      query: (semesterId) => `/rapor/my-rapor?semester_id=${semesterId}`,
      providesTags: ["Rapor"],
    }),
    getRapor: builder.query<Rapor, UUID>({
      query: (id) => `/rapor/${id}`,
      providesTags: (result, error, id) => [{ type: "Rapor", id }],
    }),
    generateRapor: builder.mutation<GenerateRaporResponse, GenerateRaporRequest>({
      query: (body) => ({ url: "/rapor/generate", method: "POST", body }),
      invalidatesTags: ["Rapor"],
    }),
    publishRapor: builder.mutation<Rapor, UUID>({
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
