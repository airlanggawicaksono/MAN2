import type { AppDispatch } from "@/store";
import { authApi } from "@/api/public/auth";
import { studentsApi } from "@/api/admin/students";
import { teachersApi } from "@/api/admin/teachers";
import { registrationApi } from "@/api/public/registration";
import { cmsApi } from "@/api/admin/setContentManagement";
import { absensiApi } from "@/api/public/absensi";
import { usermanApi } from "@/api/admin/userman";
import { akademikApi } from "@/api/shared/akademik";
import { penilaianApi } from "@/api/shared/penilaian";

export function resetAllApiState(dispatch: AppDispatch): void {
  dispatch(authApi.util.resetApiState());
  dispatch(studentsApi.util.resetApiState());
  dispatch(teachersApi.util.resetApiState());
  dispatch(registrationApi.util.resetApiState());
  dispatch(cmsApi.util.resetApiState());
  dispatch(absensiApi.util.resetApiState());
  dispatch(usermanApi.util.resetApiState());
  dispatch(akademikApi.util.resetApiState());
  dispatch(penilaianApi.util.resetApiState());
}
