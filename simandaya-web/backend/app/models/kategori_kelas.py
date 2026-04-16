from uuid import UUID, uuid4

from sqlalchemy import Boolean, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class KategoriKelas(Base):
    __tablename__ = "kategori_kelas"
    __table_args__ = (
        UniqueConstraint("tahun_ajaran_id", "kode", name="uq_kategori_tahun_kode"),
        UniqueConstraint("tahun_ajaran_id", "nama", name="uq_kategori_tahun_nama"),
    )

    kategori_kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    tahun_ajaran_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("tahun_ajaran.tahun_ajaran_id", ondelete="CASCADE"),
        nullable=False,
    )
    kode: Mapped[str] = mapped_column(String(30), nullable=False)
    nama: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"KategoriKelas(kode={self.kode}, nama={self.nama})"
