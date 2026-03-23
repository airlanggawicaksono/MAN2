from enum import Enum


class UserType(Enum):
    siswa = "Siswa"
    guru = "Guru"
    admin = "Admin"


class StatusSiswa(Enum):
    aktif = "Aktif"
    nonaktif = "Non-Aktif"
    lulus = "Lulus"


class idType(Enum):
    nis = "NIS"
    nik = "NIK"


class StatusGuru(Enum):
    aktif = "Aktif"
    nonaktif = "Non-Aktif"


class JenisKelamin(Enum):
    laki_laki = "Laki-Laki"
    perempuan = "Perempuan"


class StructuralRole(Enum):
    # ── Pimpinan ──────────────────────────────────────────────────────────
    komite_madrasah = "Komite Madrasah"
    kepala_madrasah = "Kepala Madrasah"
    kepala_tata_usaha = "Kepala Tata Usaha"

    # ── Wakamad ───────────────────────────────────────────────────────────
    wakamad_kurikulum = "Wakamad Bid. Kurikulum"
    wakamad_kesiswaan = "Wakamad Bid. Kesiswaan"
    wakamad_sarpras = "Wakamad Bid. Sarpras"
    wakamad_humas = "Wakamad Bid. Humas"

    # ── Di bawah Kurikulum ────────────────────────────────────────────────
    tim_it = "Tim IT"
    pengembang_madrasah = "Pengembang Madrasah"
    kepala_laboratorium_terpadu = "Kepala Laboratorium Terpadu"

    # ── Di bawah Kesiswaan ────────────────────────────────────────────────
    bimbingan_konseling = "Bimbingan Konseling"
    satuan_pendidikan_ramah_anak = "Satuan Pendidikan Ramah Anak"
    tim_pendidikan_karakter = "Tim Pendidikan Karakter"
    pembina_ekstrakurikuler = "Pembina Ekstrakurikuler"

    # ── Organisasi / Kegiatan Siswa (Pembina) ─────────────────────────────
    satgas_anti_narkoba = "Satgas Anti Narkoba"
    pembina_osis = "OSIS"
    pembina_mpk = "MPK"
    pembina_pikr = "PIKR"
    pembina_kir = "KIR"
    pembina_robotik = "Robotik"
    koordinator_osn_ksn = "Koord. OSN/KSN"
    pembina_pmr_uks = "PMR dan UKS"
    pembina_olahraga = "Olahraga"
    pembina_seni = "Seni"
    pembina_pecinta_alam = "Pecinta Alam"
    pembina_corps_mubaligh = "Corps Mubaligh"
    pembina_pramuka = "Pramuka"

    # ── Di bawah Sarpras ──────────────────────────────────────────────────
    laboratorium_komputer = "Laboratorium Komputer"
    tim_adiwiyata = "Tim Adiwiyata"

    # ── Di bawah Humas ────────────────────────────────────────────────────
    publikasi_informasi = "Publikasi dan Informasi"
    multimedia_studio = "Multimedia dan Studio"

    # ── Umum ──────────────────────────────────────────────────────────────
    staf_tata_usaha = "Staf Tata Usaha"
    pustakawan = "Pustakawan"
    laboran = "Laboran"
    petugas_uks = "Petugas UKS"


class StatusAbsensi(Enum):
    hadir = "Hadir"
    terlambat = "Terlambat"
    alfa = "Alfa"
    sakit = "Sakit"
    izin = "Izin"


# ── Akademik Enums ───────────────────────────────────────────────────────────


class TipeSemester(Enum):
    ganjil = "Ganjil"
    genap = "Genap"


class KelompokMapel(Enum):
    wajib = "Wajib"
    peminatan = "Peminatan"
    muatan_lokal = "Muatan Lokal"
    keagamaan = "Keagamaan"


class TingkatKelas(Enum):
    x = "X"
    xi = "XI"
    xii = "XII"


class HariSekolah(Enum):
    senin = "Senin"
    selasa = "Selasa"
    rabu = "Rabu"
    kamis = "Kamis"
    jumat = "Jumat"


class JenisKalender(Enum):
    libur_nasional = "Libur Nasional"
    libur_sekolah = "Libur Sekolah"
    ujian = "Ujian"
    kegiatan_sekolah = "Kegiatan Sekolah"
    hari_efektif = "Hari Efektif"


class RegistrationStatus(Enum):
    pending = "Pending"
    completed = "Completed"


# ── Penilaian Enums ──────────────────────────────────────────────────────────


class JenisTugas(Enum):
    tugas = "Tugas"
    ulangan_harian = "Ulangan Harian"
    uts = "UTS"
    uas = "UAS"
    ujian_praktik = "Ujian Praktik"
    proyek = "Proyek"
