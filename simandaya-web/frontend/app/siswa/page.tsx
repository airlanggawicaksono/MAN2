"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Calendar, GraduationCap, User } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { DashboardActionCard } from "@/app/components/dashboard-action-card";
import { DashboardHeader } from "@/app/components/dashboard-header";

const SiswaProfileCard = dynamic(
  () => import("@/app/components/siswa-profile-card").then((m) => ({ default: m.SiswaProfileCard })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);

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
    title: "Tugas, Nilai & Rapor",
    description: "Lihat tugas, hasil nilai, dan ringkasan rapor",
    icon: GraduationCap,
    href: "/siswa/nilai",
    colorClass: "text-green-600",
    bgClass: "bg-green-100",
  },
  {
    title: "Progres Akademik",
    description: "Akses cepat ke halaman gabungan",
    icon: BookOpen,
    href: "/siswa/nilai",
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
