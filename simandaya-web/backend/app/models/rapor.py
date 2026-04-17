from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    Text, Boolean, DateTime, Numeric, String,
    UUID as SQLAlchemyUUID, ForeignKey, UniqueConstraint, func,
)
from app.config.database import Base


class Rapor(Base):
    __tablename__ = "rapor"
    __table_args__ = (
        UniqueConstraint("user_id", "semester_id", name="uq_rapor_user_semester"),
    )

    rapor_id: Mapped[UUID] = mapped_column(
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

    semester_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("semester.semester_id", ondelete="CASCADE"),
        nullable=False
    )

    kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("kelas.kelas_id", ondelete="CASCADE"),
        nullable=False
    )

    catatan_wali_kelas: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )

    is_published: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    published_by: Mapped[Optional[UUID]] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    semester: Mapped["Semester"] = relationship()
    kelas: Mapped["Kelas"] = relationship()
    publisher: Mapped[Optional["User"]] = relationship(foreign_keys=[published_by])
    nilai_list: Mapped[list["RaporNilai"]] = relationship(
        back_populates="rapor", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"Rapor(user_id={self.user_id}, semester_id={self.semester_id})"


class RaporNilai(Base):
    __tablename__ = "rapor_nilai"
    __table_args__ = (
        UniqueConstraint("rapor_id", "mapel_id", name="uq_rapor_nilai_rapor_mapel"),
    )

    rapor_nilai_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )

    rapor_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("rapor.rapor_id", ondelete="CASCADE"),
        nullable=False
    )

    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("mata_pelajaran.mapel_id", ondelete="CASCADE"),
        nullable=False
    )

    nilai_akhir: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False
    )
    nilai_sumber: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False, default=0
    )
    nilai_override: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )

    is_manual_override: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    catatan: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )

    # Relationships
    rapor: Mapped["Rapor"] = relationship(back_populates="nilai_list")
    mapel: Mapped["MataPelajaran"] = relationship()

    def __repr__(self) -> str:
        return f"RaporNilai(rapor_id={self.rapor_id}, mapel_id={self.mapel_id}, nilai={self.nilai_akhir})"
