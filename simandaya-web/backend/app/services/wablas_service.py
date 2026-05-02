from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config.settings import settings
from app.dto.wablas.wablas_request import WablasRawRequestDTO, WablasSendMessageRequestDTO
from app.dto.wablas.wablas_response import WablasResponseDTO


class WablasService:
    """
    Reusable Wablas API client.

    Auth header format follows Wablas docs:
    Authorization: {api_key}.{sec_key}
    """

    async def send_message(self, request: WablasSendMessageRequestDTO) -> WablasResponseDTO:
        """
        Send text/group message via:
        POST /api/send-message
        """
        return await self.post_form(
            WablasRawRequestDTO(
                endpoint="/api/send-message",
                payload=request.to_form_payload(),
            )
        )

    async def post_form(self, request: WablasRawRequestDTO) -> WablasResponseDTO:
        """
        Generic form POST helper for Wablas endpoints.
        """
        self._ensure_credentials()
        url = self._build_url(request.endpoint)
        headers = {
            "Authorization": f"{settings.WABLAS_API_KEY}.{settings.WABLAS_SEC_KEY}"
        }

        try:
            async with httpx.AsyncClient(timeout=settings.WABLAS_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    url=url,
                    headers=headers,
                    data=self._normalize_payload(request.payload),
                )
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Wablas timeout: {str(exc)}",
            ) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to call Wablas: {str(exc)}",
            ) from exc

        body = self._parse_response_body(response)
        if not response.is_success:
            raise HTTPException(
                status_code=response.status_code,
                detail={
                    "message": "Wablas returned non-success response",
                    "response": body,
                },
            )

        return WablasResponseDTO(ok=True, status_code=response.status_code, data=body)

    def _ensure_credentials(self) -> None:
        if not settings.WABLAS_API_KEY or not settings.WABLAS_SEC_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Wablas credentials are not configured. "
                    "Set WABLAS_API_KEY and WABLAS_SEC_KEY in backend .env."
                ),
            )

    def _build_url(self, endpoint: str) -> str:
        if endpoint.startswith("http://") or endpoint.startswith("https://"):
            return endpoint
        if not endpoint.startswith("/"):
            endpoint = f"/{endpoint}"
        return f"{settings.WABLAS_BASE_URL.rstrip('/')}{endpoint}"

    @staticmethod
    def _normalize_payload(payload: dict[str, Any]) -> dict[str, str]:
        normalized: dict[str, str] = {}
        for key, value in payload.items():
            if value is None:
                continue
            if isinstance(value, bool):
                normalized[key] = "true" if value else "false"
            else:
                normalized[key] = str(value)
        return normalized

    @staticmethod
    def _parse_response_body(response: httpx.Response) -> Any:
        try:
            return response.json()
        except ValueError:
            return response.text
