import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "@/api/shared/base";
import type { User, LoginRequest, TokenResponse } from "@/types/auth";
import type { MessageResponse } from "@/types/common";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createBaseQuery("/auth"),
  endpoints: (builder) => ({
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
      }),
    }),
    verify: builder.query<User, void>({
      query: () => "/verify",
    }),
    logout: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyQuery,
  useLogoutMutation,
} = authApi;
