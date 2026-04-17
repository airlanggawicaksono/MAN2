import type {
  CopySemesterStructureRequest,
  CopySemesterStructureResponse,
  CreateSemesterRequest,
  SemesterResponse,
  StudentSemesterTimelineItem,
  UpdateSemesterRequest,
} from "@/types/akademik/periode";
import type { MessageResponse, UUID } from "@/types/common";
import { akademikBaseApi } from "./base";

export const semesterApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSemesters: builder.query<SemesterResponse[], void>({
      query: () => "/semester",
      providesTags: ["Semester"],
    }),
    listActiveSemesters: builder.query<SemesterResponse[], void>({
      query: () => "/semester/active",
      providesTags: ["Semester"],
    }),
    listMySemesterTimeline: builder.query<StudentSemesterTimelineItem[], void>({
      query: () => "/semester/my-timeline",
      providesTags: ["Semester"],
    }),
    createSemester: builder.mutation<SemesterResponse, CreateSemesterRequest>({
      query: (body) => ({ url: "/semester", method: "POST", body }),
      invalidatesTags: ["Semester"],
    }),
    copySemesterStructure: builder.mutation<CopySemesterStructureResponse, CopySemesterStructureRequest>({
      query: (body) => ({ url: "/semester/copy-structure", method: "POST", body }),
      invalidatesTags: ["Semester", "Jadwal"],
    }),
    updateSemester: builder.mutation<SemesterResponse, { id: UUID; body: UpdateSemesterRequest }>({
      query: ({ id, body }) => ({ url: `/semester/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["Semester", { type: "Semester", id }],
    }),
    deleteSemester: builder.mutation<MessageResponse, UUID>({
      query: (id) => ({ url: `/semester/${id}`, method: "DELETE" }),
      invalidatesTags: ["Semester"],
    }),
  }),
});

export const {
  useListSemestersQuery,
  useListActiveSemestersQuery,
  useListMySemesterTimelineQuery,
  useCreateSemesterMutation,
  useCopySemesterStructureMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
} = semesterApi;
