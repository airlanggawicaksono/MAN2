import type { MessageResponse, UUID } from "@/types/common";
import type {
  CreateKategoriKelasRequest,
  KategoriKelasArchiveImpact,
  KategoriKelasResponse,
  UpdateKategoriKelasRequest,
} from "@/types/akademik/kategori-kelas";
import { akademikBaseApi } from "./base";

export type AkademikListStatus = "available" | "archived" | "all";

export const kategoriKelasApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listKategoriKelas: builder.query<
      KategoriKelasResponse[],
      { status?: AkademikListStatus; tahunAjaranId?: UUID } | void
    >({
      query: (arg) => ({
        url: "/kategori-kelas",
        params:
          arg?.status || arg?.tahunAjaranId
            ? {
                ...(arg?.status ? { status: arg.status } : {}),
                ...(arg?.tahunAjaranId ? { tahun_ajaran_id: arg.tahunAjaranId } : {}),
              }
            : undefined,
      }),
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
      invalidatesTags: (_result, _error, { id }) => [
        "KategoriKelas",
        { type: "KategoriKelas", id },
        "Kelas",
        "GuruMapel",
        "Jadwal",
        "Kurikulum",
      ],
    }),
    deleteKategoriKelas: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/kategori-kelas/${id}`, method: "DELETE" }),
      invalidatesTags: ["KategoriKelas", "Kelas", "GuruMapel", "Jadwal", "Kurikulum"],
    }),
    getKategoriKelasArchiveImpact: builder.query<KategoriKelasArchiveImpact, UUID>({
      query: (id) => `/kategori-kelas/${id}/archive-impact`,
    }),
  }),
});

export const {
  useListKategoriKelasQuery,
  useGetKategoriKelasArchiveImpactQuery,
  useCreateKategoriKelasMutation,
  useUpdateKategoriKelasMutation,
  useDeleteKategoriKelasMutation,
} = kategoriKelasApi;
