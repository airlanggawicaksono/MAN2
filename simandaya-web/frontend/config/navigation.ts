import type { UserType } from "@/types/auth";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  children: NavLink[];
  width?: string;
}

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export const roleRoutePrefix: Record<UserType, string> = {
  Admin: "/admin",
  Guru: "/guru",
  Siswa: "/siswa",
};

export const generalNav: NavItem[] = [
  { label: "Beranda", href: "/general" },
  { label: "Struktur Organisasi", href: "/general/struktur-organisasi" },
  {
    label: "Layanan",
    width: "w-[240px]",
    children: [
      { label: "Layanan Akademik", href: "/general/layanan-akademik" },
      { label: "Layanan Publik", href: "/general/layanan-publik" },
      { label: "Layanan PTK", href: "/general/layanan-ptk" },
    ],
  },
  { label: "Absensi", href: "/general/absensi" },
];

export const adminNav: NavItem[] = [
  { label: "Dasbor Admin", href: "/admin" },
  {
    label: "Manajemen Data",
    width: "w-[280px]",
    children: [
      { label: "Pengaturan Data Siswa", href: "/admin/manajemen/siswa" },
      { label: "Pengaturan Data Civitas Akademik", href: "/admin/manajemen/civitas" },
      { label: "Pengaturan Manajemen Konten", href: "/admin/manajemen/pengaturan-cms" },
    ],
  },
  {
    label: "Kesiswaan",
    width: "w-[240px]",
    children: [
      { label: "Absensi Masuk Sekolah", href: "/admin/kesiswaan/absensi" },
      { label: "Izin Kesiswaan", href: "/admin/kesiswaan/izin" },
    ],
  },

  {
    label: "Akademik",
    width: "w-[240px]",
    children: [
      { label: "Manajemen Akademik", href: "/admin/manajemen/akademik" },
      { label: "Kelas, Guru & Siswa", href: "/admin/manajemen/akademik/kelas-guru-siswa" },
      { label: "Manajemen Jadwal", href: "/admin/manajemen/akademik/jadwal" },
    ],
  },
];

export const guruNav: NavItem[] = [
  { label: "Dasbor Guru", href: "/guru" },
  { label: "Jadwal Mengajar", href: "/guru/jadwal" },
  { label: "Penilaian Siswa", href: "/guru/penilaian" },
  { label: "Wali Kelas (Rapor)", href: "/guru/rapor" },
];

export const siswaNav: NavItem[] = [
  { label: "Dasbor Siswa", href: "/siswa" },
  { label: "Jadwal Pelajaran", href: "/siswa/jadwal" },
  { label: "Nilai Saya", href: "/siswa/nilai" },
  { label: "Rapor Digital", href: "/siswa/rapor" },
];

export function getNavForRole(role?: UserType): NavItem[] {
  switch (role) {
    case "Admin":
      return adminNav;
    case "Guru":
      return guruNav;
    case "Siswa":
      return siswaNav;
    default:
      return generalNav;
  }
}
