export { useGetMyTeacherProfileQuery } from "@/api/teachers";

export {
  useListMyGuruMapelQuery,
  useGetMyJadwalQuery,
  useListKelasQuery,
  useListSiswaInKelasQuery,
  useListSemestersQuery,
} from "@/api/akademik";

export {
  useListTugasByKelasQuery,
  useGetTugasQuery,
  useCreateTugasMutation,
  useUpdateTugasMutation,
  useDeleteTugasMutation,
  useListNilaiByTugasQuery,
  useCreateNilaiMutation,
  useBulkCreateNilaiMutation,
  useUpdateNilaiMutation,
  useListRaporByKelasQuery,
  useGenerateRaporMutation,
  usePublishRaporMutation,
  usePublishAllRaporMutation,
} from "@/api/penilaian";
