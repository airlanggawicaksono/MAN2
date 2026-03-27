"""
Seed demo data for:
- Structural role assignments
- Manajemen akademik (tahun ajaran, semester, kategori kelas, kelas, mapel, kurikulum)
- Penugasan guru-mapel
- Jadwal pelajaran
- Assign siswa ke kelas

Run inside backend container:
    python scripts/seed_academic_demo.py
"""

import asyncio
import sys
from datetime import date, time
from itertools import cycle
from pathlib import Path

from sqlalchemy import and_, select, update

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import async_session_maker, engine
from app.enums import (
    HariSekolah,
    KelompokMapel,
    StructuralRole,
    TipeSemester,
    TingkatKelas,
    UserType,
)
from app.models.guru_mapel import GuruMapel
from app.models.guru_profile import GuruProfile
from app.models.guru_structural_assignment import GuruStructuralAssignment
from app.models.jadwal import Jadwal
from app.models.kategori_kelas import KategoriKelas
from app.models.kelas import Kelas
from app.models.kurikulum_mapel import KurikulumMapel
from app.models.mata_pelajaran import MataPelajaran
from app.models.semester import Semester
from app.models.siswa_kelas import SiswaKelas
from app.models.siswa_profile import SiswaProfile
from app.models.slot_waktu import SlotWaktu
from app.models.structural_role_ref import StructuralRoleRef
from app.models.tahun_ajaran import TahunAjaran
from app.models.user import User

TA_NAME = "2026/2027"

KATEGORI_SEED = [
    ("IPA", "Ilmu Pengetahuan Alam"),
    ("IPS", "Ilmu Pengetahuan Sosial"),
    ("AGAMA", "Keagamaan"),
]

MAPEL_SEED = [
    ("MAT-W", "Matematika Wajib", KelompokMapel.wajib),
    ("BIN-W", "Bahasa Indonesia", KelompokMapel.wajib),
    ("BIG-W", "Bahasa Inggris", KelompokMapel.wajib),
    ("PAI-K", "Pendidikan Agama Islam", KelompokMapel.keagamaan),
    ("FIS-P", "Fisika", KelompokMapel.peminatan),
    ("KIM-P", "Kimia", KelompokMapel.peminatan),
    ("BIO-P", "Biologi", KelompokMapel.peminatan),
    ("EKO-P", "Ekonomi", KelompokMapel.peminatan),
    ("SOS-P", "Sosiologi", KelompokMapel.peminatan),
    ("SEJ-W", "Sejarah Indonesia", KelompokMapel.wajib),
]

SLOT_SEED = [
    ("Jam 1", time(7, 0), time(7, 45), 1),
    ("Jam 2", time(7, 45), time(8, 30), 2),
    ("Jam 3", time(8, 30), time(9, 15), 3),
    ("Jam 4", time(9, 30), time(10, 15), 4),
    ("Jam 5", time(10, 15), time(11, 0), 5),
    ("Jam 6", time(11, 0), time(11, 45), 6),
    ("Jam 7", time(13, 0), time(13, 45), 7),
    ("Jam 8", time(13, 45), time(14, 30), 8),
]

ROLE_ASSIGN_SEED = [
    StructuralRole.kepala_madrasah,
    StructuralRole.kepala_tata_usaha,
    StructuralRole.wakamad_kurikulum,
    StructuralRole.wakamad_kesiswaan,
    StructuralRole.wakamad_sarpras,
    StructuralRole.wakamad_humas,
    StructuralRole.bimbingan_konseling,
]


async def get_or_create_tahun_ajaran(session) -> TahunAjaran:
    result = await session.execute(select(TahunAjaran).where(TahunAjaran.nama == TA_NAME))
    ta = result.scalar_one_or_none()
    if ta:
        ta.is_active = True
        return ta

    await session.execute(update(TahunAjaran).values(is_active=False))
    ta = TahunAjaran(
        nama=TA_NAME,
        tanggal_mulai=date(2026, 7, 1),
        tanggal_selesai=date(2027, 6, 30),
        is_active=True,
    )
    session.add(ta)
    await session.flush()
    print(f"  CREATED tahun ajaran: {ta.nama}")
    return ta


async def get_or_create_semester(session, ta: TahunAjaran) -> tuple[Semester, Semester]:
    async def _upsert(tipe: TipeSemester, mulai: date, selesai: date, active: bool) -> Semester:
        result = await session.execute(
            select(Semester).where(
                Semester.tahun_ajaran_id == ta.tahun_ajaran_id,
                Semester.tipe == tipe,
            )
        )
        row = result.scalar_one_or_none()
        if row:
            row.tanggal_mulai = mulai
            row.tanggal_selesai = selesai
            row.is_active = active
            return row
        row = Semester(
            tahun_ajaran_id=ta.tahun_ajaran_id,
            tipe=tipe,
            tanggal_mulai=mulai,
            tanggal_selesai=selesai,
            is_active=active,
        )
        session.add(row)
        await session.flush()
        print(f"  CREATED semester: {tipe.value}")
        return row

    ganjil = await _upsert(TipeSemester.ganjil, date(2026, 7, 1), date(2026, 12, 31), True)
    genap = await _upsert(TipeSemester.genap, date(2027, 1, 1), date(2027, 6, 30), False)
    return ganjil, genap


async def seed_structural_roles_and_assignments(session, ta: TahunAjaran, teachers: list[User]) -> None:
    role_by_code: dict[str, StructuralRoleRef] = {}
    for role in StructuralRole:
        result = await session.execute(select(StructuralRoleRef).where(StructuralRoleRef.code == role.name))
        row = result.scalar_one_or_none()
        if not row:
            row = StructuralRoleRef(code=role.name, name=role.value, is_active=True)
            session.add(row)
            await session.flush()
        else:
            row.name = role.value
            row.is_active = True
        role_by_code[role.name] = row

    teacher_cycle = cycle(teachers[: max(1, min(len(teachers), len(ROLE_ASSIGN_SEED)))])
    for role in ROLE_ASSIGN_SEED:
        role_ref = role_by_code[role.name]
        teacher = next(teacher_cycle)
        result = await session.execute(
            select(GuruStructuralAssignment).where(
                GuruStructuralAssignment.role_id == role_ref.role_id,
                GuruStructuralAssignment.is_active.is_(True),
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.user_id = teacher.user_id
            existing.tahun_ajaran_id = ta.tahun_ajaran_id
        else:
            session.add(
                GuruStructuralAssignment(
                    user_id=teacher.user_id,
                    role_id=role_ref.role_id,
                    tahun_ajaran_id=ta.tahun_ajaran_id,
                    is_active=True,
                )
            )
    print("  SEEDED jabatan struktural assignments")


async def seed_kategori_kelas(session) -> dict[str, KategoriKelas]:
    result_map: dict[str, KategoriKelas] = {}
    for kode, nama in KATEGORI_SEED:
        result = await session.execute(select(KategoriKelas).where(KategoriKelas.kode == kode))
        row = result.scalar_one_or_none()
        if not row:
            row = KategoriKelas(kode=kode, nama=nama, is_active=True)
            session.add(row)
            await session.flush()
        else:
            row.nama = nama
            row.is_active = True
        result_map[kode] = row
    print("  SEEDED kategori kelas")
    return result_map


async def seed_mapel(session) -> dict[str, MataPelajaran]:
    out: dict[str, MataPelajaran] = {}
    for kode, nama, kelompok in MAPEL_SEED:
        result = await session.execute(select(MataPelajaran).where(MataPelajaran.kode_mapel == kode))
        row = result.scalar_one_or_none()
        if not row:
            row = MataPelajaran(kode_mapel=kode, nama_mapel=nama, kelompok=kelompok, is_active=True)
            session.add(row)
            await session.flush()
        else:
            row.nama_mapel = nama
            row.kelompok = kelompok
            row.is_active = True
        out[kode] = row
    print("  SEEDED mata pelajaran")
    return out


async def seed_slot_waktu(session) -> list[SlotWaktu]:
    out: list[SlotWaktu] = []
    for nama, mulai, selesai, urutan in SLOT_SEED:
        result = await session.execute(
            select(SlotWaktu).where(SlotWaktu.jam_mulai == mulai, SlotWaktu.jam_selesai == selesai)
        )
        row = result.scalar_one_or_none()
        if not row:
            row = SlotWaktu(
                nama=nama,
                jam_mulai=mulai,
                jam_selesai=selesai,
                urutan=urutan,
                is_piket=False,
            )
            session.add(row)
            await session.flush()
        else:
            row.nama = nama
            row.urutan = urutan
            row.is_piket = False
        out.append(row)
    print("  SEEDED slot waktu")
    return sorted(out, key=lambda s: s.urutan)


async def seed_kelas(session, ta: TahunAjaran, kategori_map: dict[str, KategoriKelas], teachers: list[User]) -> list[Kelas]:
    kelas_list: list[Kelas] = []
    wali_cycle = cycle(teachers)
    for tingkat in [TingkatKelas.x, TingkatKelas.xi, TingkatKelas.xii]:
        for kode in ["IPA", "IPS", "AGAMA"]:
            nama_kelas = f"{tingkat.value} {kode} 1"
            result = await session.execute(
                select(Kelas).where(
                    Kelas.tahun_ajaran_id == ta.tahun_ajaran_id,
                    Kelas.nama_kelas == nama_kelas,
                )
            )
            row = result.scalar_one_or_none()
            wali = next(wali_cycle)
            if not row:
                row = Kelas(
                    tahun_ajaran_id=ta.tahun_ajaran_id,
                    nama_kelas=nama_kelas,
                    tingkat=tingkat,
                    kategori_kelas_id=kategori_map[kode].kategori_kelas_id,
                    wali_kelas_id=wali.user_id,
                    kapasitas=36,
                )
                session.add(row)
                await session.flush()
            else:
                row.tingkat = tingkat
                row.kategori_kelas_id = kategori_map[kode].kategori_kelas_id
                row.wali_kelas_id = wali.user_id
                row.kapasitas = 36
            kelas_list.append(row)
    print("  SEEDED kelas")
    return kelas_list


async def seed_kurikulum(
    session,
    ta: TahunAjaran,
    kategori_map: dict[str, KategoriKelas],
    mapel_map: dict[str, MataPelajaran],
) -> None:
    for tingkat in [TingkatKelas.x, TingkatKelas.xi, TingkatKelas.xii]:
        for kategori in kategori_map.values():
            for mapel in mapel_map.values():
                result = await session.execute(
                    select(KurikulumMapel).where(
                        KurikulumMapel.tahun_ajaran_id == ta.tahun_ajaran_id,
                        KurikulumMapel.kategori_kelas_id == kategori.kategori_kelas_id,
                        KurikulumMapel.tingkat == tingkat,
                        KurikulumMapel.mapel_id == mapel.mapel_id,
                    )
                )
                if result.scalar_one_or_none():
                    continue
                session.add(
                    KurikulumMapel(
                        tahun_ajaran_id=ta.tahun_ajaran_id,
                        kategori_kelas_id=kategori.kategori_kelas_id,
                        tingkat=tingkat,
                        mapel_id=mapel.mapel_id,
                        is_wajib=mapel.kelompok == KelompokMapel.wajib,
                    )
                )
    print("  SEEDED kurikulum")


async def seed_guru_mapel(
    session,
    ta: TahunAjaran,
    classes: list[Kelas],
    teachers: list[User],
    mapel_map: dict[str, MataPelajaran],
) -> list[GuruMapel]:
    mapel_order = [m for m in mapel_map.values()]
    teacher_cycle = cycle(teachers)
    created: list[GuruMapel] = []
    for kelas in classes:
        for mapel in mapel_order[:6]:
            teacher = next(teacher_cycle)
            result = await session.execute(
                select(GuruMapel).where(
                    GuruMapel.user_id == teacher.user_id,
                    GuruMapel.mapel_id == mapel.mapel_id,
                    GuruMapel.kelas_id == kelas.kelas_id,
                    GuruMapel.tahun_ajaran_id == ta.tahun_ajaran_id,
                )
            )
            row = result.scalar_one_or_none()
            if not row:
                row = GuruMapel(
                    user_id=teacher.user_id,
                    mapel_id=mapel.mapel_id,
                    kelas_id=kelas.kelas_id,
                    tahun_ajaran_id=ta.tahun_ajaran_id,
                )
                session.add(row)
                await session.flush()
            created.append(row)
    print("  SEEDED guru-mapel assignments")
    return created


async def assign_students_to_classes(session, classes: list[Kelas], students: list[User]) -> None:
    by_tingkat = {
        TingkatKelas.x: [k for k in classes if k.tingkat == TingkatKelas.x],
        TingkatKelas.xi: [k for k in classes if k.tingkat == TingkatKelas.xi],
        TingkatKelas.xii: [k for k in classes if k.tingkat == TingkatKelas.xii],
    }

    split = max(1, len(students) // 3)
    groups = [
        (students[:split], TingkatKelas.x),
        (students[split : split * 2], TingkatKelas.xi),
        (students[split * 2 :], TingkatKelas.xii),
    ]

    for group_students, tingkat in groups:
        kelas_group = by_tingkat[tingkat]
        if not kelas_group:
            continue
        class_cycle = cycle(kelas_group)
        for user in group_students:
            kelas = next(class_cycle)
            result = await session.execute(select(SiswaKelas).where(SiswaKelas.user_id == user.user_id))
            existing = result.scalar_one_or_none()
            if existing:
                existing.kelas_id = kelas.kelas_id
            else:
                session.add(SiswaKelas(kelas_id=kelas.kelas_id, user_id=user.user_id))

            profile_result = await session.execute(
                select(SiswaProfile).where(SiswaProfile.user_id == user.user_id)
            )
            profile = profile_result.scalar_one_or_none()
            if profile:
                profile.kelas_jurusan = kelas.nama_kelas
    print("  SEEDED siswa_kelas assignments")


async def seed_jadwal(
    session,
    semester: Semester,
    classes: list[Kelas],
    slots: list[SlotWaktu],
) -> None:
    weekdays = [
        HariSekolah.senin,
        HariSekolah.selasa,
        HariSekolah.rabu,
        HariSekolah.kamis,
        HariSekolah.jumat,
    ]
    teacher_busy: set[tuple[str, str, str]] = set()

    for kelas in classes:
        gm_result = await session.execute(
            select(GuruMapel).where(
                GuruMapel.kelas_id == kelas.kelas_id,
                GuruMapel.tahun_ajaran_id == semester.tahun_ajaran_id,
            )
        )
        gm_list = gm_result.scalars().all()
        if not gm_list:
            continue
        gm_cycle = cycle(gm_list)
        for day in weekdays:
            for slot in slots[:5]:
                selected = None
                for _ in range(len(gm_list)):
                    candidate = next(gm_cycle)
                    busy_key = (day.value, str(slot.slot_id), str(candidate.user_id))
                    if busy_key in teacher_busy:
                        continue
                    selected = candidate
                    teacher_busy.add(busy_key)
                    break
                if not selected:
                    continue

                result = await session.execute(
                    select(Jadwal).where(
                        Jadwal.semester_id == semester.semester_id,
                        Jadwal.kelas_id == kelas.kelas_id,
                        Jadwal.hari == day,
                        Jadwal.slot_waktu_id == slot.slot_id,
                    )
                )
                existing = result.scalar_one_or_none()
                if existing:
                    existing.mapel_id = selected.mapel_id
                    existing.guru_user_id = selected.user_id
                else:
                    session.add(
                        Jadwal(
                            semester_id=semester.semester_id,
                            kelas_id=kelas.kelas_id,
                            mapel_id=selected.mapel_id,
                            guru_user_id=selected.user_id,
                            hari=day,
                            slot_waktu_id=slot.slot_id,
                        )
                    )
    print("  SEEDED jadwal")


async def seed() -> None:
    async with async_session_maker() as session:
        teacher_result = await session.execute(
            select(User).where(User.user_type == UserType.guru, User.is_active.is_(True)).order_by(User.username)
        )
        teachers = teacher_result.scalars().all()
        student_result = await session.execute(
            select(User).where(User.user_type == UserType.siswa, User.is_active.is_(True)).order_by(User.username)
        )
        students = student_result.scalars().all()

        if not teachers or not students:
            raise RuntimeError(
                "Guru/siswa belum ada. Jalankan seed_admins dulu (python scripts/seed_admins.py)."
            )

        ta = await get_or_create_tahun_ajaran(session)
        ganjil, _ = await get_or_create_semester(session, ta)
        await seed_structural_roles_and_assignments(session, ta, teachers)
        kategori_map = await seed_kategori_kelas(session)
        mapel_map = await seed_mapel(session)
        slots = await seed_slot_waktu(session)
        classes = await seed_kelas(session, ta, kategori_map, teachers)
        await seed_kurikulum(session, ta, kategori_map, mapel_map)
        await seed_guru_mapel(session, ta, classes, teachers, mapel_map)
        await assign_students_to_classes(session, classes, students)
        await seed_jadwal(session, ganjil, classes, slots)

        await session.commit()

    await engine.dispose()
    print("\nSeed akademik demo complete.")


if __name__ == "__main__":
    asyncio.run(seed())
