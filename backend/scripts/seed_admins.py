"""
Seed admin accounts into the database.

Usage (from host, with Docker running):
    docker exec simandaya-backend python scripts/seed_admins.py
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import async_session_maker, engine
from app.enums import RegistrationStatus, UserType
from app.models.user import User
from app.models.siswa_profile import SiswaProfile  # noqa: F401 — needed for SQLAlchemy mapper
from app.models.guru_profile import GuruProfile  # noqa: F401 — needed for SQLAlchemy mapper
from app.models.guru_structural_assignment import GuruStructuralAssignment  # noqa: F401
from app.models.structural_role_ref import StructuralRoleRef  # noqa: F401
from app.models.absensi import Absensi  # noqa: F401
from app.models.izin_keluar import IzinKeluar  # noqa: F401
from app.models.desktop_settings import DesktopSettings  # noqa: F401

ADMINS = [
    {"username": "admin123", "password": "1qaz3edc2wsx4rfv"},
]


async def seed() -> None:
    async with async_session_maker() as session:
        for admin in ADMINS:
            result = await session.execute(select(User).where(User.username == admin["username"]))
            if result.scalar_one_or_none():
                print(f"  SKIP admin (exists): {admin['username']}")
                continue

            user = User(
                username=admin["username"],
                user_type=UserType.admin,
                registration_status=RegistrationStatus.completed,
                is_active=True,
            )
            user.set_password(admin["password"])
            session.add(user)
            print(f"  CREATED admin: {admin['username']}")

        await session.commit()

    await engine.dispose()
    print(
        "\nSeed complete. Credentials:\n"
        "  admin123  /  1qaz3edc2wsx4rfv"
    )


if __name__ == "__main__":
    asyncio.run(seed())
