import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "@/store";
import { logout } from "@/store/slices/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2385";

export function createBaseQuery(path: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${API_BASE}/api/v1${path}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
      api.dispatch(logout());
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }

    return result;
  };
}
