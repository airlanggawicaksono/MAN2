from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.dependencies import require_role
from app.dto.jobs.job_dto import JobResponseDTO
from app.dto.userMan.userman_request import CreateGuruRequestDTO, CreateStudentRequestDTO
from app.enums import JobType, UserType
from app.models.user import User
from app.services.job_service import JobService

# Ensure handlers are registered at import time
from app.services import job_handlers  # noqa: F401

router = APIRouter(prefix="/api/v1/jobs", tags=["Admin - Jobs"])


def _require_idempotency_key(idempotency_key: Optional[str]) -> str:
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key header is required",
        )
    if len(idempotency_key) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key must be 128 chars or fewer",
        )
    return idempotency_key


@router.post(
    "/imports/students",
    response_model=JobResponseDTO,
    status_code=202,
    summary="Queue Student Bulk Import",
    description="Queues an async student import. Send Idempotency-Key header. Repeated calls return same job.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def queue_import_students(
    rows: list[CreateStudentRequestDTO],
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserType.admin)),
) -> JobResponseDTO:
    key = _require_idempotency_key(idempotency_key)
    service = JobService(db)
    job = await service.enqueue(
        user_id=user.user_id,
        job_type=JobType.import_students,
        idempotency_key=key,
        payload={"rows": [r.model_dump(mode="json") for r in rows]},
    )
    return JobResponseDTO.model_validate(job)


@router.post(
    "/imports/teachers",
    response_model=JobResponseDTO,
    status_code=202,
    summary="Queue Teacher Bulk Import",
    description="Queues an async teacher import. Send Idempotency-Key header. Repeated calls return same job.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def queue_import_teachers(
    rows: list[CreateGuruRequestDTO],
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserType.admin)),
) -> JobResponseDTO:
    key = _require_idempotency_key(idempotency_key)
    service = JobService(db)
    job = await service.enqueue(
        user_id=user.user_id,
        job_type=JobType.import_teachers,
        idempotency_key=key,
        payload={"rows": [r.model_dump(mode="json") for r in rows]},
    )
    return JobResponseDTO.model_validate(job)


@router.post(
    "/exports/students",
    response_model=JobResponseDTO,
    status_code=202,
    summary="Queue Student Export",
    description="Queues an async student export. Result contains items list once finished.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def queue_export_students(
    payload: dict,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserType.admin)),
) -> JobResponseDTO:
    key = _require_idempotency_key(idempotency_key)
    service = JobService(db)
    job = await service.enqueue(
        user_id=user.user_id,
        job_type=JobType.export_students,
        idempotency_key=key,
        payload={
            "search": payload.get("search"),
            "status_siswa": payload.get("status_siswa"),
        },
    )
    return JobResponseDTO.model_validate(job)


@router.post(
    "/exports/teachers",
    response_model=JobResponseDTO,
    status_code=202,
    summary="Queue Teacher Export",
    description="Queues an async teacher export. Result contains items list once finished.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def queue_export_teachers(
    payload: dict,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserType.admin)),
) -> JobResponseDTO:
    key = _require_idempotency_key(idempotency_key)
    service = JobService(db)
    job = await service.enqueue(
        user_id=user.user_id,
        job_type=JobType.export_teachers,
        idempotency_key=key,
        payload={"search": payload.get("search")},
    )
    return JobResponseDTO.model_validate(job)


@router.get(
    "/{job_id}",
    response_model=JobResponseDTO,
    summary="Get Job Status",
    description="Poll job status + result. Returns 404 if not owned by current user.",
    dependencies=[Depends(require_role(UserType.admin))],
)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserType.admin)),
) -> JobResponseDTO:
    service = JobService(db)
    job = await service.get(job_id, user.user_id)
    return JobResponseDTO.model_validate(job)
