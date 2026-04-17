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

    @staticmethod
    def ensure_user_exists(user, detail: str = "User not found") -> None:
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    @staticmethod
    def ensure_structural_role_ref_exists(role, detail: str = "Structural role not found") -> None:
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    @staticmethod
    def ensure_structural_role_ref_code_available(is_taken: bool, code: str) -> None:
        if is_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Structural role code '{code}' already exists",
            )

    @staticmethod
    def ensure_assignment_exists(assignment, detail: str = "Assignment not found") -> None:
        if not assignment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    @staticmethod
    def ensure_structural_role_not_taken(assignment, role_name: str) -> None:
        if assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Jabatan '{role_name}' sudah diisi guru lain",
            )

    @staticmethod
    def ensure_kelas_exists(kelas, detail: str = "Kelas not found") -> None:
        if not kelas:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    @staticmethod
    def ensure_kelas_wali_not_taken(kelas, user_id) -> None:
        if kelas and kelas.wali_kelas_id and kelas.wali_kelas_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kelas tersebut sudah memiliki wali kelas lain",
            )

    @staticmethod
    def ensure_kelas_id_only_for_wali_kelas(is_wali_kelas: bool, kelas_id) -> None:
        if kelas_id is not None and not is_wali_kelas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="kelas_id hanya boleh diisi untuk jabatan Wali Kelas",
            )
