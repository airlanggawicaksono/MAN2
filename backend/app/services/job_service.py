from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import async_session_maker
from app.enums import JobStatus, JobType
from app.models.job import Job


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


JobHandler = Callable[["JobRunner", Job, dict[str, Any]], Awaitable[dict[str, Any]]]
_HANDLERS: dict[JobType, JobHandler] = {}


def register_handler(job_type: JobType):
    def decorator(fn: JobHandler) -> JobHandler:
        _HANDLERS[job_type] = fn
        return fn

    return decorator


class JobRunner:
    """
    In-process async job runner. Owns its own DB session per task.
    """

    def __init__(self, job_id: UUID):
        self.job_id = job_id

    async def update_progress(self, progress: int, total: Optional[int] = None) -> None:
        async with async_session_maker() as session:
            job = await session.get(Job, self.job_id)
            if not job:
                return
            job.progress = progress
            if total is not None:
                job.total = total
            await session.commit()


async def _execute_job(job_id: UUID) -> None:
    async with async_session_maker() as session:
        job = await session.get(Job, job_id)
        if not job:
            return
        job.status = JobStatus.running
        job.started_at = utc_now()
        await session.commit()
        job_type = job.job_type
        payload = dict(job.payload or {})

    handler = _HANDLERS.get(job_type)
    if not handler:
        async with async_session_maker() as session:
            job = await session.get(Job, job_id)
            if job:
                job.status = JobStatus.failed
                job.error = f"No handler registered for {job_type.value}"
                job.finished_at = utc_now()
                await session.commit()
        return

    runner = JobRunner(job_id)
    try:
        result = await handler(runner, job, payload)
        async with async_session_maker() as session:
            job = await session.get(Job, job_id)
            if job:
                job.status = JobStatus.succeeded
                job.result = result
                job.finished_at = utc_now()
                await session.commit()
    except Exception as exc:
        async with async_session_maker() as session:
            job = await session.get(Job, job_id)
            if job:
                job.status = JobStatus.failed
                job.error = str(exc)[:2000]
                job.finished_at = utc_now()
                await session.commit()


class JobService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_idempotency(
        self, idempotency_key: str, user_id: UUID
    ) -> Optional[Job]:
        result = await self.db.execute(
            select(Job).where(
                Job.idempotency_key == idempotency_key,
                Job.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def enqueue(
        self,
        user_id: UUID,
        job_type: JobType,
        idempotency_key: str,
        payload: dict[str, Any],
    ) -> Job:
        existing = await self.find_by_idempotency(idempotency_key, user_id)
        if existing:
            return existing

        job = Job(
            user_id=user_id,
            job_type=job_type,
            status=JobStatus.pending,
            idempotency_key=idempotency_key,
            payload=payload,
        )
        self.db.add(job)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            existing = await self.find_by_idempotency(idempotency_key, user_id)
            if existing:
                return existing
            raise
        await self.db.refresh(job)

        asyncio.create_task(_execute_job(job.job_id))
        return job

    async def get(self, job_id: UUID, user_id: UUID) -> Job:
        job = await self.db.get(Job, job_id)
        if not job or job.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        return job
