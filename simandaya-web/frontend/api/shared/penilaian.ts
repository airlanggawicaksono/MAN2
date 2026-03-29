import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type {
  NilaiResponse,
  NilaiByMapelResponse,
  CreateNilaiRequest,
  BulkCreateNilaiRequest,
  UpdateNilaiRequest,
  BulkNilaiResponse,
} from "@/types/penilaian/nilai";
import type {
  OverrideNilaiRequest,
  GuruRaporContextResponse,
  RaporEditorResponse,
  RaporListItem,
  RaporResponse,
  SaveRaporEditorRequest,
  UpdateRaporRequest,
} from "@/types/penilaian/rapor";
import type {
  TugasResponse,
  CreateTugasRequest,
  UpdateTugasRequest,
  TugasSubmissionResponse,
  CreateTugasSubmissionRequest,
  UpdateTugasSubmissionRequest,
} from "@/types/penilaian/tugas";
import type { SiswaOverviewResponse } from "@/types/penilaian/siswa-overview";
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
    listMyClassTugas: builder.query<TugasResponse[], { semesterId: UUID }>({
      query: ({ semesterId }) => ({
        url: "/penilaian/tugas/my-class",
        params: { semester_id: semesterId },
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
      invalidatesTags: (result, error, { id }) => [
        "Tugas",
        { type: "Tugas", id },
        "Nilai",
        "Rapor",
      ],
    }),
    deleteTugas: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/penilaian/tugas/${id}`, method: "DELETE" }),
      invalidatesTags: ["Tugas", "Nilai", "Rapor"],
    }),
    getMySubmission: builder.query<TugasSubmissionResponse | null, UUID>({
      query: (tugasId) => `/penilaian/tugas/${tugasId}/submission/my`,
      providesTags: ["Tugas"],
    }),
    listMySubmissions: builder.query<TugasSubmissionResponse[], { semesterId: UUID }>({
      query: ({ semesterId }) => ({
        url: "/penilaian/tugas/submissions/my",
        params: { semester_id: semesterId },
      }),
      providesTags: ["Tugas"],
    }),
    createMySubmission: builder.mutation<
      TugasSubmissionResponse,
      { tugasId: UUID; body: CreateTugasSubmissionRequest }
    >({
      query: ({ tugasId, body }) => ({
        url: `/penilaian/tugas/${tugasId}/submission`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tugas"],
    }),
    updateMySubmission: builder.mutation<
      TugasSubmissionResponse,
      { tugasId: UUID; body: UpdateTugasSubmissionRequest }
    >({
      query: ({ tugasId, body }) => ({
        url: `/penilaian/tugas/${tugasId}/submission`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Tugas"],
    }),
    deleteMySubmission: builder.mutation<MessageResponse, UUID>({
      query: (tugasId) => ({
        url: `/penilaian/tugas/${tugasId}/submission/my`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tugas", "Nilai", "Rapor"],
    }),
    listSubmissionsByTugas: builder.query<TugasSubmissionResponse[], UUID>({
      query: (tugasId) => `/penilaian/tugas/${tugasId}/submissions`,
      providesTags: ["Tugas"],
    }),
    getSiswaOverview: builder.query<
      SiswaOverviewResponse,
      { semesterId?: UUID; semesterKe?: number } | undefined
    >({
      query: (paramsArg) => ({
        url: "/penilaian/siswa/overview",
        params: paramsArg
          ? {
              ...(paramsArg.semesterId ? { semester_id: paramsArg.semesterId } : {}),
              ...(typeof paramsArg.semesterKe === "number"
                ? { semester_ke: paramsArg.semesterKe }
                : {}),
            }
          : undefined,
      }),
      providesTags: ["Rapor", "Nilai", "Tugas"],
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
    getMyScoresByMapel: builder.query<NilaiByMapelResponse[], { semesterId?: UUID }>({
      query: ({ semesterId }) => ({
        url: "/penilaian/nilai/my-scores/by-mapel",
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
    getGuruRaporContext: builder.query<GuruRaporContextResponse, void>({
      query: () => "/rapor/guru/context",
      providesTags: ["Rapor"],
    }),
    listRaporByKelas: builder.query<RaporListItem[], { kelasId: UUID; semesterId: UUID }>({
      query: ({ kelasId, semesterId }) => `/rapor/kelas/${kelasId}?semester_id=${semesterId}`,
      providesTags: ["Rapor"],
    }),
    getMyRapor: builder.query<
      RaporResponse,
      { semesterId?: UUID; semesterKe?: number } | undefined
    >({
      query: (paramsArg) => ({
        url: "/rapor/my-rapor",
        params: paramsArg
          ? {
              ...(paramsArg.semesterId ? { semester_id: paramsArg.semesterId } : {}),
              ...(typeof paramsArg.semesterKe === "number"
                ? { semester_ke: paramsArg.semesterKe }
                : {}),
            }
          : undefined,
      }),
      providesTags: ["Rapor"],
    }),
    getRapor: builder.query<RaporResponse, UUID>({
      query: (id) => `/rapor/${id}`,
      providesTags: (result, error, id) => [{ type: "Rapor", id }],
    }),
    getRaporEditor: builder.query<
      RaporEditorResponse,
      { kelasId: UUID; semesterId: UUID; siswaId: UUID }
    >({
      query: ({ kelasId, semesterId, siswaId }) => ({
        url: "/rapor/editor",
        params: {
          kelas_id: kelasId,
          semester_id: semesterId,
          siswa_id: siswaId,
        },
      }),
      providesTags: ["Rapor"],
    }),
    saveRaporEditor: builder.mutation<
      RaporEditorResponse,
      { raporId: UUID; body: SaveRaporEditorRequest }
    >({
      query: ({ raporId, body }) => ({
        url: `/rapor/editor/${raporId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Rapor"],
    }),
    publishRapor: builder.mutation<RaporResponse, UUID>({
      query: (id) => ({ url: `/rapor/${id}/publish`, method: "POST" }),
      invalidatesTags: (result, error, id) => [{ type: "Rapor", id }, "Rapor"],
    }),
    unpublishRapor: builder.mutation<RaporResponse, UUID>({
      query: (id) => ({ url: `/rapor/${id}/unpublish`, method: "POST" }),
      invalidatesTags: (result, error, id) => [{ type: "Rapor", id }, "Rapor"],
    }),
  }),
});

export const {
  useListTugasByKelasQuery,
  useListMyClassTugasQuery,
  useGetTugasQuery,
  useCreateTugasMutation,
  useUpdateTugasMutation,
  useDeleteTugasMutation,
  useGetMySubmissionQuery,
  useListMySubmissionsQuery,
  useCreateMySubmissionMutation,
  useUpdateMySubmissionMutation,
  useDeleteMySubmissionMutation,
  useListSubmissionsByTugasQuery,
  useGetSiswaOverviewQuery,
  useListNilaiByTugasQuery,
  useGetMyScoresQuery,
  useGetMyScoresByMapelQuery,
  useCreateNilaiMutation,
  useBulkCreateNilaiMutation,
  useUpdateNilaiMutation,
  useListRaporByKelasQuery,
  useGetGuruRaporContextQuery,
  useGetMyRaporQuery,
  useGetRaporQuery,
  useGetRaporEditorQuery,
  useSaveRaporEditorMutation,
  usePublishRaporMutation,
  useUnpublishRaporMutation,
} = penilaianApi;
