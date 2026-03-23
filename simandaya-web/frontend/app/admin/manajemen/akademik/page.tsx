"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeriodeTab from "./periode/page";
import KategoriKelasTab from "./kategori-kelas/page";
import KurikulumTab from "./_kurikulum/kurikulum-tab";
import KelasGuruSiswaPage from "./kelas-guru-siswa/page";

const VALID_TABS = ["pengaturan", "periode", "kurikulum", "kelas"] as const;
type AkademikTab = (typeof VALID_TABS)[number];

export default function ManajemenAkademikPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo<AkademikTab>(() => {
    const raw = searchParams.get("tab");
    if (raw && VALID_TABS.includes(raw as AkademikTab)) return raw as AkademikTab;
    return "pengaturan";
  }, [searchParams]);

  const setActiveTab = (nextTab: string) => {
    if (!VALID_TABS.includes(nextTab as AkademikTab)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Akademik</h1>
        <p className="text-muted-foreground">
          Alur: Pengaturan Umum (kategori, mapel), lalu Periode Akademik, lalu Struktur Kurikulum, terakhir Kelas/Guru/Siswa.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pengaturan">Pengaturan Umum</TabsTrigger>
          <TabsTrigger value="periode">Periode Akademik</TabsTrigger>
          <TabsTrigger value="kurikulum">Struktur Kurikulum</TabsTrigger>
          <TabsTrigger value="kelas">Kelas, Guru, dan Siswa</TabsTrigger>
        </TabsList>

        <TabsContent value="pengaturan">
          {activeTab === "pengaturan" ? <KategoriKelasTab /> : null}
        </TabsContent>

        <TabsContent value="periode">
          {activeTab === "periode" ? <PeriodeTab /> : null}
        </TabsContent>

        <TabsContent value="kurikulum">
          {activeTab === "kurikulum" ? <KurikulumTab /> : null}
        </TabsContent>

        <TabsContent value="kelas">
          {activeTab === "kelas" ? <KelasGuruSiswaPage /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
