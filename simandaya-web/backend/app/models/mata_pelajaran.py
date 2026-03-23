from uuid import UUID, uuid4
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    String, Boolean, Enum as SQLAlchemyEnum,
    UUID as SQLAlchemyUUID
)
from app.config.database import Base
from app.enums import KelompokMapel


class MataPelajaran(Base):
    __tablename__ = "mata_pelajaran"

    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    kode_mapel: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nama_mapel: Mapped[str] = mapped_column(String(100), nullable=False)
    kelompok: Mapped[KelompokMapel] = mapped_column(
        SQLAlchemyEnum(KelompokMapel, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"MataPelajaran(kode={self.kode_mapel}, nama={self.nama_mapel})"
