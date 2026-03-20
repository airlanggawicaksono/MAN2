import React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, Users, MessageSquare } from "lucide-react";

const LAYANAN_PUBLIK = [
  {
    title: "Website Resmi",
    description: "Portal informasi resmi MAN 2 Yogyakarta mengenai berita, prestasi, dan pengumuman terbaru.",
    link: "https://man2yogyakarta.sch.id/",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800",
    icon: Globe,
  },
  {
    title: "Portal Alumni",
    description: "Layanan komunikasi dan pendataan bagi alumni MAN 2 Yogyakarta lintas generasi.",
    link: "https://alumni.man2yogyakarta.sch.id/",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800",
    icon: Users,
  },
  {
    title: "Pengaduan Masyarakat (WBS)",
    description: "Layanan Whistleblowing System untuk melaporkan indikasi pelanggaran secara anonim dan aman.",
    link: "https://jogja.kemenag.go.id/wbs",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800",
    icon: MessageSquare,
  },
];

export default function LayananPublikPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 w-full overflow-x-hidden">
      <div className="w-full px-4 md:px-6 py-8 md:py-12 space-y-12">
        {/* Header Section - Left Justified */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Layanan Publik
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Pusat layanan informasi dan keterbukaan publik MAN 2 Yogyakarta bagi masyarakat luas dan orang tua siswa.
          </p>
          <div className="w-24 h-1.5 bg-green-600 rounded-full"></div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LAYANAN_PUBLIK.map((layanan, index) => {
            const Icon = layanan.icon;
            return (
              <Card 
                key={index} 
                className="group border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden rounded-2xl bg-white"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={layanan.image}
                    alt={layanan.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                <CardHeader className="pt-6">
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                    {layanan.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {layanan.description}
                  </p>
                </CardContent>

                <CardFooter className="pb-8 pt-2">
                  <Button 
                    asChild 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-green-600 text-white font-semibold transition-all shadow-md active:scale-95 group/btn"
                  >
                    <a 
                      href={layanan.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2"
                    >
                      Buka Layanan
                      <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
