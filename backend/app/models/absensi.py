from uuid import UUID, uuid4
from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    Date, DateTime, Enum as SQLAlchemyEnum,
    UUID as SQLAlchemyUUID, ForeignKey, UniqueConstraint
)
from app.config.database import Base
from app.enums import StatusAbsensi


class Absensi(Base):
    __tablename__ = "absensi"
    __table_args__ = (
        UniqueConstraint("user_id", "tanggal", name="uq_absensi_user_tanggal"),
    )

    absensi_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )

    user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )

    tanggal: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    time_in: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    time_out: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    status: Mapped[StatusAbsensi] = mapped_column(
        SQLAlchemyEnum(StatusAbsensi, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=StatusAbsensi.alfa
    )

    marked_by: Mapped[Optional[UUID]] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    marker: Mapped[Optional["User"]] = relationship(foreign_keys=[marked_by])

    def __repr__(self) -> str:
        return f"Absensi(user_id={self.user_id}, tanggal={self.tanggal}, status={self.status})"
