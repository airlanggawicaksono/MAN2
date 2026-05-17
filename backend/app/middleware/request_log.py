from __future__ import annotations

import time
import uuid

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config.logging import get_logger

log = get_logger("simandaya.request")


class RequestLogMiddleware:
    """
    Pure-ASGI request logger.

    IMPORTANT: implemented as a plain ASGI middleware (not
    `BaseHTTPMiddleware`) because BaseHTTPMiddleware does NOT support
    WebSocket scopes — it returns HTTP 403/500 on every WS handshake,
    breaking endpoints like /api/desktop/pubsub. See:
    https://github.com/encode/starlette/issues/919
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            # Pass WebSocket / lifespan scopes through untouched.
            await self.app(scope, receive, send)
            return

        await self._handle_http(scope, receive, send)

    async def _handle_http(self, scope: Scope, receive: Receive, send: Send) -> None:
        rid = _request_id_from_scope(scope)
        method = scope.get("method", "?")
        path = scope.get("path", "?")
        client = _client_from_scope(scope)
        start = time.perf_counter()

        response_status_holder: dict[str, int] = {"status": 0}
        wrapped_send = _wrap_send(send, rid, response_status_holder)

        try:
            await self.app(scope, receive, wrapped_send)
        except Exception:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            log.exception(
                f"UNHANDLED {method} {path} elapsed={elapsed_ms}ms rid={rid} client={client}"
            )
            raise

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        status = response_status_holder["status"]
        msg = f"{method} {path} {status} elapsed={elapsed_ms}ms rid={rid} client={client}"
        if status >= 400:
            log.warning(msg)
        else:
            log.info(msg)


def _wrap_send(
    send: Send,
    rid: str,
    status_holder: dict[str, int],
) -> Send:
    async def wrapped(message: Message) -> None:
        if message["type"] == "http.response.start":
            status_holder["status"] = message.get("status", 0)
            headers = list(message.get("headers") or [])
            headers.append((b"x-request-id", rid.encode("latin-1")))
            message = {**message, "headers": headers}
        await send(message)

    return wrapped


def _request_id_from_scope(scope: Scope) -> str:
    for name, value in scope.get("headers") or []:
        if name == b"x-request-id":
            return value.decode("latin-1", errors="ignore") or _new_rid()
    return _new_rid()


def _new_rid() -> str:
    return uuid.uuid4().hex[:12]


def _client_from_scope(scope: Scope) -> str:
    for name, value in scope.get("headers") or []:
        if name == b"x-forwarded-for":
            decoded = value.decode("latin-1", errors="ignore")
            return decoded.split(",")[0].strip()
    client = scope.get("client")
    if client and len(client) >= 1:
        return str(client[0])
    return "-"
