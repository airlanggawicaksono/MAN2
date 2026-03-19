import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/auth';

export type { User };

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

function getTokenExpirationMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp || typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

const loadAuthFromStorage = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
    };
  }

  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const tokenExpiration = token ? getTokenExpirationMs(token) : null;
    const isExpired = tokenExpiration !== null && tokenExpiration <= Date.now();

    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      deleteCookie('user_type');
      return {
        token: null,
        user: null,
        isAuthenticated: false,
      };
    }

    // Re-sync cookie on load
    if (user?.user_type) {
      setCookie('user_type', user.user_type, 7);
    }

    return {
      token,
      user,
      isAuthenticated: !!token && !!user,
    };
  } catch (error) {
    console.error('Error loading auth from storage:', error);
    return {
      token: null,
      user: null,
      isAuthenticated: false,
    };
  }
};

const initialState: AuthState = loadAuthFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        setCookie('user_type', action.payload.user.user_type, 7);
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        deleteCookie('user_type');
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
