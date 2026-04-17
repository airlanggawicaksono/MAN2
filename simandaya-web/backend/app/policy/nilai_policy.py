from fastapi import HTTPException, status

from app.enums import UserType


class NilaiPolicy:
    @staticmethod
    def ensure_student_allowed_semester(is_allowed: bool) -> None:
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Semester tidak valid untuk timeline siswa ini",
            )

    @staticmethod
    def ensure_tugas_exists(tugas, tugas_id) -> None:
        if not tugas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tugas with ID {tugas_id} not found",
            )

    @staticmethod
    def ensure_nilai_exists(nilai, nilai_id) -> None:
        if not nilai:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nilai with ID {nilai_id} not found",
            )

    @staticmethod
    def ensure_can_manage_tugas_scores(current_user, tugas, has_assignment: bool) -> None:
        if current_user.user_type == UserType.admin:
            return
        if tugas.created_by == current_user.user_id:
            return
        if has_assignment:
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage scores for this tugas",
        )

    @staticmethod
    def ensure_student_exists(user, user_id) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )
        if user.user_type != UserType.siswa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user.username} is not a student",
            )

    @staticmethod
    def ensure_student_in_kelas(student_kelas, user_id) -> None:
        if not student_kelas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student {user_id} is not in this class",
            )

    @staticmethod
    def ensure_unique_nilai(existing_nilai, user_id) -> None:
        if existing_nilai:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Score already exists for student {user_id} on this tugas",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
