from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    String, Text, DateTime, Enum as SQLAlchemyEnum,
    UUID as SQLAlchemyUUID, ForeignKey, func,
    Boolean,
)
from app.config.database import Base
from app.enums import JenisTugas


class Tugas(Base):
    __tablename__ = "tugas"

    tugas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
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

    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("mata_pelajaran.mapel_id", ondelete="CASCADE"),
        nullable=False
    )

    created_by: Mapped[Optional[UUID]] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    jenis: Mapped[JenisTugas] = mapped_column(
        SQLAlchemyEnum(JenisTugas, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )

    judul: Mapped[str] = mapped_column(String(200), nullable=False)

    deskripsi: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    link_tugas: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    link_submission: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_published_to_students: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    is_nilai_published_to_students: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    is_archived_context: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    # Relationships
    semester: Mapped["Semester"] = relationship()
    kelas: Mapped["Kelas"] = relationship()
    mapel: Mapped["MataPelajaran"] = relationship()
    creator: Mapped[Optional["User"]] = relationship()

    def __repr__(self) -> str:
        return f"Tugas(judul={self.judul}, jenis={self.jenis})"
