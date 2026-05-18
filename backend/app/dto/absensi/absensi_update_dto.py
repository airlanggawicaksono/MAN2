from pydantic import BaseModel

from app.enums import StatusAbsensi
from app.utils.wib_datetime import WibInputDatetime


class UpdateAbsensiDTO(BaseModel):
    status: StatusAbsensi | None = None
    time_in: WibInputDatetime | None = None
    time_out: WibInputDatetime | None = None
