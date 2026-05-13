from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime, UniqueConstraint, JSON, UUID as SQLAlchemyUUID, Enum as SQLAlchemyEnum
from app.config.database import Base
from app.enums import JobStatus, JobType


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Job(Base):
    """
    Tracks long-running async operations (imports, exports, etc.).
    Idempotency: (idempotency_key, user_id) is unique. Repeated submissions return existing job.
    """

    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint("idempotency_key", "user_id", name="uq_jobs_idempotency_user"),
    )

    job_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    job_type: Mapped[JobType] = mapped_column(
        SQLAlchemyEnum(JobType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status: Mapped[JobStatus] = mapped_column(
        SQLAlchemyEnum(JobStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=JobStatus.pending,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    progress: Mapped[int] = mapped_column(default=0, nullable=False)
    total: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
