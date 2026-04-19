from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    String, Integer, Enum as SQLAlchemyEnum,
    UUID as SQLAlchemyUUID, ForeignKey
)
from app.config.database import Base
from app.enums import StatusSiswa, JenisKelamin


class SiswaProfile(Base):
    __tablename__ = "siswa_profiles"

    siswa_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )

    user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    nis: Mapped[Optional[str]] = mapped_column(
        String(50),
        unique=True,
        nullable=True
    )

    nama_lengkap: Mapped[str] = mapped_column(
        String(225),
        nullable=False
    )

    dob: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    tempat_lahir: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    jenis_kelamin: Mapped[Optional[JenisKelamin]] = mapped_column(
        SQLAlchemyEnum(JenisKelamin, values_callable=lambda x: [e.value for e in x]),
        nullable=True
    )

    alamat: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    nama_wali: Mapped[Optional[str]] = mapped_column(
        String(225),
        nullable=True
    )

    nik: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    card_no: Mapped[Optional[str]] = mapped_column(
        String(50),
        unique=True,
        nullable=True
    )

    kelas_jurusan: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    tahun_masuk: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )

    status_siswa: Mapped[StatusSiswa] = mapped_column(
        SQLAlchemyEnum(StatusSiswa, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=StatusSiswa.aktif
    )

    kontak: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    kewarganegaraan: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Indonesia"
    )

    # Relationship
    user: Mapped["User"] = relationship(
        back_populates="siswa_profile",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"SiswaProfile(nis={self.nis}, nama={self.nama_lengkap})"
