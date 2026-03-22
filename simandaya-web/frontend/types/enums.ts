export type JenisKelamin = "Laki-Laki" | "Perempuan";
export type StatusSiswa = "Aktif" | "Non-Aktif" | "Lulus";
export type StatusGuru = "Aktif" | "Non-Aktif";

export type StructuralRole =
  | "Komite Madrasah"
  | "Kepala Madrasah"
  | "Kepala Tata Usaha"
  | "Wakamad Bid. Kurikulum"
  | "Wakamad Bid. Kesiswaan"
  | "Wakamad Bid. Sarpras"
  | "Wakamad Bid. Humas"
  | "Tim IT"
  | "Pengembang Madrasah"
  | "Kepala Laboratorium Terpadu"
  | "Wali Kelas"
  | "Bimbingan Konseling"
  | "Satuan Pendidikan Ramah Anak"
  | "Tim Pendidikan Karakter"
  | "Pembina Ekstrakurikuler"
  | "Satgas Anti Narkoba"
  | "OSIS"
  | "MPK"
  | "PIKR"
  | "KIR"
  | "Robotik"
  | "Koord. OSN/KSN"
  | "PMR dan UKS"
  | "Olahraga"
  | "Seni"
  | "Pecinta Alam"
  | "Corps Mubaligh"
  | "Pramuka"
  | "Laboratorium Komputer"
  | "Tim Adiwiyata"
  | "Publikasi dan Informasi"
  | "Multimedia dan Studio"
  | "Staf Tata Usaha"
  | "Pustakawan"
  | "Laboran"
  | "Petugas UKS";

export const STRUCTURAL_ROLE_OPTIONS: readonly StructuralRole[] = [
  "Komite Madrasah",
  "Kepala Madrasah",
  "Kepala Tata Usaha",
  "Wakamad Bid. Kurikulum",
  "Wakamad Bid. Kesiswaan",
  "Wakamad Bid. Sarpras",
  "Wakamad Bid. Humas",
  "Tim IT",
  "Pengembang Madrasah",
  "Kepala Laboratorium Terpadu",
  "Wali Kelas",
  "Bimbingan Konseling",
  "Satuan Pendidikan Ramah Anak",
  "Tim Pendidikan Karakter",
  "Pembina Ekstrakurikuler",
  "Satgas Anti Narkoba",
  "OSIS",
  "MPK",
  "PIKR",
  "KIR",
  "Robotik",
  "Koord. OSN/KSN",
  "PMR dan UKS",
  "Olahraga",
  "Seni",
  "Pecinta Alam",
  "Corps Mubaligh",
  "Pramuka",
  "Laboratorium Komputer",
  "Tim Adiwiyata",
  "Publikasi dan Informasi",
  "Multimedia dan Studio",
  "Staf Tata Usaha",
  "Pustakawan",
  "Laboran",
  "Petugas UKS",
] as const;
