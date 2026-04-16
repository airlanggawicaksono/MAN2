from uuid import UUID, uuid4
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, UUID as SQLAlchemyUUID, ForeignKey, Index, text
from app.config.database import Base


class GuruMapel(Base):
    __tablename__ = "guru_mapel"
    __table_args__ = (
        Index(
            "ux_guru_mapel_active_assignment",
            "user_id",
            "mapel_id",
            "kelas_id",
            "tahun_ajaran_id",
            unique=True,
            postgresql_where=text("is_active"),
        ),
    )

    guru_mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    mapel_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("mata_pelajaran.mapel_id", ondelete="CASCADE"),
        nullable=False
    )
    kelas_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("kelas.kelas_id", ondelete="CASCADE"),
        nullable=False
    )
    tahun_ajaran_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("tahun_ajaran.tahun_ajaran_id", ondelete="CASCADE"),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped["User"] = relationship()
    mapel: Mapped["MataPelajaran"] = relationship()
    kelas: Mapped["Kelas"] = relationship()
    tahun_ajaran: Mapped["TahunAjaran"] = relationship()

    def __repr__(self) -> str:
        return f"GuruMapel(user_id={self.user_id}, mapel_id={self.mapel_id})"
