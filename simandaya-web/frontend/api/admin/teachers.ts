import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type {
  GuruProfile,
  PreRegisterTeacherRequest,
  PreRegisterResponse,
  UpdateGuruRequest,
  PaginatedTeachersResponse,
  ListTeachersParams,
} from "@/types/teachers";
import type { MessageResponse } from "@/types/common";

export const teachersApi = createApi({
  reducerPath: "teachersApi",
  baseQuery: createBaseQuery("/users/teachers"),
  tagTypes: ["Teacher"],
  endpoints: (builder) => ({
    listTeachers: builder.query<PaginatedTeachersResponse, ListTeachersParams>({
      query: ({ skip, limit, search }) => {
        let url = `?skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ guru_id }) => ({
                type: "Teacher" as const,
                id: guru_id,
              })),
              { type: "Teacher", id: "LIST" },
            ]
          : [{ type: "Teacher", id: "LIST" }],
    }),

    getTeacher: builder.query<GuruProfile, string>({
      query: (guruId) => `/${guruId}`,
      providesTags: (_result, _err, guruId) => [{ type: "Teacher", id: guruId }],
    }),

    preRegisterTeacher: builder.mutation<PreRegisterResponse, PreRegisterTeacherRequest>({
      query: (body) => ({ url: "/pre-register", method: "POST", body }),
      invalidatesTags: [{ type: "Teacher", id: "LIST" }],
    }),

    updateTeacher: builder.mutation<
      GuruProfile,
      { guruId: string; body: UpdateGuruRequest }
    >({
      query: ({ guruId, body }) => ({
        url: `/${guruId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { guruId }) => [
        { type: "Teacher", id: guruId },
        { type: "Teacher", id: "LIST" },
      ],
    }),

    updateMyTeacherProfile: builder.mutation<GuruProfile, UpdateGuruRequest>({
      query: (body) => ({
        url: "/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Teacher", id: "LIST" }],
    }),

    deleteTeacher: builder.mutation<MessageResponse, string>({
      query: (guruId) => ({ url: `/${guruId}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, guruId) => [
        { type: "Teacher", id: guruId },
        { type: "Teacher", id: "LIST" },
      ],
    }),

    getMyTeacherProfile: builder.query<GuruProfile, void>({
      query: () => "/me",
      providesTags: ["Teacher"],
    }),
  }),
});

export const {
  useListTeachersQuery,
  useGetTeacherQuery,
  usePreRegisterTeacherMutation,
  useUpdateTeacherMutation,
  useUpdateMyTeacherProfileMutation,
  useDeleteTeacherMutation,
  useGetMyTeacherProfileQuery,
} = teachersApi;
