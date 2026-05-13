from __future__ import annotations

import time
import uuid
from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.logging import get_logger

log = get_logger("simandaya.request")


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        method = request.method
        path = request.url.path
        client = _client(request)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            log.exception(
                f"UNHANDLED {method} {path} elapsed={elapsed_ms}ms rid={rid} client={client}"
            )
            raise
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        response.headers["x-request-id"] = rid
        status = response.status_code
        msg = f"{method} {path} {status} elapsed={elapsed_ms}ms rid={rid} client={client}"
        if status >= 400:
            log.warning(msg)
        else:
            log.info(msg)
        return response


def _client(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "-"
