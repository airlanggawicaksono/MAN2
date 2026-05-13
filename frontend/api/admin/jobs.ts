import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type { JobResponse } from "@/types/jobs";

export interface QueueImportStudentsArgs {
  idempotencyKey: string;
  rows: unknown[];
}

export interface QueueImportTeachersArgs {
  idempotencyKey: string;
  rows: unknown[];
}

export interface QueueExportStudentsArgs {
  idempotencyKey: string;
  search?: string;
  status_siswa?: "Aktif" | "Non-Aktif" | "Lulus";
}

export interface QueueExportTeachersArgs {
  idempotencyKey: string;
  search?: string;
}

export const jobsApi = createApi({
  reducerPath: "jobsApi",
  baseQuery: createBaseQuery("/jobs"),
  tagTypes: ["Job"],
  endpoints: (builder) => ({
    queueImportStudents: builder.mutation<JobResponse, QueueImportStudentsArgs>({
      query: ({ idempotencyKey, rows }) => ({
        url: "/imports/students",
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: rows,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Job", id: result.job_id }] : [],
    }),

    queueImportTeachers: builder.mutation<JobResponse, QueueImportTeachersArgs>({
      query: ({ idempotencyKey, rows }) => ({
        url: "/imports/teachers",
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: rows,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Job", id: result.job_id }] : [],
    }),

    queueExportStudents: builder.mutation<JobResponse, QueueExportStudentsArgs>({
      query: ({ idempotencyKey, search, status_siswa }) => ({
        url: "/exports/students",
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: { search, status_siswa },
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Job", id: result.job_id }] : [],
    }),

    queueExportTeachers: builder.mutation<JobResponse, QueueExportTeachersArgs>({
      query: ({ idempotencyKey, search }) => ({
        url: "/exports/teachers",
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: { search },
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Job", id: result.job_id }] : [],
    }),

    getJob: builder.query<JobResponse, string>({
      query: (jobId) => `/${jobId}`,
      providesTags: (_result, _err, jobId) => [{ type: "Job", id: jobId }],
    }),
  }),
});

export const {
  useQueueImportStudentsMutation,
  useQueueImportTeachersMutation,
  useQueueExportStudentsMutation,
  useQueueExportTeachersMutation,
  useGetJobQuery,
} = jobsApi;
