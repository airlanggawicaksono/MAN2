from urllib.parse import urlparse

from fastapi import HTTPException, status

from app.enums import UserType


class TugasPolicy:
    ALLOWED_LINK_HOSTS = {
        "docs.google.com",
        "drive.google.com",
        "forms.gle",
    }

    @staticmethod
    def ensure_entity_exists(entity, label: str, entity_id) -> None:
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{label} with ID {entity_id} not found",
            )

    @staticmethod
    def ensure_guru_assigned(assignment) -> None:
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to teach this subject in this class",
            )

    @staticmethod
    def ensure_student_has_kelas(kelas_id) -> None:
        if not kelas_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student is not assigned to any class for this semester",
            )

    @staticmethod
    def ensure_tugas_exists(tugas, tugas_id) -> None:
        if not tugas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tugas with ID {tugas_id} not found",
            )

    @staticmethod
    def ensure_can_modify(current_user, created_by) -> None:
        if current_user.user_type != UserType.admin and created_by != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the creator or admin can modify this tugas",
            )

    @staticmethod
    def ensure_update_payload(update_data: dict) -> None:
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

    @staticmethod
    def ensure_submission_payload(
        submission_link: str | None, jawaban_text: str | None
    ) -> None:
        if not submission_link and not jawaban_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one of submission_link or jawaban_text is required",
            )

    @staticmethod
    def ensure_submission_not_exists(existing_submission) -> None:
        if existing_submission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Submission already exists for this tugas",
            )

    @staticmethod
    def ensure_submission_exists(existing_submission) -> None:
        if not existing_submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found for this tugas",
            )

    @staticmethod
    def ensure_student_in_tugas_kelas(student_kelas_id, tugas_kelas_id) -> None:
        if student_kelas_id != tugas_kelas_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this tugas class",
            )

    @classmethod
    def ensure_valid_submission_link(cls, link_tugas: str | None) -> None:
        if not link_tugas:
            return

        parsed = urlparse(link_tugas)
        host = (parsed.netloc or "").lower()

        if parsed.scheme != "https" or not host:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="link_tugas must be a valid HTTPS URL",
            )

        if host not in cls.ALLOWED_LINK_HOSTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="link_tugas must use Google Drive or Google Forms link",
            )
