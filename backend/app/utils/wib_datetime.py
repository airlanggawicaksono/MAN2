from datetime import datetime, timezone, timedelta
from typing import Annotated, Optional
from pydantic import AfterValidator, PlainSerializer


WIB = timezone(timedelta(hours=7))


def _to_wib_iso(dt: Optional[datetime]) -> Optional[str]:
    """Postgres timestamptz returns UTC (or naive UTC). Convert to WIB
    (UTC+7) so wire output is `2026-05-18T10:36:00+07:00` instead of the
    raw UTC value. Frontend then displays as-is without timezone logic."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(WIB).isoformat()


def _assume_wib_if_naive(dt: datetime) -> datetime:
    """Frontend may POST naive ISO like `2026-05-18T10:36:00`. Treat naive
    inputs as WIB wall-clock so storing 10:36 from the UI lands as 10:36
    WIB (not 10:36 UTC = 17:36 WIB). Inputs already carrying tz are
    respected as-is."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=WIB)
    return dt


WibDatetime = Annotated[
    datetime,
    PlainSerializer(_to_wib_iso, return_type=str, when_used="json"),
]

WibInputDatetime = Annotated[datetime, AfterValidator(_assume_wib_if_naive)]
