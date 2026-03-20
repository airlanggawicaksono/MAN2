import React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, GraduationCap, Calendar } from "lucide-react";

const LAYANAN_AKADEMIK = [
  {
    title: "ARD (Asesmen Rapor Digital)",
    description: "Portal penilaian dan laporan capaian hasil belajar siswa (Rapor Digital) Madrasah.",
    link: "https://ard.kemenag.go.id/",
    image: "https://images.unsplash.com/photo-1434031211128-095490e7e7bb?auto=format&fit=crop&q=80&w=800",
    icon: GraduationCap,
  },
  {
    title: "E-Learning MAN 2",
    description: "Sistem Manajemen Pembelajaran (LMS) terpadu untuk kegiatan belajar mengajar digital.",
    link: "https://elearning.man2yogyakarta.sch.id/",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800",
    icon: BookOpen,
  },
  {
    title: "Jadwal Pelajaran",
    description: "Informasi jadwal pelajaran, kalender akademik, dan agenda kegiatan madrasah.",
    link: "/jadwal",
    image: "https://images.unsplash.com/photo-1506784919121-4d145e1d4ad5?auto=format&fit=crop&q=80&w=800",
    icon: Calendar,
  },
];

export default function LayananAkademikPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 w-full overflow-x-hidden">
      <div className="w-full px-4 md:px-6 py-8 md:py-12 space-y-12">
        {/* Header Section - Left Justified */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Layanan Akademik
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Akses cepat ke berbagai layanan pendukung akademik dan pembelajaran bagi siswa dan guru MAN 2 Yogyakarta.
          </p>
          <div className="w-24 h-1.5 bg-blue-600 rounded-full"></div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LAYANAN_AKADEMIK.map((layanan, index) => {
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
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
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
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold transition-all shadow-md active:scale-95 group/btn"
                  >
                    <a 
                      href={layanan.link} 
                      target={layanan.link.startsWith("http") ? "_blank" : "_self"} 
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
