import { BookOpen, Calendar, GraduationCap } from "lucide-react";
import { ServiceLinkCard } from "@/app/components/service-link-card";
import { ServicePageHeader } from "@/app/components/service-page-header";

const LAYANAN_AKADEMIK = [
  {
    title: "ARD (Asesmen Rapor Digital)",
    description:
      "Portal penilaian dan laporan capaian hasil belajar siswa (Rapor Digital) Madrasah.",
    link: "https://ard.kemenag.go.id/",
    image:
      "https://images.unsplash.com/photo-1434031211128-095490e7e7bb?auto=format&fit=crop&q=80&w=800",
    icon: GraduationCap,
  },
  {
    title: "E-Learning MAN 2",
    description:
      "Sistem Manajemen Pembelajaran (LMS) terpadu untuk kegiatan belajar mengajar digital.",
    link: "https://elearning.man2yogyakarta.sch.id/",
    image:
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800",
    icon: BookOpen,
  },
  {
    title: "Jadwal Pelajaran",
    description:
      "Informasi jadwal pelajaran, kalender akademik, dan agenda kegiatan madrasah.",
    link: "/general/absensi",
    image:
      "https://images.unsplash.com/photo-1506784919121-4d145e1d4ad5?auto=format&fit=crop&q=80&w=800",
    icon: Calendar,
  },
];

export default function LayananAkademikPage() {
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
