"""
Seed admin, student, and teacher accounts into the database.

Usage (from host, with Docker running):
    docker exec simandaya-backend python scripts/seed_admins.py

Creates:
  - 1 admin (completed)
  - 10 students (PENDING, pre-registered with NIS + nama)
  - Full organizational chart for teachers (PENDING, pre-registered with NIP + nama + structural roles)
Skips any that already exist.
"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.config.database import engine, async_session_maker
from app.models.user import User
from app.models.siswa_profile import SiswaProfile
from app.models.guru_profile import GuruProfile
from app.enums import (
    UserType,
    RegistrationStatus,
    StatusSiswa,
    StatusGuru,
    JenisKelamin,
    StructuralRole,
)



ADMINS = [
    {"username": "admin", "password": "1qaz2wsx3edc"},
]

STUDENTS = [
    {"nis": "24001", "nama_lengkap": "Ahmad Fauzan", "jenis_kelamin": JenisKelamin.laki_laki, "kelas_jurusan": "X IPA 1"},
    {"nis": "24002", "nama_lengkap": "Siti Aisyah", "jenis_kelamin": JenisKelamin.perempuan, "kelas_jurusan": "X IPA 2"},
    {"nis": "24003", "nama_lengkap": "Muhammad Rizky", "jenis_kelamin": JenisKelamin.laki_laki, "kelas_jurusan": "X IPS 1"},
    {"nis": "24004", "nama_lengkap": "Nur Halimah", "jenis_kelamin": JenisKelamin.perempuan, "kelas_jurusan": "XI IPA 1"},
    {"nis": "24005", "nama_lengkap": "Dimas Prasetyo", "jenis_kelamin": JenisKelamin.laki_laki, "kelas_jurusan": "XI IPA 2"},
]

TEACHERS = [
    # ── Pimpinan ──────────────────────────────────────────────────────────
    {
        "nip": "1001",
        "nama_lengkap": "Drs. H. Ahmad Tabrani",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.komite_madrasah,
    },
    {
        "nip": "196705151993031002",
        "nama_lengkap": "Singgih Sampurno, S.Pd., M.A.",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.kepala_madrasah,
    },
    {
        "nip": "197201081998032001",
        "nama_lengkap": "Isti Wahyuni, S.E., M.M",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.kepala_tata_usaha,
    },

    # ── Wakamad Bid. Kurikulum ───────────────────────────────────────────
    {
        "nip": "197308202000031001",
        "nama_lengkap": "Fajar Basuki Rahmat, S.Ag",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.wakamad_kurikulum,
    },
    {
        "nip": "2001",
        "nama_lengkap": "Koordinator Tim IT",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.tim_it,
    },
    {
        "nip": "2002",
        "nama_lengkap": "Staf Pengembang Madrasah",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.pengembang_madrasah,
    },
    {
        "nip": "2003",
        "nama_lengkap": "Kepala Laboratorium Terpadu",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.kepala_laboratorium_terpadu,
    },
    {
        "nip": "198503172010011001",
        "nama_lengkap": "Hendra Kurniawan, S.Pd",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.wali_kelas,
    },

    # ── Wakamad Bid. Kesiswaan ────────────────────────────────────────────
    {
        "nip": "198005152005012001",
        "nama_lengkap": "Leni, S.Si., M.Pd",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.wakamad_kesiswaan,
    },
    {
        "nip": "198711252012012001",
        "nama_lengkap": "Sari Rahmawati, S.Pd",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.bimbingan_konseling,
    },
    {
        "nip": "3001",
        "nama_lengkap": "Koordinator Ramah Anak",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.satuan_pendidikan_ramah_anak,
    },
    {
        "nip": "3002",
        "nama_lengkap": "Tim Pendidikan Karakter",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.tim_pendidikan_karakter,
    },
    {
        "nip": "3003",
        "nama_lengkap": "Pembina Ekstrakurikuler",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.pembina_ekstrakurikuler,
    },

    # ── Wakamad Bid. Sarpras ─────────────────────────────────────────────
    {
        "nip": "198112302006041001",
        "nama_lengkap": "Afwan Suhaimi DR, S.Pd",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.wakamad_sarpras,
    },
    {
        "nip": "199002082015031001",
        "nama_lengkap": "Eko Prasetyo, S.Kom",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.laboratorium_komputer,
    },
    {
        "nip": "5001",
        "nama_lengkap": "Tim Adiwiyata",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.tim_adiwiyata,
    },

    # ── Wakamad Bid. Humas ───────────────────────────────────────────────
    {
        "nip": "197609152003122001",
        "nama_lengkap": "Rita Setyowati, S.Pd., M.Pd",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.wakamad_humas,
    },
    {
        "nip": "6001",
        "nama_lengkap": "Staff Publikasi dan Informasi",
        "jenis_kelamin": JenisKelamin.laki_laki,
        "structural_role": StructuralRole.publikasi_informasi,
    },
    {
        "nip": "6002",
        "nama_lengkap": "Staff Multimedia dan Studio",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.multimedia_studio,
    },

    # ── Umum ──────────────────────────────────────────────────────────────
    {
        "nip": "199205152018012001",
        "nama_lengkap": "Anisa Putri, S.Pd",
        "jenis_kelamin": JenisKelamin.perempuan,
        "structural_role": StructuralRole.guru,
    },
]


async def seed():
    async with async_session_maker() as session:
        # ── Admins ─────────────────────────────────────────────────────────
        for admin in ADMINS:
            result = await session.execute(
                select(User).where(User.username == admin["username"])
            )
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

        # ── Students (PENDING) ─────────────────────────────────────────────
        for s in STUDENTS:
            result = await session.execute(
                select(SiswaProfile).where(SiswaProfile.nis == s["nis"])
            )
            if result.scalar_one_or_none():
                print(f"  SKIP student (NIS exists): {s['nis']} - {s['nama_lengkap']}")
                continue

            user = User(
                user_type=UserType.siswa,
                registration_status=RegistrationStatus.pending,
                username=None,
                password_hash=None,
                is_active=True,
            )
            session.add(user)
            await session.flush()

            profile = SiswaProfile(
                user_id=user.user_id,
                nis=s["nis"],
                nama_lengkap=s["nama_lengkap"],
                jenis_kelamin=s.get("jenis_kelamin"),
                kelas_jurusan=s.get("kelas_jurusan"),
                status_siswa=StatusSiswa.aktif,
            )
            session.add(profile)
            print(f"  CREATED student: {s['nis']} - {s['nama_lengkap']}")

        # ── Teachers (PENDING) ─────────────────────────────────────────────
        for t in TEACHERS:
            result = await session.execute(
                select(GuruProfile).where(GuruProfile.nip == t["nip"])
            )
            if result.scalar_one_or_none():
                print(f"  SKIP teacher (NIP exists): {t['nip']} - {t['nama_lengkap']}")
                continue

            user = User(
                user_type=UserType.guru,
                registration_status=RegistrationStatus.pending,
                username=None,
                password_hash=None,
                is_active=False,
            )
            session.add(user)
            await session.flush()

            profile = GuruProfile(
                user_id=user.user_id,
                nip=t["nip"],
                nama_lengkap=t["nama_lengkap"],
                jenis_kelamin=t.get("jenis_kelamin"),
                structural_role=t.get("structural_role", StructuralRole.guru),
                mata_pelajaran=t.get("mata_pelajaran"),
                pendidikan_terakhir=t.get("pendidikan_terakhir"),
                status_guru=StatusGuru.aktif,
            )
            session.add(profile)
            role_label = t.get("structural_role", StructuralRole.guru).value
            print(f"  CREATED teacher: {t['nip']} - {t['nama_lengkap']} [{role_label}]")

        await session.commit()

    await engine.dispose()
    print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
