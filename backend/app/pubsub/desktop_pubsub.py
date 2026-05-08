from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI
try:
    from fastapi_websocket_pubsub import PubSubEndpoint
except ModuleNotFoundError:  # pragma: no cover - runtime fallback when package missing
    PubSubEndpoint = None  # type: ignore[assignment]


DESKTOP_STUDENTS_TOPIC = "desktop.students.snapshot"
DESKTOP_ATTENDANCE_TOPIC = "desktop.attendance.synced"

desktop_pubsub_endpoint = PubSubEndpoint() if PubSubEndpoint is not None else None


def register_desktop_pubsub(app: FastAPI) -> None:
    if desktop_pubsub_endpoint is None:
        return

    @app.websocket("/api/desktop/pubsub")
    async def desktop_pubsub_ws(websocket):
        await desktop_pubsub_endpoint.main_loop(websocket)


def publish_students_snapshot(payload: list[dict[str, Any]]) -> None:
    if desktop_pubsub_endpoint is None:
        return

    async def _publish() -> None:
        await desktop_pubsub_endpoint.publish(
            [DESKTOP_STUDENTS_TOPIC],
            payload,
        )

    asyncio.create_task(_publish())


def publish_attendance_synced(payload: dict[str, Any]) -> None:
    if desktop_pubsub_endpoint is None:
        return

    async def _publish() -> None:
        await desktop_pubsub_endpoint.publish(
            [DESKTOP_ATTENDANCE_TOPIC],
            payload,
        )

    asyncio.create_task(_publish())
