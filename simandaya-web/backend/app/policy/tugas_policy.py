from urllib.parse import urlparse
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.enums import UserType


class TugasPolicy:
    ALLOWED_REFERENCE_LINK_HOSTS = {
        "docs.google.com",
        "drive.google.com",
    }
    ALLOWED_SUBMISSION_FORM_HOSTS = {"docs.google.com", "forms.gle"}
    ALLOWED_STUDENT_SUBMISSION_LINK_HOSTS = {
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
    def ensure_mapel_active(mapel) -> None:
        if not mapel.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mata pelajaran '{mapel.nama_mapel}' sedang diarsipkan",
            )

    @staticmethod
    def ensure_mapel_in_tahun_ajaran(mapel, tahun_ajaran_id) -> None:
        if mapel.tahun_ajaran_id != tahun_ajaran_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mata pelajaran harus berasal dari tahun ajaran yang sama",
            )

    @staticmethod
    def ensure_kelas_in_tahun_ajaran(kelas, tahun_ajaran_id) -> None:
        if kelas.tahun_ajaran_id != tahun_ajaran_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kelas harus berasal dari tahun ajaran yang sama",
            )

    @staticmethod
    def ensure_kelas_active(kelas) -> None:
        if not kelas.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kelas '{kelas.nama_kelas}' sedang diarsipkan",
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
    def ensure_tugas_not_archived_context(tugas) -> None:
        if tugas.is_archived_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tugas berada pada konteks arsip karena mapel/kelas terkait diarsipkan",
            )

    @staticmethod
    def ensure_can_modify(current_user, created_by, has_assignment: bool = False) -> None:
        if current_user.user_type == UserType.admin:
            return
        if created_by == current_user.user_id:
            return
        if current_user.user_type == UserType.guru and has_assignment:
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only admin, creator tugas, or assigned guru-mapel can modify this tugas"
            ),
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

    @staticmethod
    def ensure_submission_deadline_open(deadline: datetime | None) -> None:
        if not deadline:
            return
        now = datetime.now(timezone.utc)
        deadline_utc = deadline if deadline.tzinfo else deadline.replace(tzinfo=timezone.utc)
        if now > deadline_utc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Waktu pengumpulan sudah lewat",
            )

    @staticmethod
    def is_google_form_url(url: str | None) -> bool:
        if not url:
            return False
        parsed = urlparse(url)
        host = (parsed.netloc or "").lower()
        path = parsed.path or ""
        if parsed.scheme != "https":
            return False
        if host == "forms.gle":
            return True
        return host == "docs.google.com" and "/forms/" in path

    @classmethod
    def ensure_valid_reference_link(cls, link_tugas: str | None) -> None:
        if not link_tugas:
            return

        parsed = urlparse(link_tugas)
        host = (parsed.netloc or "").strip().lower()

        if parsed.scheme not in {"http", "https"} or not host:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="link_tugas must be a valid URL",
            )

    @classmethod
    def ensure_valid_submission_form_link(cls, link_submission: str | None) -> None:
        if not link_submission:
            return

        parsed = urlparse(link_submission)
        host = (parsed.netloc or "").lower()
        path = parsed.path or ""

        if parsed.scheme != "https" or not host:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="link_submission must be a valid HTTPS URL",
            )

        if host not in cls.ALLOWED_SUBMISSION_FORM_HOSTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="link_submission must be a Google Form link",
            )

        if host == "docs.google.com" and "/forms/" not in path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="link_submission must be a Google Form link",
            )

    @classmethod
    def ensure_valid_student_submission_link(cls, submission_link: str | None) -> None:
        if not submission_link:
            return

        parsed = urlparse(submission_link)
        host = (parsed.netloc or "").lower()

        if parsed.scheme != "https" or not host:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="submission_link must be a valid HTTPS URL",
            )

        if host not in cls.ALLOWED_STUDENT_SUBMISSION_LINK_HOSTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="submission_link must use Google Drive or Google Forms link",
            )
