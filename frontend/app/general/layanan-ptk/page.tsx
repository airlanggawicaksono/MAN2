import { ServiceLinkCard } from "@/app/components/service-link-card";
import { ServicePageHeader } from "@/app/components/service-page-header";

const LAYANAN_PTK = [
  {
    title: "Kemenag RI",
    description: "Portal website Kementerian Agama Republik Indonesia.",
    link: "https://kemenag.go.id/",
    image: "/PTK/KEMENAG.jpg",
  },
  {
    title: "Verval PD",
    description: "Portal Verifikasi dan Validasi Data Peserta Didik.",
    link: "https://sso.data.kemendikdasmen.go.id/sys/login?appkey=348310F2-0262-4F5D-B7D1-41F92ECDCA93",
    image: "/PTK/VERVAL.jpg",
  },
  {
    title: "EMIS PTK",
    description: "Portal Data Pokok Kementerian Agama Pendidik dan Tenaga Kependidikan.",
    link: "https://emis.kemenag.go.id/",
    image: "/PTK/EMIS-PTK.jpg",
  },
];

export default function LayananPTKPage() {
  return (
    <div className="w-full px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <div className="space-y-10">
        <ServicePageHeader
          title="Penelitian Tindakan Kelas (PTK)"
          description="Layanan yang ditujukan untuk mendukung pengembangan profesionalisme guru dan tenaga kependidikan di madrasah."
          accentClassName="bg-primary"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LAYANAN_PTK.map((layanan) => (
            <ServiceLinkCard
              key={layanan.title}
              title={layanan.title}
              description={layanan.description}
              link={layanan.link}
              image={layanan.image}
              hoverColorClassName="group-hover:text-foreground"
              buttonHoverClassName="hover:bg-muted/45"
              overlayLabel="Portal Eksternal"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
