import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth";
import cmsReducer from "./slices/cms";
import absensiReducer from "./slices/absensi";
import { authApi } from "@/api/auth";
import { studentsApi } from "@/api/students";
import { teachersApi } from "@/api/teachers";
import { registrationApi } from "@/api/registration";
import { cmsApi } from "@/api/setContentManagement";
import { absensiApi } from "@/api/absensi";
import { usermanApi } from "@/api/userman";

const rootReducer = combineSlices(
  authApi,
  studentsApi,
  teachersApi,
  registrationApi,
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
        registrationApi.middleware,
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
