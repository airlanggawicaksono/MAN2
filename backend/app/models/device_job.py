from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional

from sqlalchemy import String, DateTime, JSON, Integer, Index
from sqlalchemy import UUID as SQLAlchemyUUID, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base
from app.enums import DeviceJobStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DeviceJob(Base):
    """
    Outbox row representing a side-effect that a desktop device must execute.

    BE writes the canonical state + a DeviceJob row in the same transaction.
    Sijinak (worker) claims the row, executes the side effect on
    Hikvision / printer / etc., then marks done or fail.

    Note: Wablas is a sijinak-only concern (webhook dispatched directly to
    Wablas from the desktop); BE has no Wablas integration and should not
    grow one — keep that channel sijinak-local.
    """

    __tablename__ = "device_jobs"
    __table_args__ = (
        Index("ix_device_jobs_pending_ready", "status", "next_retry_at"),
    )

    id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    job_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[DeviceJobStatus] = mapped_column(
        SQLAlchemyEnum(DeviceJobStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DeviceJobStatus.pending,
        index=True,
    )
    related_user_id: Mapped[Optional[UUID]] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), nullable=True, index=True,
    )
    claimed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    claimed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    next_retry_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False,
    )
