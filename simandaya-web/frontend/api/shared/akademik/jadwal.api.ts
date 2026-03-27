import type { CreateJadwalRequest, JadwalResponse, UpdateJadwalRequest } from "@/types/akademik/jadwal";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const jadwalApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listJadwalByKelas: builder.query<JadwalResponse[], UUID>({
      query: (kelasId) => `/jadwal/kelas/${kelasId}`,
      providesTags: ["Jadwal"],
      refetchOnMountOrArgChange: true,
    }),
    listJadwalByGuru: builder.query<JadwalResponse[], UUID>({
      query: (guruId) => `/jadwal/guru/${guruId}`,
      providesTags: ["Jadwal"],
      refetchOnMountOrArgChange: true,
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
    getMyJadwal: builder.query<JadwalResponse[], void>({
      query: () => "/my-jadwal",
      providesTags: ["Jadwal"],
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const {
  useListJadwalByKelasQuery,
  useListJadwalByGuruQuery,
  useCreateJadwalMutation,
  useUpdateJadwalMutation,
  useDeleteJadwalMutation,
  useGetMyJadwalQuery,
} = jadwalApi;
