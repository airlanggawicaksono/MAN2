from fastapi import HTTPException, status
from app.enums import RegistrationStatus


class AuthPolicy:
    @staticmethod
    def ensure_username_available(is_taken: bool, username: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{username}' is already taken",
            )

    @staticmethod
    def ensure_valid_credentials(user, password: str) -> None:
        if not user or not user.verify_password(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

    @staticmethod
    def ensure_user_active(user) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )

    @staticmethod
    def ensure_registration_completed(user) -> None:
        if user.registration_status == RegistrationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registrasi belum selesai. Silakan lengkapi pendaftaran.",
            )

    @staticmethod
    def ensure_valid_token_payload(payload) -> None:
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

    @staticmethod
    def ensure_user_exists(user) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
