import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth";
import cmsReducer from "./slices/cms";
import absensiReducer from "./slices/absensi";
import preferencesReducer from "./slices/preferences";
import globalFiltersReducer from "./slices/globalFilters";
import activeEntityReducer from "./slices/activeEntity";
import jobsReducer from "./slices/jobs";
import { authApi } from "@/api/public/auth";
import { studentsApi } from "@/api/admin/students";
import { teachersApi } from "@/api/admin/teachers";
import { cmsApi } from "@/api/admin/setContentManagement";
import { absensiApi } from "@/api/public/absensi";
import { usermanApi } from "@/api/admin/userman";
import { jobsApi } from "@/api/admin/jobs";

const rootReducer = combineSlices(
  authApi,
  studentsApi,
  teachersApi,
  cmsApi,
  absensiApi,
  usermanApi,
  jobsApi,
  {
    auth: authReducer,
    cms: cmsReducer,
    absensi: absensiReducer,
    preferences: preferencesReducer,
    globalFilters: globalFiltersReducer,
    activeEntity: activeEntityReducer,
    jobs: jobsReducer,
  }
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
        jobsApi.middleware,
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
