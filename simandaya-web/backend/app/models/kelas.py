from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    String, Integer, Boolean, Enum as SQLAlchemyEnum,
    UUID as SQLAlchemyUUID, ForeignKey, Index, text
)
from app.config.database import Base
from app.enums import TingkatKelas


class Kelas(Base):
    __tablename__ = "kelas"
    __table_args__ = (
        Index(
            "ux_kelas_active_tahun_nama",
            "tahun_ajaran_id",
            "nama_kelas",
            unique=True,
            postgresql_where=text("is_active"),
        ),
    )

    kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    tahun_ajaran_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("tahun_ajaran.tahun_ajaran_id", ondelete="CASCADE"),
        nullable=False
    )
    nama_kelas: Mapped[str] = mapped_column(String(50), nullable=False)
    tingkat: Mapped[TingkatKelas] = mapped_column(
        SQLAlchemyEnum(TingkatKelas, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    kategori_kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("kategori_kelas.kategori_kelas_id", ondelete="RESTRICT"),
        nullable=False,
    )
    wali_kelas_id: Mapped[Optional[UUID]] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )
    kapasitas: Mapped[int] = mapped_column(Integer, nullable=False, default=36)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tahun_ajaran: Mapped["TahunAjaran"] = relationship()
    kategori_kelas: Mapped["KategoriKelas"] = relationship()
    wali_kelas: Mapped[Optional["User"]] = relationship()

    def __repr__(self) -> str:
        return f"Kelas(nama={self.nama_kelas}, tingkat={self.tingkat})"
