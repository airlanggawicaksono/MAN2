"use client";

import { Calendar, ClipboardCheck, GraduationCap, User } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { DashboardActionCard } from "@/app/components/dashboard-action-card";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { GuruProfileCard } from "@/app/components/guru-profile-card";

const actions = [
  {
    title: "Jadwal Mengajar",
    description: "Lihat jadwal mengajar Anda hari ini",
    icon: Calendar,
    href: "/guru/jadwal",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Penilaian Siswa",
    description: "Input dan kelola nilai mata pelajaran",
    icon: GraduationCap,
    href: "/guru/penilaian",
    colorClass: "text-green-600",
    bgClass: "bg-green-100",
  },
  {
    title: "Wali Kelas",
    description: "Manajemen rapor dan absensi kelas",
    icon: ClipboardCheck,
    href: "/guru/rapor",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-100",
  },
];

export default function GuruDashboard() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-8 p-8">
      <DashboardHeader
        icon={User}
        title={`Selamat Datang, ${user?.username ?? ""}`}
        subtitle="Panel dashboard Guru / Tenaga Pendidik MAN 2 Yogyakarta."
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

      <GuruProfileCard />
    </div>
  );
}
