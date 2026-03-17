from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.semester import Semester
from app.models.tahun_ajaran import TahunAjaran


class SemesterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_tahun_ajaran_by_id(self, tahun_ajaran_id: UUID) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        return result.scalar_one_or_none()

    async def find_by_tahun_ajaran_and_tipe(
        self, tahun_ajaran_id: UUID, tipe
    ) -> Semester | None:
        result = await self.db.execute(
            select(Semester).where(
                Semester.tahun_ajaran_id == tahun_ajaran_id,
                Semester.tipe == tipe,
            )
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, semester_id: UUID) -> Semester | None:
        result = await self.db.execute(
            select(Semester).where(Semester.semester_id == semester_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Semester]:
        result = await self.db.execute(select(Semester))
        return list(result.scalars().all())

    async def list_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[Semester]:
        result = await self.db.execute(
            select(Semester).where(Semester.tahun_ajaran_id == tahun_ajaran_id)
        )
        return list(result.scalars().all())

    async def add(self, semester: Semester) -> None:
        self.db.add(semester)

    async def delete(self, semester: Semester) -> None:
        await self.db.delete(semester)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, semester: Semester) -> None:
        await self.db.refresh(semester)
