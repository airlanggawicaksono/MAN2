from __future__ import annotations

import asyncio
from datetime import date as date_cls
from typing import Any, Iterable
from uuid import UUID

from fastapi import FastAPI
try:
    from fastapi_websocket_pubsub import PubSubEndpoint
except ModuleNotFoundError:  # pragma: no cover - runtime fallback when package missing
    PubSubEndpoint = None  # type: ignore[assignment]


DESKTOP_ATTENDANCE_TOPIC = "desktop.attendance.synced"
DESKTOP_JOB_CREATED_TOPIC = "desktop.job.created"
DESKTOP_ABSENSI_CHANGED_TOPIC = "desktop.absensi.changed"
DESKTOP_SETTINGS_CHANGED_TOPIC = "desktop.settings.changed"
DESKTOP_STUDENT_DELETED_TOPIC = "desktop.student.deleted"

desktop_pubsub_endpoint = PubSubEndpoint() if PubSubEndpoint is not None else None


def register_desktop_pubsub(app: FastAPI) -> None:
    if desktop_pubsub_endpoint is None:
        return

    @app.websocket("/api/desktop/pubsub")
    async def desktop_pubsub_ws(websocket):
        await desktop_pubsub_endpoint.main_loop(websocket)


def publish_attendance_synced(payload: dict[str, Any]) -> None:
    """
    Fire-and-forget broadcast of attendance batch summary.

    Currently consumed by admin dashboard surfaces if/when wired.
    """
    _publish_async(DESKTOP_ATTENDANCE_TOPIC, payload)


def publish_job_created(job_id: UUID, job_type: str) -> None:
    """
    Notify desktop workers that a new outbox job is available.

    Body is intentionally minimal: payload + status come from the
    GET /api/desktop/jobs endpoint after the worker filters by type.
    """
    _publish_async(
        DESKTOP_JOB_CREATED_TOPIC,
        {"job_id": str(job_id), "job_type": job_type},
    )


def publish_absensi_changed(
    user_ids: Iterable[UUID],
    affected_date: date_cls,
    kind: str = "upsert",
) -> None:
    """
    Read-side invalidation for sijinak. Tells the desktop to drop its local
    cache for the given (user_id, date) so the next tap re-evaluates instead
    of hitting a stale "already signed off" lock.

    `kind`:
      - "upsert"  → an absensi row was created/updated for these users on date
      - "delete"  → admin removed the absensi row(s)
    """
    payload = {
        "user_ids": [str(u) for u in user_ids],
        "date": affected_date.isoformat(),
        "kind": kind,
    }
    _publish_async(DESKTOP_ABSENSI_CHANGED_TOPIC, payload)


def publish_settings_changed(settings_payload: dict[str, Any]) -> None:
    """
    Push the full new settings shape so sijinak can overwrite its cache
    without an extra round-trip.
    """
    _publish_async(DESKTOP_SETTINGS_CHANGED_TOPIC, settings_payload)


def publish_student_deleted(user_id: UUID, rfid_number: str | None) -> None:
    """
    Tell sijinak a student row was removed BE-side so it can:
      - drop the local Drift `Students` row (kills "already signed off" lock),
      - drop unpublished TapRecords for that user (kills infinite retry loop).

    The actual Hikvision-side cleanup (delete person + card) is handled by
    the paired `hik.person.delete` DeviceJob, not by this event.
    """
    _publish_async(
        DESKTOP_STUDENT_DELETED_TOPIC,
        {"user_id": str(user_id), "rfid_number": rfid_number},
    )


def _publish_async(topic: str, payload: Any) -> None:
    if desktop_pubsub_endpoint is None:
        return

    async def _run() -> None:
        await desktop_pubsub_endpoint.publish([topic], payload)

    asyncio.create_task(_run())
