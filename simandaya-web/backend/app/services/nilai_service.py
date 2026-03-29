from collections import defaultdict
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.penilaian.nilai_dto import (
    BulkCreateNilaiDTO,
    BulkNilaiResponseDTO,
    CreateNilaiDTO,
    MessageResponseDTO,
    NilaiByMapelDTO,
    NilaiResponseDTO,
    UpdateNilaiDTO,
)
from app.models.nilai import Nilai
from app.models.mata_pelajaran import MataPelajaran
from app.models.tugas import Tugas
from app.models.user import User
from app.policy.nilai_policy import NilaiPolicy
from app.repositoriy.student_semester_repository import StudentSemesterRepository
from app.repositoriy.nilai_repository import NilaiRepository


class NilaiService:
    def __init__(
        self,
        db: AsyncSession,
        repo: NilaiRepository | None = None,
        policy: type[NilaiPolicy] = NilaiPolicy,
    ):
        self.repo = repo or NilaiRepository(db)
        self.student_semester_repo = StudentSemesterRepository(db)
        self.policy = policy

    def _to_dto(
        self,
        nilai: Nilai,
        tugas: Tugas | None = None,
        mapel: MataPelajaran | None = None,
    ) -> NilaiResponseDTO:
        return NilaiResponseDTO(
            nilai_id=nilai.nilai_id,
            tugas_id=nilai.tugas_id,
            user_id=nilai.user_id,
            nilai=float(nilai.nilai),
            is_nilai_published_to_students=tugas.is_nilai_published_to_students if tugas else True,
            catatan=nilai.catatan,
            mapel_id=mapel.mapel_id if mapel else None,
            mapel_nama=mapel.nama_mapel if mapel else None,
            tugas_judul=tugas.judul if tugas else None,
            tugas_jenis=tugas.jenis if tugas else None,
        )

    async def _get_tugas_or_404(self, tugas_id: UUID):
        tugas = await self.repo.find_tugas_by_id(tugas_id)
        self.policy.ensure_tugas_exists(tugas, tugas_id)
        return tugas

    async def _ensure_teacher_permission(self, current_user: User, tugas) -> None:
        assignment = await self.repo.find_guru_assignment(
            current_user.user_id, tugas.kelas_id, tugas.mapel_id
        )
        self.policy.ensure_can_manage_tugas_scores(
            current_user=current_user,
            tugas=tugas,
            has_assignment=assignment is not None,
        )

    async def _ensure_student_in_tugas_class(self, user_id: UUID, kelas_id: UUID) -> None:
        user = await self.repo.find_user_by_id(user_id)
        self.policy.ensure_student_exists(user, user_id)
        student_kelas = await self.repo.find_student_in_kelas(user_id, kelas_id)
        self.policy.ensure_student_in_kelas(student_kelas, user_id)

    async def create_nilai(
        self, tugas_id: UUID, request: CreateNilaiDTO, current_user: User
    ) -> NilaiResponseDTO:
        try:
            tugas = await self._get_tugas_or_404(tugas_id)
            await self._ensure_teacher_permission(current_user, tugas)
            await self._ensure_student_in_tugas_class(request.user_id, tugas.kelas_id)

            existing = await self.repo.find_nilai_by_tugas_and_user(tugas_id, request.user_id)
            self.policy.ensure_unique_nilai(existing, request.user_id)

            nilai = Nilai(
                tugas_id=tugas_id,
                user_id=request.user_id,
                nilai=request.nilai,
                catatan=request.catatan,
            )
            await self.repo.add_nilai(nilai)
            await self.repo.commit()
            await self.repo.refresh(nilai)
            return self._to_dto(nilai)

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create nilai: {str(e)}",
            )

    async def bulk_create_nilai(
        self, tugas_id: UUID, request: BulkCreateNilaiDTO, current_user: User
    ) -> BulkNilaiResponseDTO:
        try:
            tugas = await self._get_tugas_or_404(tugas_id)
            await self._ensure_teacher_permission(current_user, tugas)

            created = 0
            updated = 0

            for entry in request.entries:
                await self._ensure_student_in_tugas_class(entry.user_id, tugas.kelas_id)
                existing = await self.repo.find_nilai_by_tugas_and_user(tugas_id, entry.user_id)
                if existing:
                    existing.nilai = entry.nilai
                    existing.catatan = entry.catatan
                    updated += 1
                else:
                    nilai = Nilai(
                        tugas_id=tugas_id,
                        user_id=entry.user_id,
                        nilai=entry.nilai,
                        catatan=entry.catatan,
                    )
                    await self.repo.add_nilai(nilai)
                    created += 1

            await self.repo.commit()
            return BulkNilaiResponseDTO(
                created_count=created,
                updated_count=updated,
                message=f"Bulk nilai: {created} created, {updated} updated",
            )

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to bulk create nilai: {str(e)}",
            )

    async def list_nilai_by_tugas(
        self, tugas_id: UUID, current_user: User
    ) -> list[NilaiResponseDTO]:
        tugas = await self._get_tugas_or_404(tugas_id)
        await self._ensure_teacher_permission(current_user, tugas)
        nilai_list = await self.repo.list_nilai_by_tugas(tugas_id)
        return [self._to_dto(n) for n in nilai_list]

    async def list_my_scores(
        self, current_user: User, semester_id: Optional[UUID] = None
    ) -> list[NilaiResponseDTO]:
        kelas_id: UUID | None = None
        if semester_id:
            is_allowed = await self.student_semester_repo.is_student_allowed_semester(
                current_user.user_id, semester_id
            )
            self.policy.ensure_student_allowed_semester(is_allowed)
            kelas_id = await self.student_semester_repo.get_primary_kelas_for_semester(
                current_user.user_id, semester_id
            )
            if not kelas_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kelas siswa untuk semester ini tidak ditemukan",
                )
        rows = await self.repo.list_nilai_by_user_with_mapel(
            current_user.user_id,
            semester_id=semester_id,
            kelas_id=kelas_id,
            published_tugas_only=True,
        )
        return [self._to_dto(nilai, tugas, mapel) for nilai, tugas, mapel in rows]

    async def list_my_scores_by_mapel(
        self, current_user: User, semester_id: Optional[UUID] = None
    ) -> list[NilaiByMapelDTO]:
        kelas_id: UUID | None = None
        if semester_id:
            is_allowed = await self.student_semester_repo.is_student_allowed_semester(
                current_user.user_id, semester_id
            )
            self.policy.ensure_student_allowed_semester(is_allowed)
            kelas_id = await self.student_semester_repo.get_primary_kelas_for_semester(
                current_user.user_id, semester_id
            )
            if not kelas_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kelas siswa untuk semester ini tidak ditemukan",
                )
        rows = await self.repo.list_nilai_by_user_with_mapel(
            current_user.user_id,
            semester_id=semester_id,
            kelas_id=kelas_id,
            published_tugas_only=True,
        )
        grouped: dict[UUID, dict] = defaultdict(lambda: {"mapel_nama": "", "scores": []})

        for nilai, tugas, mapel in rows:
            grouped[mapel.mapel_id]["mapel_nama"] = mapel.nama_mapel
            grouped[mapel.mapel_id]["scores"].append(self._to_dto(nilai, tugas, mapel))

        response: list[NilaiByMapelDTO] = []
        for mapel_id, payload in grouped.items():
            scores = payload["scores"]
            avg = round(sum(s.nilai for s in scores) / len(scores), 2) if scores else 0.0
            response.append(
                NilaiByMapelDTO(
                    mapel_id=mapel_id,
                    mapel_nama=payload["mapel_nama"],
                    scores=scores,
                    average=avg,
                )
            )
        return response

    async def update_nilai(
        self, nilai_id: UUID, request: UpdateNilaiDTO, current_user: User
    ) -> NilaiResponseDTO:
        try:
            nilai = await self.repo.find_nilai_by_id(nilai_id)
            self.policy.ensure_nilai_exists(nilai, nilai_id)

            tugas = await self._get_tugas_or_404(nilai.tugas_id)
            await self._ensure_teacher_permission(current_user, tugas)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_update_payload(update_data)
            for field, value in update_data.items():
                setattr(nilai, field, value)

            await self.repo.commit()
            await self.repo.refresh(nilai)
            return self._to_dto(nilai)

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update nilai: {str(e)}",
            )

    async def delete_nilai(
        self, nilai_id: UUID, current_user: User
    ) -> MessageResponseDTO:
        try:
            nilai = await self.repo.find_nilai_by_id(nilai_id)
            self.policy.ensure_nilai_exists(nilai, nilai_id)

            tugas = await self._get_tugas_or_404(nilai.tugas_id)
            await self._ensure_teacher_permission(current_user, tugas)

            await self.repo.delete_nilai(nilai)
            await self.repo.commit()
            return MessageResponseDTO(message="Nilai deleted successfully")

        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete nilai: {str(e)}",
            )
