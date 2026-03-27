"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Network, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useListPublicCivitasQuery } from "@/api/admin/userman";

// Dynamic import for OrgChart to avoid hydration issues (SSR: false)
const OrgChart = dynamic(
  () => import("@/components/OrgChart").then((mod) => mod.OrgChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[800px] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
  },
);

export default function StrukturOrganisasiPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading: loading, error } = useListPublicCivitasQuery({
    limit: 100,
  });
  const civitas = data?.items ?? [];

  // Lazy-render OrgChart: only mount when its container is in the viewport
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartVisible, setChartVisible] = useState(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filteredCivitas = useMemo(() => {
    return civitas.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        (p.nama || "").toLowerCase().includes(searchLower) ||
        (p.nip || "").toLowerCase().includes(searchLower) ||
        (p.nik || "").toLowerCase().includes(searchLower) ||
        (p.matapelajaran || "").toLowerCase().includes(searchLower);
      return matchSearch;
    });
  }, [civitas, search]);

  return (
    <div className="min-h-screen bg-slate-50/50 w-full overflow-x-hidden">
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 flex flex-col gap-6 lg:gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Struktur Organisasi & Civitas
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-1">
              MAN 2 Kota Yogyakarta - Profil Akademik Terintegrasi
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama, NIP, atau mapel..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content Layout - 3/5 Chart and 2/5 Civitas */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[1000px] lg:h-[calc(100vh-250px)]">
          {/* Left 3/5: Organizational Chart */}
          <div className="w-full lg:w-3/5">
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl flex flex-col min-h-[800px] lg:h-[calc(100vh-250px)]">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-slate-800">
                    Bagan Struktur Organisasi
                  </h2>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  * Scroll untuk zoom, drag untuk geser
                </div>
              </div>
              <CardContent ref={chartRef} className="p-0 bg-white flex-1 relative min-h-[700px]">
                <div
                  className="w-full h-full"
                  style={{ position: "absolute", inset: 0 }}
                >
                  {chartVisible ? (
                    <OrgChart civitas={civitas} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right 2/5: Civitas List */}
          <div className="w-full lg:w-2/5 lg:h-full">
            <Card className="max-h-[72vh] lg:h-[calc(100vh-250px)] border-slate-200 shadow-sm overflow-hidden flex flex-col rounded-2xl bg-white">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-800">
                  Daftar Civitas Akademik
                </h2>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-red-500 text-sm bg-red-50 m-4 rounded-lg">
                    {JSON.stringify(error)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-px bg-slate-100">
                    {filteredCivitas.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm bg-white col-span-full">
                        Data tidak ditemukan
                      </div>
                    ) : (
                      filteredCivitas.map((person, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white hover:bg-blue-50/50 transition-colors group"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {person.nama}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono tracking-tighter">
                                <span>NIP: {person.nip || "-"}</span>
                                {person.kontak && (
                                  <>
                                    <span className="text-slate-200 hidden sm:inline">
                                      •
                                    </span>
                                    <span>{person.kontak}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-2 py-0.5 font-bold bg-blue-50 text-blue-700 border-blue-100 whitespace-nowrap"
                              >
                                {person.jabatan_struktural}
                              </Badge>
                              {person.matapelajaran && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0.5 font-normal border-slate-200 text-slate-500 whitespace-nowrap"
                                >
                                  {person.matapelajaran}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
