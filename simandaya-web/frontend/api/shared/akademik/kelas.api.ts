import type {
  CreateKelasRequest,
  KelasResponse,
  SiswaKelasResponse,
  UpdateKelasRequest,
} from "@/types/akademik/kelas";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const kelasApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listKelas: builder.query<KelasResponse[], void>({
      query: () => "/kelas",
      providesTags: ["Kelas"],
    }),
    listActiveKelas: builder.query<KelasResponse[], void>({
      query: () => "/kelas/active",
      providesTags: ["Kelas"],
    }),
    createKelas: builder.mutation<KelasResponse, CreateKelasRequest>({
      query: (body) => ({ url: "/kelas", method: "POST", body }),
      invalidatesTags: ["Kelas"],
    }),
    updateKelas: builder.mutation<KelasResponse, { id: UUID; body: UpdateKelasRequest }>({
      query: ({ id, body }) => ({ url: `/kelas/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["Kelas", { type: "Kelas", id }],
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
  }),
});

export const {
  useListKelasQuery,
  useListActiveKelasQuery,
  useCreateKelasMutation,
  useUpdateKelasMutation,
  useDeleteKelasMutation,
  useListKelasByTahunAjaranQuery,
  useListSiswaInKelasQuery,
  useAssignSiswaToKelasMutation,
  useRemoveSiswaFromKelasMutation,
} = kelasApi;
