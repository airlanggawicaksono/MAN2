"""
Seed minimal accounts into the database.

Usage (from host, with Docker running):
    docker exec simandaya-backend python scripts/seed_admins.py
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import async_session_maker, engine
from app.enums import JenisKelamin, RegistrationStatus, StatusGuru, StatusSiswa, UserType
from app.models.guru_profile import GuruProfile
from app.models.siswa_profile import SiswaProfile
from app.models.tahun_ajaran import TahunAjaran  # noqa: F401
from app.models.user import User

ADMINS = [
    {"username": "admin", "password": "1qaz2wsx3edc"},
]

SEED_ADMIN_PASSWORD = ADMINS[0]["password"]

BASE_STUDENTS = [
    {
        "username": "wicaksono_student",
        "nis": "001",
        "nama_lengkap": "Wicaksono Student",
        "jenis_kelamin": JenisKelamin.laki_laki,
    }
]

AUTO_STUDENTS = [
    {
        "username": f"student_{i:03d}",
        "nis": f"{1000 + i:04d}",
        "nama_lengkap": f"Siswa Seed {i:03d}",
        "jenis_kelamin": JenisKelamin.laki_laki if i % 2 else JenisKelamin.perempuan,
    }
    for i in range(1, 121)
]

STUDENTS = [*BASE_STUDENTS, *AUTO_STUDENTS]

BASE_TEACHERS = [
    {
        "username": "wicaksono_guru",
        "nip": "001",
        "nama_lengkap": "Wicaksono Guru",
        "jenis_kelamin": JenisKelamin.laki_laki,
    },
]

AUTO_TEACHERS = [
    {
        "username": f"teacher_{i:03d}",
        "nip": f"{2000 + i:04d}",
        "nama_lengkap": f"Guru Seed {i:03d}",
        "jenis_kelamin": JenisKelamin.laki_laki if i % 2 else JenisKelamin.perempuan,
    }
    for i in range(1, 31)
]

TEACHERS = [*BASE_TEACHERS, *AUTO_TEACHERS]


async def seed() -> None:
    async with async_session_maker() as session:
        # Seed admin(s)
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

        # Seed one student
        for s in STUDENTS:
            result = await session.execute(select(SiswaProfile).where(SiswaProfile.nis == s["nis"]))
            if result.scalar_one_or_none():
                print(f"  SKIP student profile (NIS exists): {s['nis']}")
                continue

            user_result = await session.execute(select(User).where(User.username == s["username"]))
            existing_user = user_result.scalar_one_or_none()
            if existing_user:
                print(f"  SKIP student user (username exists): {s['username']}")
                continue

            user = User(
                username=s["username"],
                user_type=UserType.siswa,
                registration_status=RegistrationStatus.completed,
                is_active=True,
            )
            user.set_password(SEED_ADMIN_PASSWORD)
            session.add(user)
            await session.flush()

            profile = SiswaProfile(
                user_id=user.user_id,
                nis=s["nis"],
                nama_lengkap=s["nama_lengkap"],
                jenis_kelamin=s.get("jenis_kelamin"),
                status_siswa=StatusSiswa.aktif,
            )
            session.add(profile)
            print(f"  CREATED student: {s['username']} (NIS {s['nis']})")

        # Seed one teacher
        for t in TEACHERS:
            profile_result = await session.execute(
                select(GuruProfile).where(GuruProfile.nip == t["nip"])
            )
            if profile_result.scalar_one_or_none():
                print(f"  SKIP teacher profile (NIP exists): {t['nip']}")
                continue

            user_result = await session.execute(select(User).where(User.username == t["username"]))
            existing_user = user_result.scalar_one_or_none()
            if existing_user:
                print(f"  SKIP teacher user (username exists): {t['username']}")
                continue

            user = User(
                username=t["username"],
                user_type=UserType.guru,
                registration_status=RegistrationStatus.completed,
                is_active=True,
            )
            user.set_password(SEED_ADMIN_PASSWORD)
            session.add(user)
            await session.flush()

            profile = GuruProfile(
                user_id=user.user_id,
                nip=t["nip"],
                nama_lengkap=t["nama_lengkap"],
                jenis_kelamin=t.get("jenis_kelamin"),
                status_guru=StatusGuru.aktif,
            )
            session.add(profile)
            print(f"  CREATED teacher: {t['username']} (NIP {t['nip']})")

        await session.commit()

    await engine.dispose()
    print(
        "\nSeed complete. Credentials:\n"
        "  admin              / 1qaz2wsx3edc\n"
        "  wicaksono_student  / 1qaz2wsx3edc\n"
        "  student_001..120   / 1qaz2wsx3edc\n"
        "  wicaksono_guru     / 1qaz2wsx3edc\n"
        "  teacher_001..030   / 1qaz2wsx3edc"
    )


if __name__ == "__main__":
    asyncio.run(seed())
