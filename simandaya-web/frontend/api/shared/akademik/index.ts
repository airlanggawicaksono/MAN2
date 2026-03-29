export { akademikBaseApi as akademikApi } from "./base";

export {
  useListKategoriKelasQuery,
  useCreateKategoriKelasMutation,
  useUpdateKategoriKelasMutation,
  useDeleteKategoriKelasMutation,
} from "./kategori-kelas.api";

export {
  useListMapelQuery,
  useCreateMapelMutation,
  useUpdateMapelMutation,
  useDeleteMapelMutation,
} from "./mapel.api";

export {
  useListKelasQuery,
  useListActiveKelasQuery,
  useCreateKelasMutation,
  useUpdateKelasMutation,
  useDeleteKelasMutation,
  useListKelasByTahunAjaranQuery,
  useListSiswaInKelasQuery,
  useAssignSiswaToKelasMutation,
  useRemoveSiswaFromKelasMutation,
} from "./kelas.api";

export {
  useListGuruMapelQuery,
  useListActiveGuruMapelQuery,
  useGetMyGuruAcademicContextQuery,
  useCreateGuruMapelMutation,
  useUpdateGuruMapelMutation,
  useDeleteGuruMapelMutation,
} from "./guru-mapel.api";

export {
  useListJadwalByKelasQuery,
  useCreateJadwalMutation,
  useUpdateJadwalMutation,
  useDeleteJadwalMutation,
  useGetMyJadwalQuery,
} from "./jadwal.api";

export {
  useListSlotWaktuQuery,
  useCreateSlotWaktuMutation,
} from "./slot-waktu.api";

export {
  useListTahunAjaranQuery,
  useCreateTahunAjaranMutation,
  useCopyTahunAjaranStructureMutation,
  useUpdateTahunAjaranMutation,
  useDeleteTahunAjaranMutation,
} from "./tahun-ajaran.api";

export {
  useListSemestersQuery,
  useListActiveSemestersQuery,
  useListMySemesterTimelineQuery,
  useCreateSemesterMutation,
  useCopySemesterStructureMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
} from "./semester.api";

export {
  useListKurikulumByTahunAjaranQuery,
  useListKurikulumByTingkatQuery,
  useCreateKurikulumMapelMutation,
  useBulkAssignKurikulumMutation,
  useUpdateKurikulumMapelMutation,
  useDeleteKurikulumMapelMutation,
} from "./kurikulum.api";
