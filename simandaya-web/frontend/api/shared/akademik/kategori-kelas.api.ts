import type { MessageResponse, UUID } from "@/types/common";
import type {
  CreateKategoriKelasRequest,
  KategoriKelasResponse,
  UpdateKategoriKelasRequest,
} from "@/types/akademik/kategori-kelas";
import { akademikBaseApi } from "./base";

export const kategoriKelasApi = akademikBaseApi.injectEndpoints({
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
  }),
});

export const {
  useListKategoriKelasQuery,
  useCreateKategoriKelasMutation,
  useUpdateKategoriKelasMutation,
  useDeleteKategoriKelasMutation,
} = kategoriKelasApi;
