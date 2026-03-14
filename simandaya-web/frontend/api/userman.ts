import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type {
  GetStructuralRoleResponseList,
} from "@/types/structural";

export const usermanApi = createApi({
  reducerPath: "usermanApi",
  baseQuery: createBaseQuery("/users"),
  tagTypes: ["User", "StructuralRole"],
  endpoints: (builder) => ({
    getStructuralRoles: builder.query<GetStructuralRoleResponseList, void>({
      query: () => "/structural-roles",
      providesTags: ["StructuralRole"],
    }),
  }),
});

export const {
  useGetStructuralRolesQuery,
} = usermanApi;
