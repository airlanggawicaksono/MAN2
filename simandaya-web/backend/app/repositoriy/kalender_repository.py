from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.kalender_akademik import KalenderAkademik
from app.models.tahun_ajaran import TahunAjaran


class KalenderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_tahun_ajaran_by_id(self, tahun_ajaran_id: UUID) -> TahunAjaran | None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, kalender_id: UUID) -> KalenderAkademik | None:
        result = await self.db.execute(
            select(KalenderAkademik).where(KalenderAkademik.kalender_id == kalender_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[KalenderAkademik]:
        result = await self.db.execute(select(KalenderAkademik))
        return list(result.scalars().all())

    async def list_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[KalenderAkademik]:
        result = await self.db.execute(
            select(KalenderAkademik).where(KalenderAkademik.tahun_ajaran_id == tahun_ajaran_id)
        )
        return list(result.scalars().all())

    async def add(self, kalender: KalenderAkademik) -> None:
        self.db.add(kalender)

    async def delete(self, kalender: KalenderAkademik) -> None:
        await self.db.delete(kalender)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, kalender: KalenderAkademik) -> None:
        await self.db.refresh(kalender)
