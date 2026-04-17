import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type {
  AssignStructuralRoleRequest,
  GuruStructuralAssignment,
  StructuralRoleRef,
} from "@/types/structural";
import type {
  ListPublicCivitasParams,
  PaginatedPublicCivitasResponse,
} from "@/types/userman";
import type { MessageResponse } from "@/types/common";

export const usermanApi = createApi({
  reducerPath: "usermanApi",
  baseQuery: createBaseQuery("/users"),
  tagTypes: ["User", "StructuralRole", "StructuralAssignment"],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
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
    getStructuralRoles: builder.query<
      StructuralRoleRef[],
      { includeInactive?: boolean; availableOnly?: boolean; forUserId?: string } | void
    >({
      query: (params) => {
        const includeInactive = params?.includeInactive ?? false;
        const availableOnly = params?.availableOnly ?? false;
        const forUserId = params?.forUserId;
        let url = `/structural-role-catalog?include_inactive=${includeInactive}&available_only=${availableOnly}`;
        if (forUserId) {
          url += `&for_user_id=${encodeURIComponent(forUserId)}`;
        }
        return url;
      },
      providesTags: ["StructuralRole"],
    }),
    assignStructuralRole: builder.mutation<
      GuruStructuralAssignment,
      AssignStructuralRoleRequest
    >({
      query: (body) => ({
        url: "/structural-assignments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StructuralAssignment", "StructuralRole", "User"],
    }),
    listTeacherStructuralAssignments: builder.query<
      GuruStructuralAssignment[],
      { userId: string; activeOnly?: boolean }
    >({
      query: ({ userId, activeOnly = false }) =>
        `/teachers/${userId}/structural-assignments?active_only=${activeOnly}`,
      providesTags: ["StructuralAssignment"],
    }),
    deactivateStructuralAssignment: builder.mutation<MessageResponse, string>({
      query: (assignmentId) => ({
        url: `/structural-assignments/${assignmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StructuralAssignment", "StructuralRole", "User"],
    }),
  }),
});

export const {
  useListPublicCivitasQuery,
  useGetStructuralRolesQuery,
  useAssignStructuralRoleMutation,
  useListTeacherStructuralAssignmentsQuery,
  useDeactivateStructuralAssignmentMutation,
} = usermanApi;
