from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class WablasSendMessageRequestDTO(BaseModel):
    """
    DTO for Wablas single-message endpoint: POST /api/send-message
    """

    phone: str = Field(min_length=3, max_length=255)
    message: str = Field(min_length=1, max_length=4096)
    isGroup: Optional[bool] = Field(default=None)
    ref_id: Optional[str] = Field(default=None, max_length=255)
    secret: Optional[bool] = Field(default=None)
    retry: Optional[bool] = Field(default=None)
    priority: Optional[bool] = Field(default=None)
    spintax: Optional[bool] = Field(default=None)
    random: Optional[bool] = Field(default=None)
    source: Optional[str] = Field(default=None, max_length=100)
    flag: Optional[str] = Field(default=None, max_length=50)

    def to_form_payload(self) -> dict[str, str]:
        """
        Wablas examples use form-urlencoded payloads; boolean options are sent
        as lower-case strings ("true"/"false").
        """
        raw = self.model_dump(exclude_none=True)
        payload: dict[str, str] = {}
        for key, value in raw.items():
            if isinstance(value, bool):
                payload[key] = "true" if value else "false"
            else:
                payload[key] = str(value)
        return payload


class WablasRawRequestDTO(BaseModel):
    """
    Generic DTO for calling other Wablas POST form endpoints.
    """

    endpoint: str = Field(
        default="/api/send-message",
        description="Absolute URL or relative Wablas endpoint path.",
    )
    payload: dict[str, Any] = Field(default_factory=dict)
