from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    Boolean, Integer, DateTime, ForeignKey,
    Enum as SQLAlchemyEnum, UUID as SQLAlchemyUUID,
    UniqueConstraint,
)
from app.config.database import Base
from app.enums import TingkatKelas


class KurikulumMapel(Base):
    __tablename__ = "kurikulum_mapel"
    __table_args__ = (
        UniqueConstraint(
            "mapel_id",
            "tingkat",
            "tahun_ajaran_id",
            "kategori_kelas_id",
            name="uq_kurikulum_mapel",
        ),
    )

    kurikulum_mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("mata_pelajaran.mapel_id", ondelete="CASCADE"),
        nullable=False,
    )
    tahun_ajaran_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("tahun_ajaran.tahun_ajaran_id", ondelete="CASCADE"),
        nullable=False,
    )
    tingkat: Mapped[TingkatKelas] = mapped_column(
        SQLAlchemyEnum(TingkatKelas, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    kategori_kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("kategori_kelas.kategori_kelas_id", ondelete="RESTRICT"),
        nullable=False,
    )
    is_wajib: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    jam_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    mapel = relationship("MataPelajaran", lazy="selectin")
    tahun_ajaran = relationship("TahunAjaran", lazy="selectin")
    kategori_kelas = relationship("KategoriKelas", lazy="selectin")

    def __repr__(self) -> str:
        return f"KurikulumMapel(mapel={self.mapel_id}, tingkat={self.tingkat}, ta={self.tahun_ajaran_id})"
