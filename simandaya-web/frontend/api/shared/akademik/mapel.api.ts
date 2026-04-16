import type {
  CreateMapelRequest,
  MapelArchiveImpact,
  MapelResponse,
  UpdateMapelRequest,
} from "@/types/akademik/mapel";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export type AkademikListStatus = "available" | "archived" | "all";

export const mapelApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMapel: builder.query<
      MapelResponse[],
      { status?: AkademikListStatus; tahunAjaranId?: UUID } | void
    >({
      query: (arg) => ({
        url: "/mapel",
        params:
          arg?.status || arg?.tahunAjaranId
            ? {
                ...(arg?.status ? { status: arg.status } : {}),
                ...(arg?.tahunAjaranId ? { tahun_ajaran_id: arg.tahunAjaranId } : {}),
              }
            : undefined,
      }),
      providesTags: ["Mapel"],
    }),
    createMapel: builder.mutation<MapelResponse, CreateMapelRequest>({
      query: (body) => ({ url: "/mapel", method: "POST", body }),
      invalidatesTags: ["Mapel"],
    }),
    updateMapel: builder.mutation<MapelResponse, { id: UUID; body: UpdateMapelRequest }>({
      query: ({ id, body }) => ({ url: `/mapel/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        "Mapel",
        { type: "Mapel", id },
        "GuruMapel",
        "Jadwal",
        "Kurikulum",
      ],
    }),
    deleteMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["Mapel", "GuruMapel", "Jadwal", "Kurikulum"],
    }),
    getMapelArchiveImpact: builder.query<MapelArchiveImpact, UUID>({
      query: (id) => `/mapel/${id}/archive-impact`,
    }),
  }),
});

export const {
  useListMapelQuery,
  useGetMapelArchiveImpactQuery,
  useCreateMapelMutation,
  useUpdateMapelMutation,
  useDeleteMapelMutation,
} = mapelApi;
