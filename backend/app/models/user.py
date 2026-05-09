from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.siswa_profile import SiswaProfile
    from app.models.guru_profile import GuruProfile
from sqlalchemy import String, Boolean, DateTime, Enum as SQLAlchemyEnum, UUID as SQLAlchemyUUID, func
import bcrypt as bcrypt_lib
from app.config.database import Base
from app.config.settings import settings
from app.enums import UserType, RegistrationStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """
    Auth-only user model. Profile data lives in siswa_profile / guru_profile.
    """

    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )

    username: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
        index=True
    )

    user_type: Mapped[UserType] = mapped_column(
        SQLAlchemyEnum(UserType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )

    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    registration_status: Mapped[RegistrationStatus] = mapped_column(
        SQLAlchemyEnum(RegistrationStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=RegistrationStatus.completed
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    # Relationships
    siswa_profile: Mapped[Optional["SiswaProfile"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        single_parent=True,
    )
    guru_profile: Mapped[Optional["GuruProfile"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        single_parent=True,
    )

    def set_password(self, plain_password: str) -> None:
        salt = bcrypt_lib.gensalt(rounds=settings.BCRYPT_ROUNDS)
        self.password_hash = bcrypt_lib.hashpw(
            plain_password.encode("utf-8"), salt
        ).decode("utf-8")

    def verify_password(self, plain_password: str) -> bool:
        return bcrypt_lib.checkpw(
            plain_password.encode("utf-8"),
            self.password_hash.encode("utf-8"),
        )

    def update_last_login(self) -> None:
        self.last_login = utc_now()

    def deactivate(self) -> None:
        self.is_active = False

    def activate(self) -> None:
        self.is_active = True

    def __repr__(self) -> str:
        return f"User(user_id={self.user_id}, username={self.username})"
