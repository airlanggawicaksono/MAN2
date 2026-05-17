from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.device_jobs.device_job_response import (
    AckResponseDTO,
    ClaimResponseDTO,
    DeviceJobDTO,
)
from app.enums import DeviceJobStatus
from app.models.device_job import DeviceJob
from app.repositoriy.device_job_repository import DeviceJobRepository


MAX_RETRIES = 8
DEAD_LETTER_AFTER = MAX_RETRIES


class DeviceJobService:
    """
    Business logic for device_jobs outbox.

    Two faces:
      1. enqueue(): called by other services (e.g. desktop card endpoint)
         inside the same SQLAlchemy session so the outbox INSERT
         participates in the same transaction as the canonical write.
      2. worker-facing: list_pending / claim / complete / fail —
         exposed by the device_jobs router for sijinak workers.
    """

    def __init__(
        self,
        db: AsyncSession,
        repo: DeviceJobRepository | None = None,
    ):
        self.db = db
        self.repo = repo or DeviceJobRepository(db)

    # ── Enqueue (called from other services, same TX) ────────────────────

    async def enqueue(
        self,
        job_type: str,
        payload: dict,
        related_user_id: Optional[UUID] = None,
    ) -> DeviceJob:
        job = DeviceJob(
            job_type=job_type,
            payload=payload,
            related_user_id=related_user_id,
        )
        self.repo.add(job)
        await self.repo.flush()
        return job

    # ── Worker API ───────────────────────────────────────────────────────

    async def list_pending(self, job_types: list[str], limit: int) -> list[DeviceJobDTO]:
        rows = await self.repo.list_pending(job_types=job_types, limit=limit)
        return [DeviceJobDTO.model_validate(r) for r in rows]

    async def claim(self, job_id: UUID, device_id: str) -> ClaimResponseDTO:
        ok = await self.repo.try_claim(job_id, device_id)
        if not ok:
            await self.db.commit()
            return ClaimResponseDTO(claimed=False, job=None)
        await self.db.commit()
        row = await self.repo.get(job_id)
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Job vanished after claim")
        return ClaimResponseDTO(claimed=True, job=DeviceJobDTO.model_validate(row))

    async def complete(self, job_id: UUID, device_id: str) -> AckResponseDTO:
        job = await self._require_owned(job_id, device_id)
        if job.status == DeviceJobStatus.done:
            return AckResponseDTO()
        await self.repo.mark_done(job_id)
        await self.db.commit()
        return AckResponseDTO()

    async def fail(
        self,
        job_id: UUID,
        device_id: str,
        error: str,
        retry_in_seconds: Optional[int],
    ) -> AckResponseDTO:
        job = await self._require_owned(job_id, device_id)
        next_retry = self._compute_next_retry(job.retry_count, retry_in_seconds)
        next_retry_count = job.retry_count + 1

        if next_retry_count >= DEAD_LETTER_AFTER:
            await self.repo.mark_dead(job_id, error=error)
        else:
            await self.repo.mark_failed_with_retry(
                job_id,
                error=error,
                next_retry_at=next_retry,
                retry_count=next_retry_count,
            )

        await self.db.commit()
        return AckResponseDTO()

    # ── Helpers ──────────────────────────────────────────────────────────

    async def _require_owned(self, job_id: UUID, device_id: str) -> DeviceJob:
        job = await self.repo.get(job_id)
        if job is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
        if job.claimed_by != device_id:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Job not owned by device {device_id} (owner={job.claimed_by})",
            )
        return job

    @staticmethod
    def _compute_next_retry(retry_count: int, override_seconds: Optional[int]) -> datetime:
        if override_seconds is not None:
            return datetime.now(timezone.utc) + timedelta(seconds=override_seconds)
        # exponential backoff: 5s, 10s, 20s, 40s, 80s, 160s, 320s, ...
        delay = min(5 * (2 ** retry_count), 600)
        return datetime.now(timezone.utc) + timedelta(seconds=delay)
