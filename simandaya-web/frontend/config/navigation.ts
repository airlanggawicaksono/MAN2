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

export const publicNav: NavLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Absensi", href: "/absensi" },
];

export const adminNav: NavItem[] = [
  { label: "Beranda", href: "/" },
  {
    label: "Kesiswaan",
    width: "w-[240px]",
    children: [
      { label: "Absensi Masuk Sekolah", href: "/admin/kesiswaan/absensi" },
      { label: "Izin Kesiswaan", href: "/admin/kesiswaan/izin" },
    ],
  },
  {
    label: "Manajemen Data",
    width: "w-[280px]",
    children: [
      { label: "Penambahan Data Siswa", href: "/admin/manajemen/siswa" },
      { label: "Penambahan Data Civitas Akademik", href: "/admin/manajemen/civitas" },
      { label: "Pengaturan Manajemen Konten", href: "/admin/manajemen/pengaturan-cms" },
    ],
  },
];

export function getNavForRole(role?: UserType): NavItem[] {
  switch (role) {
    case "Admin":
      return adminNav;
    default:
      return publicNav;
  }
}
