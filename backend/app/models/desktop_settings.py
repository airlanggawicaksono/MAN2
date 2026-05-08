from datetime import time, datetime
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Time, DateTime, UUID as SQLAlchemyUUID, ForeignKey, func
from app.config.database import Base


class DesktopSettings(Base):
    """
    Singleton configuration row for desktop app settings.
    Always uses id=1 (single row pattern).
    """
    __tablename__ = "desktop_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1
    )

    late_cutoff_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
        default=time(7, 15)
    )

    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
        onupdate=func.now()
    )

    updated_by: Mapped[Optional[UUID]] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    def __repr__(self) -> str:
        return f"DesktopSettings(late_cutoff_time={self.late_cutoff_time})"
