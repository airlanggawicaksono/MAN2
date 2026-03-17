from fastapi import HTTPException, status


class UserManagementPolicy:
    @staticmethod
    def ensure_student_exists(profile, detail: str = "Student not found") -> None:
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    @staticmethod
    def ensure_teacher_exists(profile, detail: str = "Teacher not found") -> None:
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_nis_available(is_taken: bool, nis: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"NIS '{nis}' already exists",
            )

    @staticmethod
    def ensure_nip_available(is_taken: bool, nip: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"NIP '{nip}' already exists",
            )
