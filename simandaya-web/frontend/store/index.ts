import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth";
import cmsReducer from "./slices/cms";
import absensiReducer from "./slices/absensi";
import { authApi } from "@/api/public/auth";
import { studentsApi } from "@/api/admin/students";
import { teachersApi } from "@/api/admin/teachers";
import { cmsApi } from "@/api/admin/setContentManagement";
import { absensiApi } from "@/api/public/absensi";
import { usermanApi } from "@/api/admin/userman";

const rootReducer = combineSlices(
  authApi,
  studentsApi,
  teachersApi,
  cmsApi,
  absensiApi,
  usermanApi,
  { auth: authReducer, cms: cmsReducer, absensi: absensiReducer }
);

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        studentsApi.middleware,
        teachersApi.middleware,
        cmsApi.middleware,
        absensiApi.middleware,
        usermanApi.middleware,
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
