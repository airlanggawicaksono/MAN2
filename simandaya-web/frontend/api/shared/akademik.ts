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
  SemesterResponse, CreateSemesterRequest, UpdateSemesterRequest,
  CopySemesterStructureRequest, CopySemesterStructureResponse,
  CopyTahunAjaranStructureRequest, CopyTahunAjaranStructureResponse,
} from "@/types/akademik/periode";
import type {
  KurikulumMapelResponse, CreateKurikulumMapelRequest,
  BulkAssignKurikulumMapelRequest, UpdateKurikulumMapelRequest,
} from "@/types/akademik/kurikulum";
import type {
  CreateKategoriKelasRequest,
  KategoriKelasResponse,
  UpdateKategoriKelasRequest,
} from "@/types/akademik/kategori-kelas";
import type {
  AssignKonsentrasiMapelRequest,
  AssignKelasKonsentrasiRequest,
  CreateKonsentrasiRequest,
  KelasKonsentrasiResponse,
  KonsentrasiMapelResponse,
  KonsentrasiResponse,
  UpdateKonsentrasiRequest,
} from "@/types/akademik/konsentrasi";
import type { MessageResponse } from "@/types/common";
import { UUID } from "@/types/common";

export const akademikApi = createApi({
  reducerPath: "akademikApi",
  baseQuery: createBaseQuery("/akademik"),
  tagTypes: ["Mapel", "Kelas", "KategoriKelas", "Jadwal", "GuruMapel", "TahunAjaran", "Semester", "Kurikulum", "Konsentrasi"],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    listKategoriKelas: builder.query<KategoriKelasResponse[], void>({
      query: () => "/kategori-kelas",
      providesTags: ["KategoriKelas"],
    }),
    createKategoriKelas: builder.mutation<KategoriKelasResponse, CreateKategoriKelasRequest>({
      query: (body) => ({ url: "/kategori-kelas", method: "POST", body }),
      invalidatesTags: ["KategoriKelas"],
    }),
    updateKategoriKelas: builder.mutation<
      KategoriKelasResponse,
      { id: UUID; body: UpdateKategoriKelasRequest }
    >({
      query: ({ id, body }) => ({ url: `/kategori-kelas/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["KategoriKelas", { type: "KategoriKelas", id }],
    }),
    deleteKategoriKelas: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/kategori-kelas/${id}`, method: "DELETE" }),
      invalidatesTags: ["KategoriKelas"],
    }),

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
    copyTahunAjaranStructure: builder.mutation<
      CopyTahunAjaranStructureResponse,
      CopyTahunAjaranStructureRequest
    >({
      query: (body) => ({ url: "/tahun-ajaran/copy-structure", method: "POST", body }),
      invalidatesTags: ["TahunAjaran", "Semester", "Kelas", "Kurikulum", "GuruMapel"],
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
    copySemesterStructure: builder.mutation<CopySemesterStructureResponse, CopySemesterStructureRequest>({
      query: (body) => ({ url: "/semester/copy-structure", method: "POST", body }),
      invalidatesTags: ["Semester", "Jadwal"],
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
    listKurikulumByTahunAjaran: builder.query<
      KurikulumMapelResponse[],
      { taId: UUID; kategoriKelasId?: UUID }
    >({
      query: ({ taId, kategoriKelasId }) =>
        kategoriKelasId
          ? `/kurikulum-mapel/tahun-ajaran/${taId}?kategori_kelas_id=${kategoriKelasId}`
          : `/kurikulum-mapel/tahun-ajaran/${taId}`,
      providesTags: ["Kurikulum"],
    }),
    listKurikulumByTingkat: builder.query<
      KurikulumMapelResponse[],
      { taId: UUID; tingkat: string; kategoriKelasId?: UUID }
    >({
      query: ({ taId, tingkat, kategoriKelasId }) =>
        kategoriKelasId
          ? `/kurikulum-mapel/tahun-ajaran/${taId}/tingkat/${tingkat}?kategori_kelas_id=${kategoriKelasId}`
          : `/kurikulum-mapel/tahun-ajaran/${taId}/tingkat/${tingkat}`,
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

    // â”€â”€ Konsentrasi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    listKonsentrasi: builder.query<
      KonsentrasiResponse[],
      { tahunAjaranId?: UUID; tingkat?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.tahunAjaranId) params.set("tahun_ajaran_id", args.tahunAjaranId);
        if (args?.tingkat) params.set("tingkat", args.tingkat);
        const suffix = params.toString();
        return suffix ? `/konsentrasi?${suffix}` : "/konsentrasi";
      },
      providesTags: ["Konsentrasi"],
    }),
    getKonsentrasi: builder.query<KonsentrasiResponse, UUID>({
      query: (id) => `/konsentrasi/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Konsentrasi", id }],
    }),
    createKonsentrasi: builder.mutation<KonsentrasiResponse, CreateKonsentrasiRequest>({
      query: (body) => ({ url: "/konsentrasi", method: "POST", body }),
      invalidatesTags: ["Konsentrasi"],
    }),
    updateKonsentrasi: builder.mutation<KonsentrasiResponse, { id: UUID; body: UpdateKonsentrasiRequest }>({
      query: ({ id, body }) => ({ url: `/konsentrasi/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["Konsentrasi", { type: "Konsentrasi", id }],
    }),
    deleteKonsentrasi: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/konsentrasi/${id}`, method: "DELETE" }),
      invalidatesTags: ["Konsentrasi"],
    }),
    listKonsentrasiMapel: builder.query<KonsentrasiMapelResponse[], UUID>({
      query: (konsentrasiId) => `/konsentrasi/${konsentrasiId}/mapel`,
      providesTags: ["Konsentrasi"],
    }),
    assignKonsentrasiMapel: builder.mutation<
      KonsentrasiMapelResponse,
      { konsentrasiId: UUID; body: AssignKonsentrasiMapelRequest }
    >({
      query: ({ konsentrasiId, body }) => ({ url: `/konsentrasi/${konsentrasiId}/mapel`, method: "POST", body }),
      invalidatesTags: ["Konsentrasi"],
    }),
    removeKonsentrasiMapel: builder.mutation<MessageResponse, { konsentrasiId: UUID; mapelId: UUID }>({
      query: ({ konsentrasiId, mapelId }) => ({
        url: `/konsentrasi/${konsentrasiId}/mapel/${mapelId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Konsentrasi"],
    }),
    listKonsentrasiKelas: builder.query<KelasKonsentrasiResponse[], UUID>({
      query: (konsentrasiId) => `/konsentrasi/${konsentrasiId}/kelas`,
      providesTags: ["Konsentrasi"],
    }),
    assignKonsentrasiKelas: builder.mutation<
      KelasKonsentrasiResponse,
      { konsentrasiId: UUID; body: AssignKelasKonsentrasiRequest }
    >({
      query: ({ konsentrasiId, body }) => ({ url: `/konsentrasi/${konsentrasiId}/kelas`, method: "POST", body }),
      invalidatesTags: ["Konsentrasi"],
    }),
    removeKonsentrasiKelas: builder.mutation<MessageResponse, { konsentrasiId: UUID; kelasId: UUID }>({
      query: ({ konsentrasiId, kelasId }) => ({
        url: `/konsentrasi/${konsentrasiId}/kelas/${kelasId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Konsentrasi"],
    }),
  }),
});

export const {
  useListKategoriKelasQuery,
  useCreateKategoriKelasMutation,
  useUpdateKategoriKelasMutation,
  useDeleteKategoriKelasMutation,
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
  useCopyTahunAjaranStructureMutation,
  useUpdateTahunAjaranMutation,
  useDeleteTahunAjaranMutation,
  useListSemestersQuery,
  useCreateSemesterMutation,
  useCopySemesterStructureMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useListKurikulumByTahunAjaranQuery,
  useListKurikulumByTingkatQuery,
  useCreateKurikulumMapelMutation,
  useBulkAssignKurikulumMutation,
  useUpdateKurikulumMapelMutation,
  useDeleteKurikulumMapelMutation,
  useListKonsentrasiQuery,
  useGetKonsentrasiQuery,
  useCreateKonsentrasiMutation,
  useUpdateKonsentrasiMutation,
  useDeleteKonsentrasiMutation,
  useListKonsentrasiMapelQuery,
  useAssignKonsentrasiMapelMutation,
  useRemoveKonsentrasiMapelMutation,
  useListKonsentrasiKelasQuery,
  useAssignKonsentrasiKelasMutation,
  useRemoveKonsentrasiKelasMutation,
} = akademikApi;
