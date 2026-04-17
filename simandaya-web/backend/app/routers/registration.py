from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.services.registration_service import RegistrationService
from app.dto.registration.registration_dto import (
    StudentLookupResponseDTO, TeacherLookupResponseDTO,
    ClaimStudentRequestDTO, ClaimTeacherRequestDTO, ClaimResponseDTO,
)

router = APIRouter(
    prefix="/api/v1/registration",
    tags=["Public - Registration"]
)


# ── Claim (set credentials) ─────────────────────────────────────────────────


@router.post(
    "/students/claim",
    response_model=ClaimResponseDTO,
    summary="Claim Student Registration",
    description="Student sets username + password to activate their account (no auth required).",
)
async def claim_student(
    request: ClaimStudentRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> ClaimResponseDTO:
    service = RegistrationService(db)
    return await service.claim_student(request)


@router.post(
    "/teachers/claim",
    response_model=ClaimResponseDTO,
    summary="Claim Teacher Registration",
    description="Teacher sets username + password to activate their account (no auth required).",
)
async def claim_teacher(
    request: ClaimTeacherRequestDTO,
    db: AsyncSession = Depends(get_db),
) -> ClaimResponseDTO:
    service = RegistrationService(db)
    return await service.claim_teacher(request)


# ── Lookup by NIS/NIP ───────────────────────────────────────────────────────


@router.get(
    "/students/lookup",
    response_model=StudentLookupResponseDTO,
    summary="Lookup Student by NIS",
    description="Verify a student NIS and return their profile preview (no auth required).",
)
async def lookup_student(
    nis: str = Query(..., min_length=1, description="NIS yang diberikan admin"),
    db: AsyncSession = Depends(get_db),
) -> StudentLookupResponseDTO:
    service = RegistrationService(db)
    return await service.lookup_student_by_nis(nis)


@router.get(
    "/teachers/lookup",
    response_model=TeacherLookupResponseDTO,
    summary="Lookup Teacher by NIP",
    description="Verify a teacher NIP and return their profile preview (no auth required).",
)
async def lookup_teacher(
    nip: str = Query(..., min_length=1, description="NIP yang diberikan admin"),
    db: AsyncSession = Depends(get_db),
) -> TeacherLookupResponseDTO:
    service = RegistrationService(db)
    return await service.lookup_teacher_by_nip(nip)

