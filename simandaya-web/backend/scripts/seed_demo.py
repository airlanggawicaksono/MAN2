"""
Seed demo data (students, desktop settings).

Usage (from host, with Docker running):
    docker exec simandaya-backend python scripts/seed_demo.py
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import async_session_maker, engine
from app.enums import JenisKelamin, RegistrationStatus, StatusSiswa, UserType
from app.models.absensi import Absensi  # noqa: F401
from app.models.desktop_settings import DesktopSettings
from app.models.guru_profile import GuruProfile  # noqa: F401
from app.models.guru_structural_assignment import GuruStructuralAssignment  # noqa: F401
from app.models.izin_keluar import IzinKeluar  # noqa: F401
from app.models.siswa_profile import SiswaProfile
from app.models.structural_role_ref import StructuralRoleRef  # noqa: F401
from app.models.user import User

STUDENTS = [
    # (nama_lengkap, nis, kelas, jenis_kelamin, rfid_number, no_telephone_wali)
    ("Ahmad Fauzi Ramadhan",    "2425001", "XII IPA 1", JenisKelamin.laki_laki,   "A1B2C3D4",  "+6281234000001"),
    ("Siti Nurhaliza",          "2425002", "XII IPA 1", JenisKelamin.perempuan,    "E5F6G7H8",  "+6281234000002"),
    ("Budi Santoso",            "2425003", "XII IPA 2", JenisKelamin.laki_laki,   "I9J0K1L2",  "+6281234000003"),
    ("Dewi Rahayu",             "2425004", "XII IPA 2", JenisKelamin.perempuan,    None,         "+6281234000004"),
    ("Rizky Pratama",           "2425005", "XII IPS 1", JenisKelamin.laki_laki,   "M3N4O5P6",  "+6281234000005"),
    ("Putri Aulia",             "2425006", "XII IPS 1", JenisKelamin.perempuan,    None,         None),
    ("Muhammad Ilham",          "2425007", "XI IPA 1",  JenisKelamin.laki_laki,   "Q7R8S9T0",  "+6281234000007"),
    ("Anisa Fitriana",          "2425008", "XI IPA 1",  JenisKelamin.perempuan,    "U1V2W3X4",  "+6281234000008"),
    ("Yoga Aditya",             "2425009", "XI IPA 2",  JenisKelamin.laki_laki,   None,         None),
    ("Nadia Kusuma",            "2425010", "XI IPS 1",  JenisKelamin.perempuan,    "Y5Z6A7B8",  "+6281234000010"),
    ("Fajar Nugroho",           "2425011", "X IPA 1",   JenisKelamin.laki_laki,   None,         None),
    ("Rini Marlina",            "2425012", "X IPA 1",   JenisKelamin.perempuan,    "C9D0E1F2",  "+6281234000012"),
    ("Dani Setiawan",           "2425013", "X IPS 1",   JenisKelamin.laki_laki,   None,         None),
    ("Laila Nurjannah",         "2425014", "X IPS 1",   JenisKelamin.perempuan,    None,         "+6281234000014"),
    ("Hendra Wijaya",           "2324099", "XII IPA 1", JenisKelamin.laki_laki,   None,         None),  # alumni
]

ALUMNI_NIS = {"2324099"}


async def seed() -> None:
    async with async_session_maker() as session:
        # ── Students ─────────────────────────────────────────────────────────
        created = 0
        for nama, nis, kelas, jenis_kelamin, rfid_number, no_telephone_wali in STUDENTS:
            existing = await session.execute(select(SiswaProfile).where(SiswaProfile.nis == nis))
            if existing.scalar_one_or_none():
                print(f"  SKIP student (exists): {nis} {nama}")
                continue

            user = User(
                user_type=UserType.siswa,
                registration_status=RegistrationStatus.pending,
                is_active=True,
            )
            session.add(user)
            await session.flush()

            status = StatusSiswa.lulus if nis in ALUMNI_NIS else StatusSiswa.aktif
            profile = SiswaProfile(
                user_id=user.user_id,
                nis=nis,
                nama_lengkap=nama,
                kelas_jurusan=kelas,
                jenis_kelamin=jenis_kelamin,
                status_siswa=status,
                rfid_number=rfid_number,
                tahun_masuk=2024 if nis.startswith("24") else 2023,
                kewarganegaraan="Indonesia",
                no_telephone_wali=no_telephone_wali,
            )
            session.add(profile)
            print(f"  CREATE student: {nis} {nama} [{status.value}]")
            created += 1

        # ── Desktop Settings ──────────────────────────────────────────────────
        existing_settings = await session.execute(
            select(DesktopSettings).where(DesktopSettings.id == 1)
        )
        if not existing_settings.scalar_one_or_none():
            from datetime import time
            settings_row = DesktopSettings(id=1, late_cutoff_time=time(7, 15))
            session.add(settings_row)
            print("  CREATE desktop_settings (late cutoff 07:15)")

        await session.commit()
        print(f"\nSeed complete. {created} students created.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
