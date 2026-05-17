import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type {
  StudentProfile,
  CreateStudentRequest,
  UpdateStudentRequest,
  BulkImportResult,
  PaginatedStudentsResponse,
  ListStudentsParams,
  CardSetRequest,
  CardSetResponse,
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
    createStudent: builder.mutation<StudentProfile, CreateStudentRequest>({
      query: (body) => ({ url: "", method: "POST", body }),
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),

    bulkImportStudents: builder.mutation<BulkImportResult, CreateStudentRequest[]>({
      query: (body) => ({ url: "/import", method: "POST", body }),
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),

    listStudents: builder.query<PaginatedStudentsResponse, ListStudentsParams>({
      query: ({ skip, limit, search, status_siswa }) => {
        let url = `?skip=${skip}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status_siswa) url += `&status_siswa=${encodeURIComponent(status_siswa)}`;
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

    setStudentCard: builder.mutation<
      CardSetResponse,
      { siswaId: string; body: CardSetRequest }
    >({
      query: ({ siswaId, body }) => ({
        url: `/${siswaId}/card`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, { siswaId }) => [
        { type: "Student", id: siswaId },
        { type: "Student", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateStudentMutation,
  useBulkImportStudentsMutation,
  useListStudentsQuery,
  useLazyListStudentsQuery,
  useGetStudentQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useSetStudentCardMutation,
} = studentsApi;
