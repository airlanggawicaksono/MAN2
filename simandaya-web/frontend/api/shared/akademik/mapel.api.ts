import type { CreateMapelRequest, MapelResponse, UpdateMapelRequest } from "@/types/akademik/mapel";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const mapelApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMapel: builder.query<MapelResponse[], void>({
      query: () => "/mapel",
      providesTags: ["Mapel"],
    }),
    createMapel: builder.mutation<MapelResponse, CreateMapelRequest>({
      query: (body) => ({ url: "/mapel", method: "POST", body }),
      invalidatesTags: ["Mapel"],
    }),
    updateMapel: builder.mutation<MapelResponse, { id: UUID; body: UpdateMapelRequest }>({
      query: ({ id, body }) => ({ url: `/mapel/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["Mapel", { type: "Mapel", id }],
    }),
    deleteMapel: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/mapel/${id}`, method: "DELETE" }),
      invalidatesTags: ["Mapel"],
    }),
  }),
});

export const {
  useListMapelQuery,
  useCreateMapelMutation,
  useUpdateMapelMutation,
  useDeleteMapelMutation,
} = mapelApi;
