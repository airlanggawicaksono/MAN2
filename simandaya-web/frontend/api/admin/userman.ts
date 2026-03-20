import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type {
  GetStructuralRoleResponseList,
} from "@/types/structural";
import type {
  ListPublicCivitasParams,
  PaginatedPublicCivitasResponse,
} from "@/types/userman";

export const usermanApi = createApi({
  reducerPath: "usermanApi",
  baseQuery: createBaseQuery("/users"),
  tagTypes: ["User", "StructuralRole"],
  endpoints: (builder) => ({
    listPublicCivitas: builder.query<PaginatedPublicCivitasResponse, ListPublicCivitasParams | void>({
      query: (params) => {
        const skip = params?.skip ?? 0;
        const limit = params?.limit ?? 100;
        let url = `/civitas?skip=${skip}&limit=${limit}`;
        if (params?.search) {
          url += `&search=${encodeURIComponent(params.search)}`;
        }
        return url;
      },
      providesTags: ["User"],
    }),
    getStructuralRoles: builder.query<GetStructuralRoleResponseList, void>({
      query: () => "/structural-roles",
      providesTags: ["StructuralRole"],
    }),
  }),
});

export const {
  useListPublicCivitasQuery,
  useGetStructuralRolesQuery,
} = usermanApi;
