from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.guru_mapel import GuruMapel
from app.models.kelas import Kelas
from app.models.mata_pelajaran import MataPelajaran
from app.models.semester import Semester
from app.models.siswa_kelas import SiswaKelas
from app.models.tugas import Tugas
from app.models.tugas_submission import TugasSubmission
from app.models.user import User


class TugasRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_semester_by_id(self, semester_id: UUID) -> Semester | None:
        result = await self.db.execute(
            select(Semester).where(Semester.semester_id == semester_id)
        )
        return result.scalar_one_or_none()

    async def find_kelas_by_id(self, kelas_id: UUID) -> Kelas | None:
        result = await self.db.execute(select(Kelas).where(Kelas.kelas_id == kelas_id))
        return result.scalar_one_or_none()

    async def find_mapel_by_id(self, mapel_id: UUID) -> MataPelajaran | None:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == mapel_id)
        )
        return result.scalar_one_or_none()

    async def find_guru_mapel_assignment(
        self, user_id: UUID, kelas_id: UUID, mapel_id: UUID
    ) -> GuruMapel | None:
        result = await self.db.execute(
            select(GuruMapel).where(
                and_(
                    GuruMapel.user_id == user_id,
                    GuruMapel.kelas_id == kelas_id,
                    GuruMapel.mapel_id == mapel_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def find_student_kelas_for_semester(
        self, user_id: UUID, semester_id: UUID
    ) -> UUID | None:
        result = await self.db.execute(
            select(SiswaKelas.kelas_id)
            .join(Kelas, SiswaKelas.kelas_id == Kelas.kelas_id)
            .join(Semester, Semester.tahun_ajaran_id == Kelas.tahun_ajaran_id)
            .where(
                and_(
                    SiswaKelas.user_id == user_id,
                    Semester.semester_id == semester_id,
                )
            )
            .order_by(Kelas.nama_kelas.asc())
            .limit(1)
        )
        return result.scalar()

    async def add_tugas(self, tugas: Tugas) -> None:
        self.db.add(tugas)

    async def find_tugas_by_id(self, tugas_id: UUID) -> Tugas | None:
        result = await self.db.execute(
            select(Tugas)
            .options(selectinload(Tugas.kelas), selectinload(Tugas.mapel))
            .where(Tugas.tugas_id == tugas_id)
        )
        return result.scalar_one_or_none()

    async def list_tugas_by_filters(
        self,
        kelas_id: UUID,
        semester_id: UUID,
        mapel_id: UUID | None = None,
        published_only: bool = False,
    ) -> list[Tugas]:
        conditions = [
            Tugas.kelas_id == kelas_id,
            Tugas.semester_id == semester_id,
        ]
        if mapel_id:
            conditions.append(Tugas.mapel_id == mapel_id)
        if published_only:
            conditions.append(Tugas.is_published_to_students.is_(True))

        result = await self.db.execute(
            select(Tugas)
            .options(selectinload(Tugas.kelas), selectinload(Tugas.mapel))
            .where(and_(*conditions))
            .order_by(Tugas.created_at.desc())
        )
        return list(result.scalars().all())

    async def find_guru_pengajar_name(self, kelas_id: UUID, mapel_id: UUID) -> str | None:
        result = await self.db.execute(
            select(GuruMapel)
            .options(selectinload(GuruMapel.user).selectinload(User.guru_profile))
            .where(
                and_(
                    GuruMapel.kelas_id == kelas_id,
                    GuruMapel.mapel_id == mapel_id,
                )
            )
            .limit(1)
        )
        assignment = result.scalar_one_or_none()
        if not assignment or not assignment.user or not assignment.user.guru_profile:
            return None
        return assignment.user.guru_profile.nama_lengkap

    async def delete_tugas(self, tugas: Tugas) -> None:
        await self.db.delete(tugas)

    async def find_submission_by_tugas_and_user(
        self, tugas_id: UUID, user_id: UUID
    ) -> TugasSubmission | None:
        result = await self.db.execute(
            select(TugasSubmission)
            .options(selectinload(TugasSubmission.user).selectinload(User.siswa_profile))
            .where(
                and_(
                    TugasSubmission.tugas_id == tugas_id,
                    TugasSubmission.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_submissions_by_tugas(self, tugas_id: UUID) -> list[TugasSubmission]:
        result = await self.db.execute(
            select(TugasSubmission)
            .options(selectinload(TugasSubmission.user).selectinload(User.siswa_profile))
            .where(TugasSubmission.tugas_id == tugas_id)
            .order_by(TugasSubmission.updated_at.desc())
        )
        return list(result.scalars().all())

    async def list_submissions_by_user_and_semester(
        self, user_id: UUID, semester_id: UUID
    ) -> list[TugasSubmission]:
        result = await self.db.execute(
            select(TugasSubmission)
            .join(Tugas, Tugas.tugas_id == TugasSubmission.tugas_id)
            .options(selectinload(TugasSubmission.user).selectinload(User.siswa_profile))
            .where(
                and_(
                    TugasSubmission.user_id == user_id,
                    Tugas.semester_id == semester_id,
                )
            )
            .order_by(TugasSubmission.updated_at.desc())
        )
        return list(result.scalars().all())

    async def add_submission(self, submission: TugasSubmission) -> None:
        self.db.add(submission)

    async def delete_submission(self, submission: TugasSubmission) -> None:
        await self.db.delete(submission)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, obj) -> None:
        await self.db.refresh(obj)
