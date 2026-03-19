export {
  useLoginMutation,
  useLogoutMutation,
  useVerifyQuery,
} from "@/api/auth";

export {
  useLazyLookupStudentByNisQuery,
  useLazyLookupTeacherByNipQuery,
  useClaimStudentMutation,
  useClaimTeacherMutation,
} from "@/api/registration";

export {
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
} from "@/api/absensi";

export { useListPublicCivitasQuery } from "@/api/userman";
