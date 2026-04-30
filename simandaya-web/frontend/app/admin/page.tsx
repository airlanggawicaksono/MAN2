"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Megaphone,
  Settings2,
  ShieldCheck,
  Users,
  UserCircle2,
  LayoutGrid,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useListStudentsQuery } from "@/api/admin/students";
import { useListTeachersQuery } from "@/api/admin/teachers";
import { useListPublicCivitasQuery } from "@/api/admin/userman";
import { useListSlidesQuery } from "@/api/admin/setContentManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";

const QUICK_ACTIONS = [
  {
    title: "Data Siswa",
    description: "Lihat, edit, dan hapus data profil seluruh siswa.",
    href: "/admin/manajemen/siswa",
    icon: Users,
  },
  {
    title: "Data Civitas Akademik",
    description: "Kelola data guru dan tenaga kependidikan.",
    href: "/admin/manajemen/civitas",
    icon: ShieldCheck,
  },
  {
    title: "Manajemen Konten",
    description: "Atur carousel, flyer, dan media halaman publik.",
    href: "/admin/manajemen/pengaturan-cms",
    icon: Megaphone,
  },
  {
    title: "Kesiswaan",
    description: "Pantau absensi masuk dan log izin keluar siswa.",
    href: "/admin/kesiswaan/absensi",
    icon: Settings2,
  },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const { data: students } = useListStudentsQuery({ skip: 0, limit: 1 });
  const { data: teachers } = useListTeachersQuery({ skip: 0, limit: 1 });
  const { data: civitas } = useListPublicCivitasQuery({ skip: 0, limit: 1 });
  const { data: slides } = useListSlidesQuery();

  const stats = [
    { label: "Total Siswa", value: students?.total ?? "-" },
    { label: "Total Guru", value: teachers?.total ?? "-" },
    { label: "Civitas Publik", value: civitas?.total ?? "-" },
    { label: "Konten CMS", value: slides?.length ?? "-" },
  ];

  return (
    <AdminPageShell
      title="Dasbor Admin"
      description="Ringkasan operasional dan akses cepat modul manajemen."
    >
      <Card className="border-border/70 bg-card">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border/70 bg-muted/45">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selamat datang kembali</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {user?.username ?? "Admin"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{now ? formatDate(now) : ""}</span>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Akses Cepat
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((item) => (
            <Link key={item.href} href={item.href} className="h-full">
              <Card className="h-full border-border/70 transition-colors duration-200 hover:border-primary/35">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="mt-0.5 rounded-md border border-border/70 bg-muted/45 p-2.5">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
