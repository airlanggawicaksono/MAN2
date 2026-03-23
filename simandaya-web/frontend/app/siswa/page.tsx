"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, GraduationCap, User } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { DashboardActionCard } from "@/app/components/dashboard-action-card";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { SiswaProfileCard } from "@/app/components/siswa-profile-card";

const actions = [
  {
    title: "Jadwal Hari Ini",
    description: "Lihat jadwal pelajaran Anda hari ini",
    icon: Calendar,
    href: "/siswa/jadwal",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Nilai Terkini",
    description: "Pantau pencapaian akademik Anda",
    icon: GraduationCap,
    href: "/siswa/nilai",
    colorClass: "text-green-600",
    bgClass: "bg-green-100",
  },
  {
    title: "Rapor Digital",
    description: "Unduh laporan hasil belajar",
    icon: BookOpen,
    href: "/siswa/rapor",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-100",
  },
];

export default function SiswaDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="space-y-8 p-8">
      <DashboardHeader
        icon={User}
        title={hydrated && user?.username ? `Selamat Datang, ${user.username}` : "Selamat Datang"}
        subtitle="Panel dashboard Siswa MAN 2 Yogyakarta."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {actions.map((item) => (
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

      <SiswaProfileCard />
    </div>
  );
}
