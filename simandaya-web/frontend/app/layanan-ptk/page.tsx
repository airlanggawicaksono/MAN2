import React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50/50 w-full overflow-x-hidden">
      <div className="w-full px-4 md:px-6 py-8 md:py-12 space-y-12">
        {/* Header Section - Left Justified */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Penelitian Tindakan Kelas (PTK)
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Layanan yang ditujukan untuk mendukung pengembangan profesionalisme 
            guru dan tenaga kependidikan di madrasah.
          </p>
          <div className="w-24 h-1.5 bg-blue-600 rounded-full"></div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LAYANAN_PTK.map((layanan, index) => (
            <Card 
              key={index} 
              className="group border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden rounded-2xl bg-white"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={layanan.image}
                  alt={layanan.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-xs font-medium uppercase tracking-wider">
                    Portal Eksternal
                  </span>
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
                  <a href={layanan.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    Buka Layanan
                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
