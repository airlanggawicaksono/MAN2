from uuid import UUID

from fastapi import HTTPException, status

from app.enums import UserType
from app.models.user import User


class DesktopPolicy:
    @staticmethod
    def ensure_active_student(user: User | None, user_id: UUID) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )
        if user.user_type != UserType.siswa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not a student",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not active",
            )

    @staticmethod
    def ensure_izin_has_reason(reason: str | None) -> None:
        if not reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reason is required for izin event",
            )
