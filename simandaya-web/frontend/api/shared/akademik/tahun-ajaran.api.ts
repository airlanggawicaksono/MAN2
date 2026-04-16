import type {
  CopyTahunAjaranStructureRequest,
  CopyTahunAjaranStructureResponse,
  CreateTahunAjaranRequest,
  TahunAjaranResponse,
  UpdateTahunAjaranRequest,
} from "@/types/akademik/periode";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const tahunAjaranApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, _error, { id }) => ["TahunAjaran", { type: "TahunAjaran", id }],
    }),
    archiveTahunAjaran: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/tahun-ajaran/${id}/archive`, method: "PATCH" }),
      invalidatesTags: ["TahunAjaran"],
    }),
  }),
});

export const {
  useListTahunAjaranQuery,
  useCreateTahunAjaranMutation,
  useCopyTahunAjaranStructureMutation,
  useUpdateTahunAjaranMutation,
  useArchiveTahunAjaranMutation,
} = tahunAjaranApi;
