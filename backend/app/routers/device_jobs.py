from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.dependencies import verify_desktop_api_key
from app.dto.device_jobs.device_job_request import (
    ClaimJobRequestDTO,
    CompleteJobRequestDTO,
    FailJobRequestDTO,
)
from app.dto.device_jobs.device_job_response import (
    AckResponseDTO,
    ClaimResponseDTO,
    DeviceJobDTO,
)
from app.services.device_job_service import DeviceJobService


router = APIRouter(
    prefix="/api/desktop/jobs",
    tags=["Admin - Desktop Device"],
    dependencies=[Depends(verify_desktop_api_key)],
)


@router.get(
    "",
    response_model=list[DeviceJobDTO],
    summary="List pending device jobs",
    description=(
        "Return outbox jobs that are pending and eligible for execution "
        "(no claim, retry backoff elapsed). Filter by job_type."
    ),
)
async def list_pending(
    types: str = Query(
        ...,
        description="Comma-separated job types this worker handles. e.g. 'hik.card.sync,hik.person.sync'",
    ),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[DeviceJobDTO]:
    job_types = [t.strip() for t in types.split(",") if t.strip()]
    service = DeviceJobService(db)
    return await service.list_pending(job_types=job_types, limit=limit)


@router.post(
    "/{job_id}/claim",
    response_model=ClaimResponseDTO,
    summary="Atomic claim",
    description="Try to claim a pending job for this device. Returns claimed=false on race loss.",
)
async def claim(
    job_id: UUID,
    body: ClaimJobRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> ClaimResponseDTO:
    service = DeviceJobService(db)
    return await service.claim(job_id=job_id, device_id=body.device_id)


@router.post(
    "/{job_id}/complete",
    response_model=AckResponseDTO,
    summary="Mark job done",
)
async def complete(
    job_id: UUID,
    body: CompleteJobRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> AckResponseDTO:
    service = DeviceJobService(db)
    return await service.complete(job_id=job_id, device_id=body.device_id)


@router.post(
    "/{job_id}/fail",
    response_model=AckResponseDTO,
    summary="Report failure with retry policy",
    description="Reschedules with exponential backoff unless retry_in_seconds is provided.",
)
async def fail(
    job_id: UUID,
    body: FailJobRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> AckResponseDTO:
    service = DeviceJobService(db)
    return await service.fail(
        job_id=job_id,
        device_id=body.device_id,
        error=body.error,
        retry_in_seconds=body.retry_in_seconds,
    )
