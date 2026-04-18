"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
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

const QUICK_ACTIONS = [
  {
    title: "Data Siswa",
    description: "Lihat, edit, dan hapus data profil seluruh siswa.",
    href: "/admin/manajemen/siswa",
    icon: Users,
    accent: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100 hover:border-blue-300",
  },
  {
    title: "Data Civitas Akademik",
    description: "Kelola data guru dan tenaga kependidikan.",
    href: "/admin/manajemen/civitas",
    icon: ShieldCheck,
    accent: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100 hover:border-violet-300",
  },
  {
    title: "Manajemen Konten",
    description: "Atur carousel, flyer, dan media halaman publik.",
    href: "/admin/manajemen/pengaturan-cms",
    icon: Megaphone,
    accent: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100 hover:border-amber-300",
  },
  {
    title: "Kesiswaan",
    description: "Pantau absensi masuk dan log izin keluar siswa.",
    href: "/admin/kesiswaan/absensi",
    icon: Settings2,
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100 hover:border-emerald-300",
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
    { label: "Total Siswa", value: students?.total ?? "-", accent: "border-l-blue-500" },
    { label: "Total Guru", value: teachers?.total ?? "-", accent: "border-l-emerald-500" },
    { label: "Civitas Publik", value: civitas?.total ?? "-", accent: "border-l-violet-500" },
    { label: "Konten CMS", value: slides?.length ?? "-", accent: "border-l-amber-500" },
  ];

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Banner */}
      <div className="rounded-2xl bg-slate-900 px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
            <LayoutGrid className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Selamat datang kembali,</p>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {user?.username ?? "Admin"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <CalendarDays className="h-4 w-4" />
          <span>{now ? formatDate(now) : ""}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border border-slate-200 border-l-4 ${s.accent} px-5 py-4 shadow-sm`}
          >
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserCircle2 className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Akses Cepat
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`group bg-white rounded-2xl border ${item.border} p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4`}
              >
                <div className={`rounded-xl ${item.bg} p-3 mt-0.5 flex-shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-base">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
                <ArrowRight
                  className={`h-4 w-4 text-slate-300 mt-1 flex-shrink-0 group-hover:${item.accent} group-hover:translate-x-1 transition-all`}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
