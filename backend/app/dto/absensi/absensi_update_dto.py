from datetime import datetime

from pydantic import BaseModel

from app.enums import StatusAbsensi


class UpdateAbsensiDTO(BaseModel):
    status: StatusAbsensi | None = None
    time_in: datetime | None = None
    time_out: datetime | None = None
