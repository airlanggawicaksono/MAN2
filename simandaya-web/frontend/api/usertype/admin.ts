export {
  studentsApi,
  useListStudentsQuery,
  useGetStudentQuery,
  usePreRegisterStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from "@/api/students";

export {
  teachersApi,
  useListTeachersQuery,
  useGetTeacherQuery,
  usePreRegisterTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} from "@/api/teachers";

export { usermanApi, useGetStructuralRolesQuery } from "@/api/userman";

export {
  akademikApi,
  useListMapelQuery,
  useGetMapelQuery,
  useCreateMapelMutation,
  useUpdateMapelMutation,
  useDeleteMapelMutation,
  useListKelasQuery,
  useGetKelasQuery,
  useCreateKelasMutation,
  useUpdateKelasMutation,
  useDeleteKelasMutation,
  useListKelasByTahunAjaranQuery,
  useListSiswaInKelasQuery,
  useAssignSiswaToKelasMutation,
  useRemoveSiswaFromKelasMutation,
  usePromoteStudentsMutation,
  useListGuruMapelQuery,
  useCreateGuruMapelMutation,
  useDeleteGuruMapelMutation,
  useListJadwalByKelasQuery,
  useListJadwalByGuruQuery,
  useCreateJadwalMutation,
  useUpdateJadwalMutation,
  useDeleteJadwalMutation,
  useListTahunAjaranQuery,
  useCreateTahunAjaranMutation,
  useUpdateTahunAjaranMutation,
  useDeleteTahunAjaranMutation,
  useListSemestersQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useListKurikulumByTahunAjaranQuery,
  useListKurikulumByTingkatQuery,
  useCreateKurikulumMapelMutation,
  useBulkAssignKurikulumMutation,
  useUpdateKurikulumMapelMutation,
  useDeleteKurikulumMapelMutation,
} from "@/api/akademik";

export {
  absensiApi,
  useListAllIzinKeluarQuery,
  useGetIzinKeluarQuery,
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
} from "@/api/absensi";

export {
  cmsApi,
  useListSlidesQuery,
  useCreateSlideMutation,
  useUpdateSlideMutation,
  useDeleteSlideMutation,
  useUploadImageMutation,
} from "@/api/setContentManagement";
