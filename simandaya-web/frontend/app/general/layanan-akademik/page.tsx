"use client";

import { Calendar } from "lucide-react";
import { ServiceLinkCard } from "@/app/components/service-link-card";
import { ServicePageHeader } from "@/app/components/service-page-header";

const LAYANAN_AKADEMIK = [
  {
    title: "SIJINAK",
    description:
      "Sistem Izin dan Absensi Kesiswaan (SIJINAK) untuk monitoring kehadiran siswa.",
    link: "/general/absensi",
    image: "/images/layanan/jadwal.jpg",
    icon: Calendar,
  },
];

export default function LayananAkademikPage() {
  return (
    <div className="w-full px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <div className="space-y-10">
        <ServicePageHeader
          title="Layanan Akademik"
          description="Akses cepat ke berbagai layanan pendukung akademik dan pembelajaran bagi siswa dan guru MAN 2 Yogyakarta."
          accentClassName="bg-primary"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LAYANAN_AKADEMIK.map((layanan) => (
            <ServiceLinkCard
              key={layanan.title}
              title={layanan.title}
              description={layanan.description}
              link={layanan.link}
              image={layanan.image}
              icon={layanan.icon}
              hoverColorClassName="group-hover:text-foreground"
              buttonHoverClassName="hover:bg-muted/45"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
