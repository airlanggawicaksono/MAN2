import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  StudentLookupResponse,
  TeacherLookupResponse,
  ClaimStudentRequest,
  ClaimTeacherRequest,
  ClaimResponse,
} from "@/types/registration";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const registrationApi = createApi({
  reducerPath: "registrationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/api/v1/registration`,
  }),
  endpoints: (builder) => ({
    lookupStudentByNis: builder.query<StudentLookupResponse, string>({
      query: (nis) => `/students/lookup?nis=${encodeURIComponent(nis)}`,
    }),
    lookupTeacherByNip: builder.query<TeacherLookupResponse, string>({
      query: (nip) => `/teachers/lookup?nip=${encodeURIComponent(nip)}`,
    }),
    claimStudent: builder.mutation<ClaimResponse, ClaimStudentRequest>({
      query: (body) => ({
        url: "/students/claim",
        method: "POST",
        body,
      }),
    }),
    claimTeacher: builder.mutation<ClaimResponse, ClaimTeacherRequest>({
      query: (body) => ({
        url: "/teachers/claim",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLazyLookupStudentByNisQuery,
  useLazyLookupTeacherByNipQuery,
  useClaimStudentMutation,
  useClaimTeacherMutation,
} = registrationApi;
