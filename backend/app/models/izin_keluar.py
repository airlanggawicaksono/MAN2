from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.user import User
from sqlalchemy import (
    String, DateTime,
    UUID as SQLAlchemyUUID, ForeignKey, func
)
from app.config.database import Base


class IzinKeluar(Base):
    __tablename__ = "izin_keluar"

    izin_id: Mapped[UUID] = mapped_column(
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

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    keterangan: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    perkiraan_kembali: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    # Relationship
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"IzinKeluar(user_id={self.user_id}, created_at={self.created_at})"
