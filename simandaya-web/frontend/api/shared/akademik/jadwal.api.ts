import type { CreateJadwalRequest, JadwalResponse, UpdateJadwalRequest } from "@/types/akademik/jadwal";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const jadwalApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listJadwalByKelas: builder.query<JadwalResponse[], UUID>({
      query: (kelasId) => `/jadwal/kelas/${kelasId}`,
      providesTags: ["Jadwal"],
    }),
    createJadwal: builder.mutation<JadwalResponse, CreateJadwalRequest>({
      query: (body) => ({ url: "/jadwal", method: "POST", body }),
      invalidatesTags: ["Jadwal"],
    }),
    updateJadwal: builder.mutation<JadwalResponse, { id: UUID; body: UpdateJadwalRequest }>({
      query: ({ id, body }) => ({ url: `/jadwal/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Jadwal"],
    }),
    deleteJadwal: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/jadwal/${id}`, method: "DELETE" }),
      invalidatesTags: ["Jadwal"],
    }),
    getMyJadwal: builder.query<
      JadwalResponse[],
      { semesterId?: UUID; tahunAjaranId?: UUID } | void
    >({
      query: (args) => ({
        url: "/my-jadwal",
        params: {
          semester_id: args?.semesterId,
          tahun_ajaran_id: args?.tahunAjaranId,
        },
      }),
      providesTags: ["Jadwal"],
    }),
  }),
});

export const {
  useListJadwalByKelasQuery,
  useCreateJadwalMutation,
  useUpdateJadwalMutation,
  useDeleteJadwalMutation,
  useGetMyJadwalQuery,
} = jadwalApi;
