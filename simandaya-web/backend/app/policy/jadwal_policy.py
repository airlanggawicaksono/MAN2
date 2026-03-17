from fastapi import HTTPException, status

from app.enums import UserType


class JadwalPolicy:
    @staticmethod
    def ensure_user_exists(user, user_id) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

    @staticmethod
    def ensure_user_is_guru(user, user_id) -> None:
        if user.user_type != UserType.guru:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not a guru",
            )

    @staticmethod
    def ensure_entity_exists(entity, label: str, entity_id) -> None:
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{label} with ID {entity_id} not found",
            )

    @staticmethod
    def ensure_guru_mapel_unique(existing_assignment) -> None:
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This guru-mapel-kelas-tahun assignment already exists",
            )

    @staticmethod
    def ensure_guru_mapel_exists(guru_mapel, guru_mapel_id) -> None:
        if not guru_mapel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GuruMapel with ID {guru_mapel_id} not found",
            )

    @staticmethod
    def ensure_class_slot_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class already has a lesson at this time slot",
            )

    @staticmethod
    def ensure_teacher_slot_available(clash) -> None:
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher already has a lesson at this time slot",
            )

    @staticmethod
    def ensure_jadwal_exists(jadwal, jadwal_id) -> None:
        if not jadwal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jadwal with ID {jadwal_id} not found",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_student_has_kelas(kelas_id) -> None:
        if not kelas_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not assigned to any class",
            )
