from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import DeviceJobStatus
from app.models.device_job import DeviceJob


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DeviceJobRepository:
    """
    DB access for the device_jobs outbox.

    Atomic claim is implemented via a conditional UPDATE returning the row,
    so two workers racing on the same job cannot both succeed.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    def add(self, job: DeviceJob) -> None:
        self.db.add(job)

    async def commit(self) -> None:
        await self.db.commit()

    async def flush(self) -> None:
        await self.db.flush()

    async def get(self, job_id: UUID) -> Optional[DeviceJob]:
        result = await self.db.execute(select(DeviceJob).where(DeviceJob.id == job_id))
        return result.scalar_one_or_none()

    async def list_pending(
        self,
        job_types: list[str],
        limit: int = 50,
        now: Optional[datetime] = None,
    ) -> list[DeviceJob]:
        """
        Return pending jobs eligible for execution.

        A job is eligible when status=pending AND
        (next_retry_at is null OR next_retry_at <= now).
        """
        ts = now or _utc_now()
        query = (
            select(DeviceJob)
            .where(
                and_(
                    DeviceJob.status == DeviceJobStatus.pending,
                    DeviceJob.job_type.in_(job_types) if job_types else True,
                    or_(
                        DeviceJob.next_retry_at.is_(None),
                        DeviceJob.next_retry_at <= ts,
                    ),
                )
            )
            .order_by(DeviceJob.created_at.asc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def try_claim(self, job_id: UUID, device_id: str) -> bool:
        """
        Atomic claim. Returns True on success.

        Uses conditional UPDATE: only succeeds if status is still 'pending'.
        Caller must commit.
        """
        stmt = (
            update(DeviceJob)
            .where(
                and_(
                    DeviceJob.id == job_id,
                    DeviceJob.status == DeviceJobStatus.pending,
                )
            )
            .values(
                status=DeviceJobStatus.claimed,
                claimed_by=device_id,
                claimed_at=_utc_now(),
            )
        )
        result = await self.db.execute(stmt)
        return result.rowcount == 1

    async def mark_done(self, job_id: UUID) -> None:
        stmt = (
            update(DeviceJob)
            .where(DeviceJob.id == job_id)
            .values(
                status=DeviceJobStatus.done,
                completed_at=_utc_now(),
                last_error=None,
                next_retry_at=None,
            )
        )
        await self.db.execute(stmt)

    async def mark_failed_with_retry(
        self,
        job_id: UUID,
        error: str,
        next_retry_at: datetime,
        retry_count: int,
    ) -> None:
        """
        Reset to pending so worker will pick it up again after backoff.
        """
        stmt = (
            update(DeviceJob)
            .where(DeviceJob.id == job_id)
            .values(
                status=DeviceJobStatus.pending,
                claimed_by=None,
                claimed_at=None,
                last_error=error,
                next_retry_at=next_retry_at,
                retry_count=retry_count,
            )
        )
        await self.db.execute(stmt)

    async def mark_dead(self, job_id: UUID, error: str) -> None:
        """
        Terminal failure — no more retries.
        """
        stmt = (
            update(DeviceJob)
            .where(DeviceJob.id == job_id)
            .values(
                status=DeviceJobStatus.failed,
                last_error=error,
                completed_at=_utc_now(),
            )
        )
        await self.db.execute(stmt)
