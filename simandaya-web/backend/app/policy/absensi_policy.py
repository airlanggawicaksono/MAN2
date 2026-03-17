from fastapi import HTTPException, status

from app.enums import UserType


class AbsensiPolicy:
    @staticmethod
    def ensure_user_exists(user) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    @staticmethod
    def ensure_is_siswa(user) -> None:
        if user.user_type != UserType.siswa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a student",
            )

    @staticmethod
    def ensure_absensi_exists(record) -> None:
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found",
            )

    @staticmethod
    def ensure_izin_exists(record) -> None:
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Izin keluar record not found",
            )

    @staticmethod
    def ensure_kelas_exists(kelas, kelas_id) -> None:
        if not kelas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kelas with ID {kelas_id} not found",
            )

    @staticmethod
    def ensure_bulk_permission(current_user, kelas, is_teacher: bool) -> None:
        if current_user.user_type == UserType.admin:
            return

        is_wali = kelas.wali_kelas_id == current_user.user_id
        if not is_wali and not is_teacher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to mark attendance for this class",
            )

    @staticmethod
    def ensure_student_in_kelas(student_user_id, valid_student_ids: set) -> None:
        if student_user_id not in valid_student_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student {student_user_id} is not in this class",
            )
