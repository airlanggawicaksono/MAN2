from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class WablasResponseDTO(BaseModel):
    ok: bool = Field(..., description="True when HTTP call succeeds (2xx).")
    status_code: int = Field(..., description="HTTP status code from Wablas.")
    data: Any = Field(default=None, description="Parsed JSON response or raw text.")
