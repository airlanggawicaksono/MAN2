"use client";

import { Calendar, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { ServiceLinkCard } from "@/app/components/service-link-card";
import { ServicePageHeader } from "@/app/components/service-page-header";
import { useAppSelector } from "@/store/hooks";
import { notifyError } from "@/lib/app-notify";

const LAYANAN_AKADEMIK = [
  {
    title: "Tugas, Nilai & Rapor",
    description:
      "Akses halaman tugas siswa, nilai per mata pelajaran, dan rapor digital.",
    link: "/siswa/nilai",
    targetPath: "/siswa/nilai",
    image: "/images/layanan/ard.jpg",
    icon: GraduationCap,
    requiresStudentLogin: true,
  },
  {
    title: "Jadwal Pelajaran",
    description:
      "Informasi jadwal pelajaran, kalender akademik, dan agenda kegiatan madrasah.",
    link: "/siswa/jadwal",
    targetPath: "/siswa/jadwal",
    image: "/images/layanan/jadwal.jpg",
    icon: Calendar,
    requiresStudentLogin: true,
  },
  {
    title: "SIJINAK",
    description:
      "Sistem Izin dan Absensi Kesiswaan (SIJINAK) untuk monitoring kehadiran siswa.",
    link: "/general/absensi",
    targetPath: "/general/absensi",
    image: "/images/layanan/jadwal.jpg",
    icon: Calendar,
    requiresStudentLogin: false,
  },
];

export default function LayananAkademikPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleOpenStudentLayanan = (targetPath: string) => {
    if (!isAuthenticated) {
      notifyError("Silakan login menggunakan akun Siswa terlebih dahulu.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("simandaya:open-login", {
            detail: { targetPath },
          }),
        );
      }
      return;
    }

    if (user?.user_type !== "Siswa") {
      notifyError("Akses ini khusus akun Siswa. Silakan login dengan akun Siswa.");
      return;
    }

    router.push(targetPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <div className="w-full px-4 md:px-6 py-8 md:py-12 space-y-12">
        <ServicePageHeader
          title="Layanan Akademik"
          description="Akses cepat ke berbagai layanan pendukung akademik dan pembelajaran bagi siswa dan guru MAN 2 Yogyakarta."
          accentClassName="bg-blue-600"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LAYANAN_AKADEMIK.map((layanan) => (
            <ServiceLinkCard
              key={layanan.title}
              title={layanan.title}
              description={layanan.description}
              link={layanan.link}
              image={layanan.image}
              icon={layanan.icon}
              hoverColorClassName="group-hover:text-blue-600"
              buttonHoverClassName="hover:bg-blue-600"
              onActionClick={
                layanan.requiresStudentLogin
                  ? () => handleOpenStudentLayanan(layanan.targetPath)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
