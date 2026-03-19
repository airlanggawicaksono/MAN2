"""
Seed admin, student, and teacher accounts into the database.

Usage (from host, with Docker running):
    docker exec simandaya-backend python scripts/seed_admins.py
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import async_session_maker, engine
from app.enums import (
    JenisKelamin,
    RegistrationStatus,
    StatusGuru,
    StatusSiswa,
    StructuralRole,
    UserType,
)
from app.models.guru_profile import GuruProfile
from app.models.guru_structural_assignment import GuruStructuralAssignment
from app.models.siswa_profile import SiswaProfile
from app.models.structural_role_ref import StructuralRoleRef
from app.models.tahun_ajaran import TahunAjaran  # noqa: F401
from app.models.user import User

DEFAULT_PASSWORD = "password123"

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
    {"nip": "1001", "nama_lengkap": "Drs. H. Ahmad Tabrani", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.komite_madrasah]},
    {"nip": "196705151993031002", "nama_lengkap": "Singgih Sampurno, S.Pd., M.A.", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.kepala_madrasah]},
    {"nip": "197201081998032001", "nama_lengkap": "Isti Wahyuni, S.E., M.M", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.kepala_tata_usaha]},
    {"nip": "197308202000031001", "nama_lengkap": "Fajar Basuki Rahmat, S.Ag", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.wakamad_kurikulum]},
    {"nip": "2001", "nama_lengkap": "Koordinator Tim IT", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.tim_it]},
    {"nip": "2002", "nama_lengkap": "Staf Pengembang Madrasah", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.pengembang_madrasah]},
    {"nip": "2003", "nama_lengkap": "Kepala Laboratorium Terpadu", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.kepala_laboratorium_terpadu]},
    {"nip": "198503172010011001", "nama_lengkap": "Hendra Kurniawan, S.Pd", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.wali_kelas]},
    {"nip": "198005152005012001", "nama_lengkap": "Leni, S.Si., M.Pd", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.wakamad_kesiswaan]},
    {"nip": "198711252012012001", "nama_lengkap": "Sari Rahmawati, S.Pd", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.bimbingan_konseling]},
    {"nip": "3001", "nama_lengkap": "Koordinator Ramah Anak", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.satuan_pendidikan_ramah_anak]},
    {"nip": "3002", "nama_lengkap": "Tim Pendidikan Karakter", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.tim_pendidikan_karakter]},
    {"nip": "3003", "nama_lengkap": "Pembina Ekstrakurikuler", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.pembina_ekstrakurikuler]},
    {"nip": "198112302006041001", "nama_lengkap": "Afwan Suhaimi DR, S.Pd", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.wakamad_sarpras]},
    {"nip": "199002082015031001", "nama_lengkap": "Eko Prasetyo, S.Kom", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.laboratorium_komputer]},
    {"nip": "5001", "nama_lengkap": "Tim Adiwiyata", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.tim_adiwiyata]},
    {"nip": "197609152003122001", "nama_lengkap": "Rita Setyowati, S.Pd., M.Pd", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.wakamad_humas]},
    {"nip": "6001", "nama_lengkap": "Staff Publikasi dan Informasi", "jenis_kelamin": JenisKelamin.laki_laki, "structural_roles": [StructuralRole.publikasi_informasi]},
    {"nip": "6002", "nama_lengkap": "Staff Multimedia dan Studio", "jenis_kelamin": JenisKelamin.perempuan, "structural_roles": [StructuralRole.multimedia_studio]},
    {"nip": "199205152018012001", "nama_lengkap": "Anisa Putri, S.Pd", "jenis_kelamin": JenisKelamin.perempuan, "mata_pelajaran": "Bahasa Indonesia", "structural_roles": []},
]


async def _get_or_create_role_ref(session, role: StructuralRole) -> StructuralRoleRef:
    result = await session.execute(
        select(StructuralRoleRef).where(StructuralRoleRef.code == role.name)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    role_ref = StructuralRoleRef(code=role.name, name=role.value, is_active=True)
    session.add(role_ref)
    await session.flush()
    return role_ref


async def seed():
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

        for s in STUDENTS:
            result = await session.execute(select(SiswaProfile).where(SiswaProfile.nis == s["nis"]))
            if result.scalar_one_or_none():
                print(f"  SKIP student (NIS exists): {s['nis']} - {s['nama_lengkap']}")
                continue

            username = f"siswa_{s['nis']}"
            user = User(
                username=username,
                user_type=UserType.siswa,
                registration_status=RegistrationStatus.completed,
                is_active=True,
            )
            user.set_password(DEFAULT_PASSWORD)
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
            print(f"  CREATED student: {s['nis']} - {username}")

        for t in TEACHERS:
            profile_result = await session.execute(
                select(GuruProfile).where(GuruProfile.nip == t["nip"])
            )
            profile = profile_result.scalar_one_or_none()

            if profile:
                user = profile.user
                username = user.username if user else f"guru_{t['nip']}"
                print(f"  SKIP teacher profile (NIP exists): {t['nip']} - {t['nama_lengkap']}")
            else:
                username = f"guru_{t['nip']}"
                user = User(
                    username=username,
                    user_type=UserType.guru,
                    registration_status=RegistrationStatus.completed,
                    is_active=True,
                )
                user.set_password(DEFAULT_PASSWORD)
                session.add(user)
                await session.flush()

                profile = GuruProfile(
                    user_id=user.user_id,
                    nip=t["nip"],
                    nama_lengkap=t["nama_lengkap"],
                    jenis_kelamin=t.get("jenis_kelamin"),
                    mata_pelajaran=t.get("mata_pelajaran"),
                    pendidikan_terakhir=t.get("pendidikan_terakhir"),
                    status_guru=StatusGuru.aktif,
                )
                session.add(profile)
                print(f"  CREATED teacher: {username}")

            for role in t.get("structural_roles", []):
                role_ref = await _get_or_create_role_ref(session, role)
                assignment_result = await session.execute(
                    select(GuruStructuralAssignment).where(
                        GuruStructuralAssignment.user_id == user.user_id,
                        GuruStructuralAssignment.role_id == role_ref.role_id,
                        GuruStructuralAssignment.is_active == True,
                    )
                )
                if assignment_result.scalar_one_or_none():
                    print(f"    SKIP assignment: {username} -> {role.value}")
                    continue

                session.add(
                    GuruStructuralAssignment(
                        user_id=user.user_id,
                        role_id=role_ref.role_id,
                        is_active=True,
                    )
                )
                print(f"    ASSIGNED role: {username} -> {role.value}")

        await session.commit()

    await engine.dispose()
    print(f"\nSeed complete. All accounts use password: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
