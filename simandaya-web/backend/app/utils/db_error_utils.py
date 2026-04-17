import re

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError


def _extract_constraint_name(error: IntegrityError) -> str | None:
    diag = getattr(getattr(error, "orig", None), "diag", None)
    if diag and getattr(diag, "constraint_name", None):
        return str(diag.constraint_name)

    message = str(getattr(error, "orig", error))
    match = re.search(r'constraint "([^"]+)"', message)
    if match:
        return match.group(1)

    return None


def build_integrity_http_exception(
    error: IntegrityError,
    *,
    default_detail: str = "Data melanggar aturan integritas.",
    constraint_messages: dict[str, str] | None = None,
) -> HTTPException:
    constraint_name = _extract_constraint_name(error)
    if constraint_name and constraint_messages and constraint_name in constraint_messages:
        detail = constraint_messages[constraint_name]
    else:
        detail = default_detail

    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail,
    )

