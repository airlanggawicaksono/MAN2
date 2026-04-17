from typing import Optional
from app.models.user import User
from ..enums import UserType, idType


from fastapi import HTTPException, status
from app.enums import RegistrationStatus
from app.models.user import User


class RegistrationPolicy:
    @staticmethod
    def ensure_student_profile_exists(profile) -> None:
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NIS tidak ditemukan",
            )

    @staticmethod
    def ensure_teacher_profile_exists(profile) -> None:
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NIP tidak ditemukan",
            )

    @staticmethod
    def ensure_pending_student(user: User) -> None:
        if user.registration_status != RegistrationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Akun dengan NIS ini sudah terdaftar",
            )

    @staticmethod
    def ensure_pending_teacher(user: User) -> None:
        if user.registration_status != RegistrationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Akun dengan NIP ini sudah terdaftar",
            )

    @staticmethod
    def ensure_username_available(is_taken: bool, username: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{username}' sudah digunakan",
            )

    @staticmethod
    def ensure_nis_available(is_taken: bool, nis: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"NIS '{nis}' sudah digunakan",
            )

    @staticmethod
    def ensure_nip_available(is_taken: bool, nip: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"NIP '{nip}' sudah digunakan",
            )
