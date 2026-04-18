import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type {
  StudentProfile,
  UpdateStudentRequest,
  PaginatedStudentsResponse,
  ListStudentsParams,
} from "@/types/students";
import type { MessageResponse } from "@/types/common";

export const studentsApi = createApi({
  reducerPath: "studentsApi",
  baseQuery: createBaseQuery("/users/students"),
  tagTypes: ["Student"],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    listStudents: builder.query<PaginatedStudentsResponse, ListStudentsParams>({
      query: ({ skip, limit, search }) => {
        let url = `?skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ siswa_id }) => ({
                type: "Student" as const,
                id: siswa_id,
              })),
              { type: "Student", id: "LIST" },
            ]
          : [{ type: "Student", id: "LIST" }],
    }),

    getStudent: builder.query<StudentProfile, string>({
      query: (siswaId) => `/${siswaId}`,
      providesTags: (_result, _err, siswaId) => [{ type: "Student", id: siswaId }],
    }),

    updateStudent: builder.mutation<
      StudentProfile,
      { siswaId: string; body: UpdateStudentRequest }
    >({
      query: ({ siswaId, body }) => ({
        url: `/${siswaId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _err, { siswaId }) => [
        { type: "Student", id: siswaId },
        { type: "Student", id: "LIST" },
      ],
    }),

    deleteStudent: builder.mutation<MessageResponse, string>({
      query: (siswaId) => ({ url: `/${siswaId}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, siswaId) => [
        { type: "Student", id: siswaId },
        { type: "Student", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListStudentsQuery,
  useGetStudentQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;
