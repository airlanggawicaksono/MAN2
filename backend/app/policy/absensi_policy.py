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
    def ensure_bulk_permission(current_user) -> None:
        if current_user.user_type != UserType.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can perform bulk attendance marking",
            )

    @staticmethod
    def ensure_student_in_kelas(student_user_id, valid_student_ids: set) -> None:
        if student_user_id not in valid_student_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student {student_user_id} is not in this class",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
