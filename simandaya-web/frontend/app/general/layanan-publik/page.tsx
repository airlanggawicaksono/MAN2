import { Globe, MessageSquare, Users } from "lucide-react";
import { ServiceLinkCard } from "@/app/components/service-link-card";
import { ServicePageHeader } from "@/app/components/service-page-header";

const LAYANAN_PUBLIK = [
  {
    title: "Website Resmi",
    description:
      "Portal informasi resmi MAN 2 Yogyakarta mengenai berita, prestasi, dan pengumuman terbaru.",
    link: "https://man2yogyakarta.sch.id/",
    image: "/images/layanan/website.jpg",
    icon: Globe,
  },
  {
    title: "Portal Alumni",
    description:
      "Layanan komunikasi dan pendataan bagi alumni MAN 2 Yogyakarta lintas generasi.",
    link: "https://alumni.man2yogyakarta.sch.id/",
    image: "/images/layanan/alumni.jpg",
    icon: Users,
  },
  {
    title: "Pengaduan Masyarakat (WBS)",
    description:
      "Layanan Whistleblowing System untuk melaporkan indikasi pelanggaran secara anonim dan aman.",
    link: "https://jogja.kemenag.go.id/wbs",
    image: "/images/layanan/wbs.jpg",
    icon: MessageSquare,
  },
];

export default function LayananPublikPage() {
  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <div className="w-full px-4 md:px-6 py-8 md:py-12 space-y-12">
        <ServicePageHeader
          title="Layanan Publik"
          description="Pusat layanan informasi dan keterbukaan publik MAN 2 Yogyakarta bagi masyarakat luas dan orang tua siswa."
          accentClassName="bg-green-600"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LAYANAN_PUBLIK.map((layanan) => (
            <ServiceLinkCard
              key={layanan.title}
              title={layanan.title}
              description={layanan.description}
              link={layanan.link}
              image={layanan.image}
              icon={layanan.icon}
              hoverColorClassName="group-hover:text-green-600"
              buttonHoverClassName="hover:bg-green-600"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
