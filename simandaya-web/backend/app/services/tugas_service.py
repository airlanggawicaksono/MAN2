from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
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
from app.repositoriy.tugas_repository import TugasRepository


class TugasService:
    def __init__(
        self,
        db: AsyncSession,
        repo: TugasRepository | None = None,
        policy: type[TugasPolicy] = TugasPolicy,
    ):
        self.repo = repo or TugasRepository(db)
        self.policy = policy

    def _to_dto(self, tugas: Tugas) -> TugasResponseDTO:
        return TugasResponseDTO(
            tugas_id=tugas.tugas_id,
            semester_id=tugas.semester_id,
            kelas_id=tugas.kelas_id,
            mapel_id=tugas.mapel_id,
            created_by=tugas.created_by,
            jenis=tugas.jenis,
            judul=tugas.judul,
            deskripsi=tugas.deskripsi,
            link_tugas=tugas.link_tugas,
            deadline=tugas.deadline,
            created_at=tugas.created_at,
        )

    def _to_submission_dto(self, submission: TugasSubmission) -> TugasSubmissionResponseDTO:
        return TugasSubmissionResponseDTO(
            submission_id=submission.submission_id,
            tugas_id=submission.tugas_id,
            user_id=submission.user_id,
            submission_link=submission.submission_link,
            jawaban_text=submission.jawaban_text,
            submitted_at=submission.submitted_at,
            updated_at=submission.updated_at,
        )

    async def create_tugas(
        self, request: CreateTugasDTO, current_user: User
    ) -> TugasResponseDTO:
        try:
            semester = await self.repo.find_semester_by_id(request.semester_id)
            self.policy.ensure_entity_exists(semester, "Semester", request.semester_id)

            kelas = await self.repo.find_kelas_by_id(request.kelas_id)
            self.policy.ensure_entity_exists(kelas, "Kelas", request.kelas_id)

            mapel = await self.repo.find_mapel_by_id(request.mapel_id)
            self.policy.ensure_entity_exists(mapel, "Mata pelajaran", request.mapel_id)

            if current_user.user_type == UserType.guru:
                assignment = await self.repo.find_guru_mapel_assignment(
                    current_user.user_id, request.kelas_id, request.mapel_id
                )
                self.policy.ensure_guru_assigned(assignment)

            self.policy.ensure_valid_submission_link(request.link_tugas)

            tugas = Tugas(
                semester_id=request.semester_id,
                kelas_id=request.kelas_id,
                mapel_id=request.mapel_id,
                created_by=current_user.user_id,
                jenis=request.jenis,
                judul=request.judul,
                deskripsi=request.deskripsi,
                link_tugas=request.link_tugas,
                deadline=request.deadline,
            )

            await self.repo.add_tugas(tugas)
            await self.repo.commit()
            await self.repo.refresh(tugas)
            return self._to_dto(tugas)

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create tugas: {str(e)}",
            )

    async def get_tugas(self, tugas_id: UUID) -> TugasResponseDTO:
        tugas = await self.repo.find_tugas_by_id(tugas_id)
        self.policy.ensure_tugas_exists(tugas, tugas_id)
        return self._to_dto(tugas)

    async def list_tugas_by_kelas(
        self,
        kelas_id: UUID,
        semester_id: UUID,
        mapel_id: Optional[UUID] = None,
    ) -> list[TugasResponseDTO]:
        tugas_list = await self.repo.list_tugas_by_filters(
            kelas_id=kelas_id, semester_id=semester_id, mapel_id=mapel_id
        )
        return [self._to_dto(t) for t in tugas_list]

    async def list_tugas_my_class(
        self, current_user: User, semester_id: UUID
    ) -> list[TugasResponseDTO]:
        kelas_id = await self.repo.find_student_kelas_for_semester(
            current_user.user_id, semester_id
        )
        self.policy.ensure_student_has_kelas(kelas_id)
        return await self.list_tugas_by_kelas(kelas_id, semester_id)

    async def update_tugas(
        self, tugas_id: UUID, request: UpdateTugasDTO, current_user: User
    ) -> TugasResponseDTO:
        try:
            tugas = await self.repo.find_tugas_by_id(tugas_id)
            self.policy.ensure_tugas_exists(tugas, tugas_id)
            self.policy.ensure_can_modify(current_user, tugas.created_by)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)

            if "link_tugas" in update_data:
                self.policy.ensure_valid_submission_link(update_data.get("link_tugas"))

            for field, value in update_data.items():
                setattr(tugas, field, value)

            await self.repo.commit()
            await self.repo.refresh(tugas)
            return self._to_dto(tugas)

        except HTTPException:
            raise
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
            self.policy.ensure_can_modify(current_user, tugas.created_by)

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

            student_kelas_id = await self.repo.find_student_kelas_for_semester(
                current_user.user_id, tugas.semester_id
            )
            self.policy.ensure_student_has_kelas(student_kelas_id)
            self.policy.ensure_student_in_tugas_kelas(student_kelas_id, tugas.kelas_id)

            self.policy.ensure_submission_payload(
                request.submission_link, request.jawaban_text
            )
            self.policy.ensure_valid_submission_link(request.submission_link)

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

            return self._to_submission_dto(submission)

        except HTTPException:
            raise
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
            self.policy.ensure_valid_submission_link(new_link)

            for field, value in update_data.items():
                setattr(submission, field, value)

            await self.repo.commit()
            await self.repo.refresh(submission)
            return self._to_submission_dto(submission)

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update submission: {str(e)}",
            )
