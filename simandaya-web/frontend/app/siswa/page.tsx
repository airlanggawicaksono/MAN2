"use client";

import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, GraduationCap, User } from "lucide-react";
import Link from "next/link";

export default function SiswaDashboard() {
  const user = useAppSelector((s) => s.auth.user);

  const stats = [
    {
      title: "Jadwal Hari Ini",
      description: "Lihat jadwal pelajaran Anda hari ini",
      icon: Calendar,
      href: "/siswa/jadwal",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Nilai Terkini",
      description: "Pantau pencapaian akademik Anda",
      icon: GraduationCap,
      href: "/siswa/nilai",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Rapor Digital",
      description: "Unduh laporan hasil belajar",
      icon: BookOpen,
      href: "/siswa/rapor",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Selamat Datang, {user?.username}
          </h1>
          <p className="text-muted-foreground">
            Panel dashboard Siswa MAN 2 Yogyakarta.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {item.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
