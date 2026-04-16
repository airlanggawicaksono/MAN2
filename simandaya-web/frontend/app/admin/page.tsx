"use client";

import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useListStudentsQuery } from "@/api/admin/students";
import { useListTeachersQuery } from "@/api/admin/teachers";
import { useListPublicCivitasQuery } from "@/api/admin/userman";
import { useListSlidesQuery } from "@/api/admin/setContentManagement";
import { DashboardActionCard } from "@/app/components/dashboard-action-card";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { DashboardStatCard } from "@/app/components/dashboard-stat-card";

const quickActions = [
  {
    title: "Data Siswa",
    description: "Kelola akun dan profil siswa.",
    href: "/admin/manajemen/siswa",
    icon: Users,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Data Civitas",
    description: "Kelola data guru dan tenaga kependidikan.",
    href: "/admin/manajemen/civitas",
    icon: ShieldCheck,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Manajemen Akademik",
    description: "Atur tahun ajaran, semester, mapel, kurikulum.",
    href: "/admin/manajemen/akademik",
    icon: BookOpenCheck,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Jadwal",
    description: "Atur jadwal pembelajaran per kelas.",
    href: "/admin/manajemen/akademik/jadwal",
    icon: CalendarDays,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Konten CMS",
    description: "Kelola carousel, flyer, dan media website.",
    href: "/admin/manajemen/pengaturan-cms",
    icon: Megaphone,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Kesiswaan",
    description: "Pantau absensi masuk dan izin siswa.",
    href: "/admin/kesiswaan/absensi",
    icon: Settings,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
];

export default function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: students } = useListStudentsQuery({ skip: 0, limit: 1 });
  const { data: teachers } = useListTeachersQuery({ skip: 0, limit: 1 });
  const { data: civitas } = useListPublicCivitasQuery({ skip: 0, limit: 1 });
  const { data: slides } = useListSlidesQuery();

  const statCards = [
    {
      title: "Total Siswa",
      value: students?.total ?? 0,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-100",
      icon: Users,
    },
    {
      title: "Total Guru",
      value: teachers?.total ?? 0,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-100",
      icon: User,
    },
    {
      title: "Civitas Publik",
      value: civitas?.total ?? 0,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-100",
      icon: ShieldCheck,
    },
    {
      title: "Konten CMS",
      value: slides?.length ?? 0,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-100",
      icon: Megaphone,
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <DashboardHeader
        icon={LayoutDashboard}
        title={hydrated && user?.username ? `Dasbor Admin,` : "Dasbor Admin"}
        subtitle="Ringkasan sistem dan akses cepat pengelolaan SIMANDAYA."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <DashboardStatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
            colorClass={item.colorClass}
            bgClass={item.bgClass}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((item) => (
          <DashboardActionCard
            key={item.title}
            title={item.title}
            description={item.description}
            href={item.href}
            icon={item.icon}
            colorClass={item.colorClass}
            bgClass={item.bgClass}
          />
        ))}
      </div>
    </div>
  );
}
