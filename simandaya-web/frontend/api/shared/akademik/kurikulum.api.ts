import type {
  BulkAssignKurikulumMapelRequest,
  CreateKurikulumMapelRequest,
  KurikulumMapelResponse,
  UpdateKurikulumMapelRequest,
} from "@/types/akademik/kurikulum";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const kurikulumApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const {
  useListKurikulumByTahunAjaranQuery,
  useListKurikulumByTingkatQuery,
  useCreateKurikulumMapelMutation,
  useBulkAssignKurikulumMutation,
  useUpdateKurikulumMapelMutation,
  useDeleteKurikulumMapelMutation,
} = kurikulumApi;
