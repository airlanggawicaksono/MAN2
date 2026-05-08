"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Megaphone,
  Settings2,
  ShieldCheck,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useListStudentsQuery } from "@/api/admin/students";
import { useListTeachersQuery } from "@/api/admin/teachers";
import { useListPublicCivitasQuery } from "@/api/admin/userman";
import { useListSlidesQuery } from "@/api/admin/setContentManagement";
import { StatLineSkeleton } from "@/app/components/skeletons";

const QUICK_ACTIONS = [
  {
    title: "Data Siswa",
    description: "Lihat, edit, dan kelola profil seluruh siswa.",
    href: "/admin/manajemen/siswa",
    icon: Users,
  },
  {
    title: "Civitas Akademik",
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

function StatLine({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-base font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    </span>
  );
}

export default function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const studentsQuery = useListStudentsQuery({ skip: 0, limit: 1 });
  const teachersQuery = useListTeachersQuery({ skip: 0, limit: 1 });
  const civitasQuery = useListPublicCivitasQuery({ skip: 0, limit: 1 });
  const slidesQuery = useListSlidesQuery();

  const statsLoading =
    studentsQuery.isLoading ||
    teachersQuery.isLoading ||
    civitasQuery.isLoading ||
    slidesQuery.isLoading;

  const stats = [
    { label: "Siswa", value: studentsQuery.data?.total ?? "—" },
    { label: "Guru", value: teachersQuery.data?.total ?? "—" },
    { label: "Civitas", value: civitasQuery.data?.total ?? "—" },
    { label: "Konten", value: slidesQuery.data?.length ?? "—" },
  ];

  return (
    <div className="w-full space-y-8 px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Dasbor Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Selamat datang, {user?.username ?? "Admin"}.
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {now ? formatDate(now) : "Memuat tanggal..."}
        </p>
      </header>

      {statsLoading ? (
        <StatLineSkeleton count={stats.length} />
      ) : (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-y border-border/60 py-3">
          {stats.map((s, i) => (
            <span key={s.label} className="flex items-center gap-8">
              <StatLine label={s.label} value={s.value} />
              {i < stats.length - 1 ? (
                <span aria-hidden className="hidden h-4 w-px bg-border md:inline-block" />
              ) : null}
            </span>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Modul Operasional
          </h2>
          <span className="text-xs text-muted-foreground">{QUICK_ACTIONS.length} modul</span>
        </div>

        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/70 bg-card">
          {QUICK_ACTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-start gap-4 px-4 py-4 transition-colors duration-200 hover:bg-accent/30 focus-visible:bg-accent/30 sm:px-6"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/50 text-primary transition-colors group-hover:border-primary/40 group-hover:bg-accent/40">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{item.title}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
