from __future__ import annotations

from typing import Any

from app.config.database import async_session_maker
from app.dto.userMan.userman_request import CreateGuruRequestDTO, CreateStudentRequestDTO
from app.enums import JobType, StatusSiswa
from app.models.job import Job
from app.policy.user_management_policy import UserManagementPolicy
from app.repositoriy.user_management_repository import UserManagementRepository
from app.services.job_service import JobRunner, register_handler
from app.services.userMan_service import (
    StudentUserManagementService,
    TeacherUserManagementService,
)


@register_handler(JobType.import_students)
async def import_students(runner: JobRunner, job: Job, payload: dict[str, Any]) -> dict[str, Any]:
    raw_rows: list[dict[str, Any]] = payload.get("rows", [])
    await runner.update_progress(0, total=len(raw_rows))
    async with async_session_maker() as session:
        repo = UserManagementRepository(session)
        service = StudentUserManagementService(repo, UserManagementPolicy, session)
        requests = [CreateStudentRequestDTO.model_validate(row) for row in raw_rows]
        result = await service.bulk_create_students(requests)
    await runner.update_progress(len(raw_rows), total=len(raw_rows))
    return result.model_dump(mode="json")


@register_handler(JobType.import_teachers)
async def import_teachers(runner: JobRunner, job: Job, payload: dict[str, Any]) -> dict[str, Any]:
    raw_rows: list[dict[str, Any]] = payload.get("rows", [])
    await runner.update_progress(0, total=len(raw_rows))
    async with async_session_maker() as session:
        repo = UserManagementRepository(session)
        service = TeacherUserManagementService(repo, UserManagementPolicy)
        requests = [CreateGuruRequestDTO.model_validate(row) for row in raw_rows]
        result = await service.bulk_create_teachers(requests)
    await runner.update_progress(len(raw_rows), total=len(raw_rows))
    return result.model_dump(mode="json")


@register_handler(JobType.export_students)
async def export_students(runner: JobRunner, job: Job, payload: dict[str, Any]) -> dict[str, Any]:
    status_raw = payload.get("status_siswa")
    status_siswa = StatusSiswa(status_raw) if status_raw else None
    search = payload.get("search")
    async with async_session_maker() as session:
        repo = UserManagementRepository(session)
        service = StudentUserManagementService(repo, UserManagementPolicy, session)
        page = await service.list_students(
            skip=0, limit=10000, search=search, status_siswa=status_siswa
        )
    total = len(page.items)
    await runner.update_progress(total, total=total)
    return {"items": [item.model_dump(mode="json") for item in page.items], "total": total}


@register_handler(JobType.export_teachers)
async def export_teachers(runner: JobRunner, job: Job, payload: dict[str, Any]) -> dict[str, Any]:
    search = payload.get("search")
    async with async_session_maker() as session:
        repo = UserManagementRepository(session)
        service = TeacherUserManagementService(repo, UserManagementPolicy)
        page = await service.list_teachers(skip=0, limit=10000, search=search)
    total = len(page.items)
    await runner.update_progress(total, total=total)
    return {"items": [item.model_dump(mode="json") for item in page.items], "total": total}
