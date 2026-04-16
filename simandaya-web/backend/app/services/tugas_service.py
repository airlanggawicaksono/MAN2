from typing import Optional
from datetime import datetime, timezone
from uuid import UUID
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.penilaian.tugas_dto import (
    CreateTugasDTO,
    CreateTugasSubmissionDTO,
    MessageResponseDTO,
    TugasResponseDTO,
    TugasSubmissionResponseDTO,
    UpdateTugasDTO,
    UpdateTugasSubmissionDTO,
)
from app.enums import UserType
from app.models.tugas import Tugas
from app.models.tugas_submission import TugasSubmission
from app.models.user import User
from app.policy.tugas_policy import TugasPolicy
from app.repositoriy.student_semester_repository import StudentSemesterRepository
from app.repositoriy.tugas_repository import TugasRepository
from app.utils.db_error_utils import build_integrity_http_exception


TUGAS_INTEGRITY_MESSAGES = {
    "uq_tugas_submission": "Siswa sudah memiliki status pengumpulan untuk tugas ini.",
}


class TugasService:
    def __init__(
        self,
        db: AsyncSession,
        repo: TugasRepository | None = None,
        policy: type[TugasPolicy] = TugasPolicy,
    ):
        self.repo = repo or TugasRepository(db)
        self.student_semester_repo = StudentSemesterRepository(db)
        self.policy = policy

    async def _to_dto(
        self,
        tugas: Tugas,
        guru_name_cache: dict[tuple[UUID, UUID], str | None] | None = None,
    ) -> TugasResponseDTO:
        cache_key = (tugas.kelas_id, tugas.mapel_id)
        if guru_name_cache is not None and cache_key in guru_name_cache:
            guru_name = guru_name_cache[cache_key]
        else:
            guru_name = await self.repo.find_guru_pengajar_name(tugas.kelas_id, tugas.mapel_id)
            if guru_name_cache is not None:
                guru_name_cache[cache_key] = guru_name

        return TugasResponseDTO(
            tugas_id=tugas.tugas_id,
            semester_id=tugas.semester_id,
            kelas_id=tugas.kelas_id,
            mapel_id=tugas.mapel_id,
            created_by=tugas.created_by,
            jenis=tugas.jenis,
            judul=tugas.judul,
            deskripsi=tugas.deskripsi,
            kelas_nama=getattr(tugas.kelas, "nama_kelas", None),
            mapel_nama=getattr(tugas.mapel, "nama_mapel", None),
            guru_pengajar=guru_name,
            link_tugas=tugas.link_tugas,
            link_submission=tugas.link_submission,
            is_archived_context=tugas.is_archived_context,
            is_published_to_students=tugas.is_published_to_students,
            is_nilai_published_to_students=tugas.is_nilai_published_to_students,
            deadline=tugas.deadline,
            created_at=tugas.created_at,
        )

    def _to_submission_dto(
        self,
        submission: TugasSubmission,
        deadline: datetime | None = None,
    ) -> TugasSubmissionResponseDTO:
        profile = getattr(submission.user, "siswa_profile", None) if submission.user else None
        deadline_utc = None
        if deadline:
            deadline_utc = deadline if deadline.tzinfo else deadline.replace(tzinfo=timezone.utc)
        submitted_utc = (
            submission.submitted_at
            if submission.submitted_at.tzinfo
            else submission.submitted_at.replace(tzinfo=timezone.utc)
        )
        return TugasSubmissionResponseDTO(
            submission_id=submission.submission_id,
            tugas_id=submission.tugas_id,
            user_id=submission.user_id,
            student_name=getattr(profile, "nama_lengkap", None),
            student_nis=getattr(profile, "nis", None),
            submission_link=submission.submission_link,
            jawaban_text=submission.jawaban_text,
            is_late=bool(deadline_utc and submitted_utc > deadline_utc),
            submitted_at=submission.submitted_at,
            updated_at=submission.updated_at,
        )

    def _normalize_tugas_links(
        self,
        link_tugas: str | None,
        link_submission: str | None,
    ) -> tuple[str | None, str | None]:
        link_tugas = self._normalize_url(link_tugas)
        link_submission = self._normalize_url(link_submission)
        # Be forgiving: if teacher pastes Google Form in link_tugas by mistake,
        # move it to link_submission automatically.
        if self.policy.is_google_form_url(link_tugas):
            if not link_submission:
                return None, link_tugas
            return None, link_submission
        return link_tugas, link_submission

    @staticmethod
    def _normalize_url(link: str | None) -> str | None:
        if not link:
            return None
        value = link.strip()
        if not value:
            return None

        parsed = urlparse(value)
        if not parsed.scheme and parsed.netloc:
            return f"https://{parsed.netloc}{parsed.path or ''}{f'?{parsed.query}' if parsed.query else ''}{f'#{parsed.fragment}' if parsed.fragment else ''}"
        if not parsed.scheme and not parsed.netloc:
            return f"https://{value}"
        return value

    async def create_tugas(
        self, request: CreateTugasDTO, current_user: User
    ) -> TugasResponseDTO:
        try:
            semester = await self.repo.find_semester_by_id(request.semester_id)
            self.policy.ensure_entity_exists(semester, "Semester", request.semester_id)

            kelas = await self.repo.find_kelas_by_id(request.kelas_id)
            self.policy.ensure_entity_exists(kelas, "Kelas", request.kelas_id)
            self.policy.ensure_kelas_in_tahun_ajaran(kelas, semester.tahun_ajaran_id)
            self.policy.ensure_kelas_active(kelas)

            mapel = await self.repo.find_mapel_by_id(request.mapel_id)
            self.policy.ensure_entity_exists(mapel, "Mata pelajaran", request.mapel_id)
            self.policy.ensure_mapel_active(mapel)
            self.policy.ensure_mapel_in_tahun_ajaran(mapel, semester.tahun_ajaran_id)

            if current_user.user_type == UserType.guru:
                assignment = await self.repo.find_guru_mapel_assignment(
                    current_user.user_id, request.kelas_id, request.mapel_id
                )
                self.policy.ensure_guru_assigned(assignment)

            normalized_link_tugas, normalized_link_submission = self._normalize_tugas_links(
                request.link_tugas,
                request.link_submission,
            )
            self.policy.ensure_valid_reference_link(normalized_link_tugas)
            self.policy.ensure_valid_submission_form_link(normalized_link_submission)

            tugas = Tugas(
                semester_id=request.semester_id,
                kelas_id=request.kelas_id,
                mapel_id=request.mapel_id,
                created_by=current_user.user_id,
                jenis=request.jenis,
                judul=request.judul,
                deskripsi=request.deskripsi,
                link_tugas=normalized_link_tugas,
                link_submission=normalized_link_submission,
                is_archived_context=False,
                is_published_to_students=request.is_published_to_students,
                is_nilai_published_to_students=request.is_nilai_published_to_students,
                deadline=request.deadline,
            )

            await self.repo.add_tugas(tugas)
            await self.repo.commit()
            await self.repo.refresh(tugas)
            return await self._to_dto(tugas)

        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal membuat penugasan karena konflik data.",
                constraint_messages=TUGAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create tugas: {str(e)}",
            )

    async def get_tugas(self, tugas_id: UUID) -> TugasResponseDTO:
        tugas = await self.repo.find_tugas_by_id(tugas_id)
        self.policy.ensure_tugas_exists(tugas, tugas_id)
        return await self._to_dto(tugas)

    async def list_tugas_by_kelas(
        self,
        kelas_id: UUID,
        semester_id: UUID,
        mapel_id: Optional[UUID] = None,
        published_only: bool = False,
    ) -> list[TugasResponseDTO]:
        tugas_list = await self.repo.list_tugas_by_filters(
            kelas_id=kelas_id,
            semester_id=semester_id,
            mapel_id=mapel_id,
            published_only=published_only,
            include_archived_context=False,
        )
        guru_name_cache: dict[tuple[UUID, UUID], str | None] = {}
        return [await self._to_dto(t, guru_name_cache) for t in tugas_list]

    async def list_tugas_my_class(
        self, current_user: User, semester_id: UUID
    ) -> list[TugasResponseDTO]:
        is_allowed = await self.student_semester_repo.is_student_allowed_semester(
            current_user.user_id, semester_id
        )
        self.policy.ensure_student_allowed_semester(is_allowed)
        kelas_id = await self.repo.find_student_kelas_for_semester(
            current_user.user_id, semester_id
        )
        self.policy.ensure_student_has_kelas(kelas_id)
        return await self.list_tugas_by_kelas(
            kelas_id,
            semester_id,
            published_only=True,
        )

    async def update_tugas(
        self, tugas_id: UUID, request: UpdateTugasDTO, current_user: User
    ) -> TugasResponseDTO:
        try:
            tugas = await self.repo.find_tugas_by_id(tugas_id)
            self.policy.ensure_tugas_exists(tugas, tugas_id)
            self.policy.ensure_tugas_not_archived_context(tugas)
            has_assignment = False
            if current_user.user_type == UserType.guru:
                assignment = await self.repo.find_guru_mapel_assignment(
                    current_user.user_id,
                    tugas.kelas_id,
                    tugas.mapel_id,
                )
                has_assignment = assignment is not None
            self.policy.ensure_can_modify(
                current_user,
                tugas.created_by,
                has_assignment=has_assignment,
            )

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)

            incoming_link_tugas = update_data.get("link_tugas", tugas.link_tugas)
            incoming_link_submission = update_data.get("link_submission", tugas.link_submission)
            normalized_link_tugas, normalized_link_submission = self._normalize_tugas_links(
                incoming_link_tugas,
                incoming_link_submission,
            )
            update_data["link_tugas"] = normalized_link_tugas
            update_data["link_submission"] = normalized_link_submission
            self.policy.ensure_valid_reference_link(update_data.get("link_tugas"))
            self.policy.ensure_valid_submission_form_link(update_data.get("link_submission"))

            for field, value in update_data.items():
                setattr(tugas, field, value)

            await self.repo.commit()
            await self.repo.refresh(tugas)
            return await self._to_dto(tugas)

        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal memperbarui penugasan karena konflik data.",
                constraint_messages=TUGAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update tugas: {str(e)}",
            )

    async def delete_tugas(
        self, tugas_id: UUID, current_user: User
    ) -> MessageResponseDTO:
        try:
            tugas = await self.repo.find_tugas_by_id(tugas_id)
            self.policy.ensure_tugas_exists(tugas, tugas_id)
            has_assignment = False
            if current_user.user_type == UserType.guru:
                assignment = await self.repo.find_guru_mapel_assignment(
                    current_user.user_id,
                    tugas.kelas_id,
                    tugas.mapel_id,
                )
                has_assignment = assignment is not None
            self.policy.ensure_can_modify(
                current_user,
                tugas.created_by,
                has_assignment=has_assignment,
            )

            await self.repo.delete_tugas(tugas)
            await self.repo.commit()
            return MessageResponseDTO(message="Tugas deleted successfully")

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete tugas: {str(e)}",
            )

    async def create_my_submission(
        self,
        tugas_id: UUID,
        request: CreateTugasSubmissionDTO,
        current_user: User,
    ) -> TugasSubmissionResponseDTO:
        try:
            tugas = await self.repo.find_tugas_by_id(tugas_id)
            self.policy.ensure_tugas_exists(tugas, tugas_id)
            self.policy.ensure_tugas_not_archived_context(tugas)

            student_kelas_id = await self.repo.find_student_kelas_for_semester(
                current_user.user_id, tugas.semester_id
            )
            self.policy.ensure_student_has_kelas(student_kelas_id)
            self.policy.ensure_student_in_tugas_kelas(student_kelas_id, tugas.kelas_id)

            self.policy.ensure_submission_payload(
                request.submission_link, request.jawaban_text
            )
            self.policy.ensure_valid_student_submission_link(request.submission_link)

            existing = await self.repo.find_submission_by_tugas_and_user(
                tugas_id, current_user.user_id
            )
            self.policy.ensure_submission_not_exists(existing)

            submission = TugasSubmission(
                tugas_id=tugas_id,
                user_id=current_user.user_id,
                submission_link=request.submission_link,
                jawaban_text=request.jawaban_text,
            )
            await self.repo.add_submission(submission)
            await self.repo.commit()
            await self.repo.refresh(submission)

            return self._to_submission_dto(submission, tugas.deadline)

        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal menyimpan status pengumpulan karena konflik data.",
                constraint_messages=TUGAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create submission: {str(e)}",
            )

    async def update_my_submission(
        self,
        tugas_id: UUID,
        request: UpdateTugasSubmissionDTO,
        current_user: User,
    ) -> TugasSubmissionResponseDTO:
        try:
            tugas = await self.repo.find_tugas_by_id(tugas_id)
            self.policy.ensure_tugas_exists(tugas, tugas_id)
            self.policy.ensure_tugas_not_archived_context(tugas)

            student_kelas_id = await self.repo.find_student_kelas_for_semester(
                current_user.user_id, tugas.semester_id
            )
            self.policy.ensure_student_has_kelas(student_kelas_id)
            self.policy.ensure_student_in_tugas_kelas(student_kelas_id, tugas.kelas_id)

            submission = await self.repo.find_submission_by_tugas_and_user(
                tugas_id, current_user.user_id
            )
            self.policy.ensure_submission_exists(submission)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)

            new_link = update_data.get("submission_link", submission.submission_link)
            new_text = update_data.get("jawaban_text", submission.jawaban_text)
            self.policy.ensure_submission_payload(new_link, new_text)
            self.policy.ensure_valid_student_submission_link(new_link)

            for field, value in update_data.items():
                setattr(submission, field, value)

            await self.repo.commit()
            await self.repo.refresh(submission)
            return self._to_submission_dto(submission, tugas.deadline)

        except HTTPException:
            raise
        except IntegrityError as e:
            await self.repo.rollback()
            raise build_integrity_http_exception(
                e,
                default_detail="Gagal memperbarui pengumpulan karena konflik data.",
                constraint_messages=TUGAS_INTEGRITY_MESSAGES,
            ) from e
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update submission: {str(e)}",
            )

    async def get_my_submission(
        self, tugas_id: UUID, current_user: User
    ) -> TugasSubmissionResponseDTO | None:
        tugas = await self.repo.find_tugas_by_id(tugas_id)
        self.policy.ensure_tugas_exists(tugas, tugas_id)
        self.policy.ensure_tugas_not_archived_context(tugas)

        student_kelas_id = await self.repo.find_student_kelas_for_semester(
            current_user.user_id, tugas.semester_id
        )
        self.policy.ensure_student_has_kelas(student_kelas_id)
        self.policy.ensure_student_in_tugas_kelas(student_kelas_id, tugas.kelas_id)

        submission = await self.repo.find_submission_by_tugas_and_user(
            tugas_id, current_user.user_id
        )
        if not submission:
            return None
        return self._to_submission_dto(submission, tugas.deadline)

    async def list_submissions_by_tugas(
        self, tugas_id: UUID, current_user: User
    ) -> list[TugasSubmissionResponseDTO]:
        tugas = await self.repo.find_tugas_by_id(tugas_id)
        self.policy.ensure_tugas_exists(tugas, tugas_id)
        self.policy.ensure_tugas_not_archived_context(tugas)

        if current_user.user_type == UserType.guru:
            assignment = await self.repo.find_guru_mapel_assignment(
                current_user.user_id, tugas.kelas_id, tugas.mapel_id
            )
            self.policy.ensure_guru_assigned(assignment)

        submissions = await self.repo.list_submissions_by_tugas(tugas_id)
        return [self._to_submission_dto(s, tugas.deadline) for s in submissions]

    async def list_my_submissions(
        self, semester_id: UUID, current_user: User
    ) -> list[TugasSubmissionResponseDTO]:
        is_allowed = await self.student_semester_repo.is_student_allowed_semester(
            current_user.user_id, semester_id
        )
        self.policy.ensure_student_allowed_semester(is_allowed)
        submissions = await self.repo.list_submissions_by_user_and_semester(
            current_user.user_id, semester_id
        )
        result: list[TugasSubmissionResponseDTO] = []
        for submission in submissions:
            tugas = await self.repo.find_tugas_by_id(submission.tugas_id)
            result.append(self._to_submission_dto(submission, tugas.deadline if tugas else None))
        return result

    async def delete_my_submission(
        self, tugas_id: UUID, current_user: User
    ) -> MessageResponseDTO:
        try:
            tugas = await self.repo.find_tugas_by_id(tugas_id)
            self.policy.ensure_tugas_exists(tugas, tugas_id)
            self.policy.ensure_tugas_not_archived_context(tugas)

            student_kelas_id = await self.repo.find_student_kelas_for_semester(
                current_user.user_id, tugas.semester_id
            )
            self.policy.ensure_student_has_kelas(student_kelas_id)
            self.policy.ensure_student_in_tugas_kelas(student_kelas_id, tugas.kelas_id)

            submission = await self.repo.find_submission_by_tugas_and_user(
                tugas_id, current_user.user_id
            )
            self.policy.ensure_submission_exists(submission)

            await self.repo.delete_submission(submission)
            await self.repo.commit()
            return MessageResponseDTO(message="Pengumpulan tugas berhasil dibatalkan")
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete submission: {str(e)}",
            )
