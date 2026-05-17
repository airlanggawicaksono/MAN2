from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from datetime import date as date_cls
from typing import Any, Iterable
from uuid import UUID

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.config.logging import get_logger
from app.config.settings import settings


DESKTOP_ATTENDANCE_TOPIC = "desktop.attendance.synced"
DESKTOP_JOB_CREATED_TOPIC = "desktop.job.created"
DESKTOP_ABSENSI_CHANGED_TOPIC = "desktop.absensi.changed"
DESKTOP_SETTINGS_CHANGED_TOPIC = "desktop.settings.changed"
DESKTOP_STUDENT_DELETED_TOPIC = "desktop.student.deleted"

log = get_logger("simandaya.desktop_pubsub")


@dataclass
class _DesktopWsClient:
    websocket: WebSocket
    topics: set[str] = field(default_factory=set)
    send_lock: asyncio.Lock = field(default_factory=asyncio.Lock)


_clients: dict[int, _DesktopWsClient] = {}
_clients_lock = asyncio.Lock()
_server_call_id = 0


def register_desktop_pubsub(app: FastAPI) -> None:
    @app.websocket("/api/desktop/pubsub")
    async def desktop_pubsub_ws(websocket: WebSocket):
        await websocket.accept()

        api_key = (
            websocket.headers.get("x-api-key")
            or websocket.query_params.get("api_key")
            or ""
        ).strip()
        if api_key != settings.DESKTOP_API_KEY:
            await websocket.close(code=1008, reason="invalid api key")
            return

        client = _DesktopWsClient(websocket=websocket)
        client_key = id(websocket)
        async with _clients_lock:
            _clients[client_key] = client

        log.info("desktop_pubsub connected")

        try:
            while True:
                raw = await websocket.receive_text()
                await _handle_incoming_frame(client, raw)
        except WebSocketDisconnect:
            pass
        except Exception:
            log.exception("desktop_pubsub session failed")
        finally:
            async with _clients_lock:
                _clients.pop(client_key, None)
            log.info("desktop_pubsub disconnected")


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
    async def _run() -> None:
        await _publish_to_subscribers(topic, payload)

    asyncio.create_task(_run())


async def _handle_incoming_frame(client: _DesktopWsClient, raw: str) -> None:
    try:
        frame = json.loads(raw)
    except json.JSONDecodeError:
        return

    if not isinstance(frame, dict):
        return

    request = frame.get("request")
    if not isinstance(request, dict):
        return

    method = request.get("method")
    if method != "subscribe":
        return

    args = request.get("arguments")
    topics = []
    if isinstance(args, dict):
        maybe_topics = args.get("topics")
        if isinstance(maybe_topics, list):
            topics = [t for t in maybe_topics if isinstance(t, str) and t.strip()]

    client.topics = set(topics)

    call_id = request.get("call_id")
    if call_id is not None:
        await _safe_send_json(
            client,
            {"response": {"call_id": call_id, "result": None}},
        )


async def _publish_to_subscribers(topic: str, payload: Any) -> None:
    global _server_call_id

    async with _clients_lock:
        recipients = [client for client in _clients.values() if topic in client.topics]

    if not recipients:
        return

    _server_call_id += 1
    frame = {
        "request": {
            "call_id": f"srv-{_server_call_id}",
            "method": "notify",
            "arguments": {"topic": topic, "data": payload},
        }
    }

    await asyncio.gather(*[_safe_send_json(client, frame) for client in recipients])


async def _safe_send_json(client: _DesktopWsClient, data: dict[str, Any]) -> None:
    async with client.send_lock:
        await client.websocket.send_json(data)
