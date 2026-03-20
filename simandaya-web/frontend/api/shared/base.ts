import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "@/store";
import { logout, setCredentials } from "@/store/slices/auth";

const API_BASE = "/api/v1";

function getTokenExpirationMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp || typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const expMs = getTokenExpirationMs(token);
  if (expMs === null) return false;
  return expMs <= Date.now();
}

async function tryRefreshToken(api: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) return false;

    const payload = await response.json();
    if (!payload?.access_token || !payload?.user) return false;

    api.dispatch(setCredentials({ token: payload.access_token, user: payload.user }));
    return true;
  } catch {
    return false;
  }
}

export function createBaseQuery(path: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const baseQuery = fetchBaseQuery({
    baseUrl: `${API_BASE}${path}`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const tokenBefore = (api.getState() as RootState).auth.token;
    if (tokenBefore && isTokenExpired(tokenBefore)) {
      const refreshed = await tryRefreshToken(api);
      if (!refreshed) {
        api.dispatch(logout());
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }
    }

    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
      const refreshed = await tryRefreshToken(api);
      if (refreshed) {
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }
    }

    return result;
  };
}
