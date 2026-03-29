import type {
  CreateGuruMapelRequest,
  GuruAcademicContextResponse,
  GuruMapelResponse,
  UpdateGuruMapelRequest,
} from "@/types/akademik/jadwal";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const guruMapelApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listGuruMapel: builder.query<GuruMapelResponse[], void>({
      query: () => "/guru-mapel",
      providesTags: ["GuruMapel"],
    }),
    listActiveGuruMapel: builder.query<GuruMapelResponse[], void>({
      query: () => "/guru-mapel/active",
      providesTags: ["GuruMapel"],
    }),
    getMyGuruAcademicContext: builder.query<GuruAcademicContextResponse, void>({
      query: () => "/guru-mapel/my-context",
      providesTags: ["GuruMapel", "Semester", "TahunAjaran", "Kelas"],
    }),
    createGuruMapel: builder.mutation<GuruMapelResponse, CreateGuruMapelRequest>({
      query: (body) => ({ url: "/guru-mapel", method: "POST", body }),
      invalidatesTags: ["GuruMapel", "Jadwal"],
    }),
    updateGuruMapel: builder.mutation<
      GuruMapelResponse,
      { id: UUID; body: UpdateGuruMapelRequest }
    >({
      query: ({ id, body }) => ({ url: `/guru-mapel/${id}`, method: "PATCH", body }),
      invalidatesTags: ["GuruMapel", "Jadwal"],
    }),
    deleteGuruMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/guru-mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["GuruMapel", "Jadwal"],
    }),
  }),
});

export const {
  useListGuruMapelQuery,
  useListActiveGuruMapelQuery,
  useGetMyGuruAcademicContextQuery,
  useCreateGuruMapelMutation,
  useUpdateGuruMapelMutation,
  useDeleteGuruMapelMutation,
} = guruMapelApi;
