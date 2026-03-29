"""
Seed demo data for:
- Structural role assignments
- Manajemen akademik (multi tahun ajaran + semester, kategori kelas, kelas, mapel, kurikulum)
- Penugasan guru-mapel
- Jadwal pelajaran
- Assign siswa ke kelas + histori kelas (terutama XI/XII)
- Tugas, nilai, submission, dan rapor historis lintas semester

Run inside backend container:
    python scripts/seed_academic_demo.py
"""

import asyncio
import sys
from uuid import UUID
from datetime import date, datetime, time, timedelta, timezone
from itertools import cycle
from pathlib import Path

from sqlalchemy import and_, delete, select, update

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import async_session_maker, engine
from app.enums import (
    HariSekolah,
    KelompokMapel,
    JenisTugas,
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
from app.models.tugas import Tugas
from app.models.tugas_submission import TugasSubmission
from app.models.nilai import Nilai
from app.models.rapor import Rapor
from app.models.user import User
from app.services.rapor_service import RaporService
from app.dto.rapor.rapor_dto import GenerateRaporDTO

TA_SEED = [
    ("2024/2025", date(2024, 7, 1), date(2025, 6, 30), False),
    ("2025/2026", date(2025, 7, 1), date(2026, 6, 30), False),
    ("2026/2027", date(2026, 7, 1), date(2027, 6, 30), True),
]

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

SEED_LINK_SUBMISSION = (
    "https://docs.google.com/forms/d/e/"
    "1FAIpQLSd3lgYP_fdsjQrVqin1zREbARMi3U_pokjhUzLUGzzkaneIbg/viewform?usp=dialog"
)
SEED_LINK_TUGAS = (
    "https://drive.google.com/file/d/1gOE6ivff6umch-OI5ai5KQlptntnfo7o/view?usp=sharing"
)


async def get_or_create_tahun_ajaran(
    session,
    name: str,
    mulai: date,
    selesai: date,
    is_active: bool,
) -> TahunAjaran:
    result = await session.execute(select(TahunAjaran).where(TahunAjaran.nama == name))
    ta = result.scalar_one_or_none()
    if ta:
        ta.tanggal_mulai = mulai
        ta.tanggal_selesai = selesai
        ta.is_active = is_active
        return ta

    ta = TahunAjaran(
        nama=name,
        tanggal_mulai=mulai,
        tanggal_selesai=selesai,
        is_active=is_active,
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

    ganjil_mulai = date(ta.tanggal_mulai.year, 7, 1)
    ganjil_selesai = date(ta.tanggal_mulai.year, 12, 31)
    genap_mulai = date(ta.tanggal_selesai.year, 1, 1)
    genap_selesai = ta.tanggal_selesai

    ganjil = await _upsert(
        TipeSemester.ganjil,
        ganjil_mulai,
        ganjil_selesai,
        bool(ta.is_active),
    )
    genap = await _upsert(
        TipeSemester.genap,
        genap_mulai,
        genap_selesai,
        False,
    )
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


def infer_kategori_from_kelas_name(nama_kelas: str) -> str:
    upper = nama_kelas.upper()
    if " IPA " in f" {upper} ":
        return "IPA"
    if " IPS " in f" {upper} ":
        return "IPS"
    if " AGAMA " in f" {upper} ":
        return "AGAMA"
    return "IPA"


async def assign_students_to_classes(
    session,
    classes: list[Kelas],
    students: list[User],
) -> dict[UUID, Kelas]:
    by_tingkat = {
        TingkatKelas.x: [k for k in classes if k.tingkat == TingkatKelas.x],
        TingkatKelas.xi: [k for k in classes if k.tingkat == TingkatKelas.xi],
        TingkatKelas.xii: [k for k in classes if k.tingkat == TingkatKelas.xii],
    }
    class_id_set = {k.kelas_id for k in classes}
    assigned_active: dict[UUID, Kelas] = {}

    async def assign_one(user: User, kelas: Kelas) -> None:
        result = await session.execute(
            select(SiswaKelas)
            .where(SiswaKelas.user_id == user.user_id)
            .where(SiswaKelas.kelas_id.in_(class_id_set))
        )
        existing_rows = result.scalars().all()
        current_row = next((row for row in existing_rows if row.kelas_id == kelas.kelas_id), None)
        if not current_row:
            session.add(SiswaKelas(kelas_id=kelas.kelas_id, user_id=user.user_id))
        for row in existing_rows:
            if row.kelas_id != kelas.kelas_id:
                await session.delete(row)

        profile_result = await session.execute(
            select(SiswaProfile).where(SiswaProfile.user_id == user.user_id)
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            profile.kelas_jurusan = kelas.nama_kelas
        assigned_active[user.user_id] = kelas

    # Force one dense class with at least 40 students for UI/performance testing.
    xii_classes = by_tingkat[TingkatKelas.xii]
    dense_target = next(
        (k for k in xii_classes if " IPA " in f" {k.nama_kelas.upper()} "),
        xii_classes[0] if xii_classes else classes[0],
    )
    dense_count = min(40, len(students))
    preferred_student = next(
        (user for user in students if user.username == "wicaksono_student"),
        None,
    )
    dense_students: list[User] = []
    if preferred_student is not None:
        dense_students.append(preferred_student)
    for user in students:
        if preferred_student is not None and user.user_id == preferred_student.user_id:
            continue
        if len(dense_students) >= dense_count:
            break
        dense_students.append(user)
    dense_student_ids = {user.user_id for user in dense_students}
    for user in dense_students:
        await assign_one(user, dense_target)

    remaining_students = [user for user in students if user.user_id not in dense_student_ids]
    split = max(1, len(remaining_students) // 3) if remaining_students else 0
    groups = [
        (remaining_students[:split], TingkatKelas.x),
        (remaining_students[split : split * 2], TingkatKelas.xi),
        (remaining_students[split * 2 :], TingkatKelas.xii),
    ]

    for group_students, tingkat in groups:
        kelas_group = by_tingkat[tingkat]
        if tingkat == dense_target.tingkat:
            without_dense = [k for k in kelas_group if k.kelas_id != dense_target.kelas_id]
            if without_dense:
                kelas_group = without_dense
        if not kelas_group:
            continue
        class_cycle = cycle(kelas_group)
        for user in group_students:
            kelas = next(class_cycle)
            await assign_one(user, kelas)

    print(f"  SEEDED siswa_kelas assignments (dense class: {dense_target.nama_kelas} = {dense_count} siswa)")
    return assigned_active


async def seed_student_history_assignments(
    session,
    assigned_active: dict[UUID, Kelas],
    classes_by_ta_name: dict[str, list[Kelas]],
) -> None:
    seed_user_ids = list(assigned_active.keys())
    history_class_ids = [
        kelas.kelas_id
        for ta_name, ta_classes in classes_by_ta_name.items()
        if ta_name in {"2024/2025", "2025/2026"}
        for kelas in ta_classes
    ]
    if seed_user_ids and history_class_ids:
        await session.execute(
            delete(SiswaKelas).where(
                SiswaKelas.user_id.in_(seed_user_ids),
                SiswaKelas.kelas_id.in_(history_class_ids),
            )
        )

    class_index: dict[tuple[str, TingkatKelas, str], Kelas] = {}
    for ta_name, ta_classes in classes_by_ta_name.items():
        for kelas in ta_classes:
            kategori = infer_kategori_from_kelas_name(kelas.nama_kelas)
            class_index[(ta_name, kelas.tingkat, kategori)] = kelas

    for user_id, active_kelas in assigned_active.items():
        kategori = infer_kategori_from_kelas_name(active_kelas.nama_kelas)
        if active_kelas.tingkat == TingkatKelas.x:
            continue

        if active_kelas.tingkat == TingkatKelas.xi:
            hist_class = class_index.get(("2025/2026", TingkatKelas.x, kategori))
            if hist_class:
                session.add(SiswaKelas(kelas_id=hist_class.kelas_id, user_id=user_id))
            continue

        # Tingkat XII gets XI (2025/2026) + X (2024/2025) history.
        hist_specs = [
            ("2025/2026", TingkatKelas.xi),
            ("2024/2025", TingkatKelas.x),
        ]
        for ta_name, tingkat in hist_specs:
            hist_class = class_index.get((ta_name, tingkat, kategori))
            if not hist_class:
                continue
            session.add(SiswaKelas(kelas_id=hist_class.kelas_id, user_id=user_id))

    print("  SEEDED historical siswa_kelas rows for XI/XII")


async def seed_jadwal(
    session,
    semester: Semester,
    classes: list[Kelas],
    slots: list[SlotWaktu],
) -> None:
    # Idempotent and safe against uq_jadwal_guru_slot:
    # wipe jadwal for target semester, then insert fresh rows.
    await session.execute(delete(Jadwal).where(Jadwal.semester_id == semester.semester_id))
    await session.flush()

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


async def seed_penilaian_and_rapor(
    session,
    ta: TahunAjaran,
    semester: Semester,
    classes: list[Kelas],
    publish_rapor: bool,
) -> None:
    # Reset seeded tugas for this semester so reruns stay deterministic.
    await session.execute(
        delete(Tugas).where(
            and_(
                Tugas.semester_id == semester.semester_id,
                Tugas.judul.like("[SEED RAPOR]%"),
            )
        )
    )
    # Reset rapor for this semester so pre-seed can regenerate from fresh nilai.
    await session.execute(delete(Rapor).where(Rapor.semester_id == semester.semester_id))
    await session.flush()

    jenis_order = [JenisTugas.tugas, JenisTugas.uts, JenisTugas.uas]
    semester_start_dt = datetime.combine(semester.tanggal_mulai, time(7, 0), tzinfo=timezone.utc)
    semester_end_dt = datetime.combine(semester.tanggal_selesai, time(15, 0), tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    eligible_kelas_ids: set[UUID] = set()

    for kelas_idx, kelas in enumerate(classes):
        gm_result = await session.execute(
            select(GuruMapel).where(
                GuruMapel.kelas_id == kelas.kelas_id,
                GuruMapel.tahun_ajaran_id == ta.tahun_ajaran_id,
            )
        )
        assignments = gm_result.scalars().all()
        if not assignments:
            continue

        student_rows = await session.execute(
            select(SiswaKelas.user_id).where(SiswaKelas.kelas_id == kelas.kelas_id)
        )
        student_ids = list(student_rows.scalars().all())
        if not student_ids:
            continue
        eligible_kelas_ids.add(kelas.kelas_id)

        # Keep seed size moderate but complete for rapor demo.
        for mapel_idx, gm in enumerate(assignments[:6]):
            for jenis_idx, jenis in enumerate(jenis_order):
                total_days = max(10, (semester.tanggal_selesai - semester.tanggal_mulai).days)
                deadline_offset = min(total_days - 1, 14 + jenis_idx * 10 + mapel_idx)
                deadline_dt = semester_start_dt + timedelta(days=deadline_offset)

                tugas = Tugas(
                    semester_id=semester.semester_id,
                    kelas_id=kelas.kelas_id,
                    mapel_id=gm.mapel_id,
                    created_by=gm.user_id,
                    jenis=jenis,
                    judul=f"[SEED RAPOR] {kelas.nama_kelas} {jenis.value} {mapel_idx + 1}",
                    deskripsi="Data seed otomatis untuk simulasi rapor.",
                    link_tugas=SEED_LINK_TUGAS,
                    link_submission=SEED_LINK_SUBMISSION,
                    deadline=deadline_dt,
                    is_published_to_students=True,
                    is_nilai_published_to_students=True,
                )
                session.add(tugas)
                await session.flush()

                for student_idx, student_id in enumerate(student_ids):
                    score = 65 + ((kelas_idx * 7 + mapel_idx * 5 + jenis_idx * 11 + student_idx * 3) % 31)
                    session.add(
                        Nilai(
                            tugas_id=tugas.tugas_id,
                            user_id=student_id,
                            nilai=float(score),
                            catatan=f"Seed {jenis.value}",
                        )
                    )
                    if (student_idx + jenis_idx + mapel_idx) % 2 == 0:
                        session.add(
                            TugasSubmission(
                                tugas_id=tugas.tugas_id,
                                user_id=student_id,
                                submission_link=SEED_LINK_SUBMISSION,
                                jawaban_text=None,
                                submitted_at=min(deadline_dt, semester_end_dt),
                                updated_at=min(deadline_dt, semester_end_dt),
                            )
                        )

    await session.flush()

    admin_result = await session.execute(
        select(User).where(
            User.user_type == UserType.admin,
            User.is_active.is_(True),
        )
    )
    admin = admin_result.scalar_one_or_none()
    if not admin:
        raise RuntimeError("Admin user tidak ditemukan untuk pre-seed rapor.")

    rapor_service = RaporService(session)
    generated = 0
    for kelas in classes:
        if kelas.kelas_id not in eligible_kelas_ids:
            continue
        await rapor_service.generate_rapor(
            GenerateRaporDTO(kelas_id=kelas.kelas_id, semester_id=semester.semester_id),
            admin,
        )
        generated += 1

    if publish_rapor:
        await session.execute(
            update(Rapor)
            .where(Rapor.semester_id == semester.semester_id)
            .values(
                is_published=True,
                published_at=now,
                published_by=admin.user_id,
            )
        )

    print(
        f"  SEEDED tugas, nilai, dan {'published' if publish_rapor else 'draft'} rapor untuk {generated} kelas"
    )


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

        await session.execute(update(TahunAjaran).values(is_active=False))

        ta_states: list[dict] = []
        for ta_name, mulai, selesai, is_active in TA_SEED:
            ta = await get_or_create_tahun_ajaran(
                session,
                ta_name,
                mulai,
                selesai,
                is_active,
            )
            ganjil, genap = await get_or_create_semester(session, ta)
            ta_states.append(
                {
                    "name": ta_name,
                    "ta": ta,
                    "ganjil": ganjil,
                    "genap": genap,
                    "classes": [],
                }
            )

        active_state = next((state for state in ta_states if state["ta"].is_active), None)
        if not active_state:
            raise RuntimeError("Tidak ada tahun ajaran aktif pada konfigurasi seed.")

        await seed_structural_roles_and_assignments(session, active_state["ta"], teachers)
        kategori_map = await seed_kategori_kelas(session)
        mapel_map = await seed_mapel(session)
        slots = await seed_slot_waktu(session)

        for state in ta_states:
            classes = await seed_kelas(session, state["ta"], kategori_map, teachers)
            state["classes"] = classes
            await seed_kurikulum(session, state["ta"], kategori_map, mapel_map)
            await seed_guru_mapel(session, state["ta"], classes, teachers, mapel_map)
            await seed_jadwal(session, state["ganjil"], classes, slots)

        assigned_active = await assign_students_to_classes(
            session,
            active_state["classes"],
            students,
        )
        classes_by_ta_name = {state["name"]: state["classes"] for state in ta_states}
        await seed_student_history_assignments(session, assigned_active, classes_by_ta_name)

        for state in ta_states:
            await seed_penilaian_and_rapor(
                session,
                state["ta"],
                state["ganjil"],
                state["classes"],
                publish_rapor=True,
            )
            await seed_penilaian_and_rapor(
                session,
                state["ta"],
                state["genap"],
                state["classes"],
                publish_rapor=True,
            )

        await session.commit()

    await engine.dispose()
    print("\nSeed akademik demo complete.")


if __name__ == "__main__":
    asyncio.run(seed())
