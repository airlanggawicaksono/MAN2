from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.slot_waktu import SlotWaktu


class SlotWaktuRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id(self, slot_id: UUID) -> SlotWaktu | None:
        result = await self.db.execute(
            select(SlotWaktu).where(SlotWaktu.slot_id == slot_id)
        )
        return result.scalar_one_or_none()

    async def list_all_ordered(self) -> list[SlotWaktu]:
        result = await self.db.execute(select(SlotWaktu).order_by(SlotWaktu.urutan))
        return list(result.scalars().all())

    async def add(self, slot: SlotWaktu) -> None:
        self.db.add(slot)

    async def delete(self, slot: SlotWaktu) -> None:
        await self.db.delete(slot)

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()

    async def refresh(self, slot: SlotWaktu) -> None:
        await self.db.refresh(slot)
