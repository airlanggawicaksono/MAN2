"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeriodeTab from "./periode/page";
import MapelTab from "./mapel/page";
import KurikulumTab from "./_kurikulum/kurikulum-tab";

export default function ManajemenAkademikPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Akademik</h1>
        <p className="text-muted-foreground">
          Kelola periode akademik, mata pelajaran, dan struktur kurikulum per tingkat kelas.
        </p>
      </div>

      <Tabs defaultValue="periode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="periode">Periode Akademik</TabsTrigger>
          <TabsTrigger value="mapel">Mata Pelajaran</TabsTrigger>
          <TabsTrigger value="kurikulum">Struktur Kurikulum</TabsTrigger>
        </TabsList>

        <TabsContent value="periode">
          <PeriodeTab />
        </TabsContent>

        <TabsContent value="mapel">
          <MapelTab />
        </TabsContent>

        <TabsContent value="kurikulum">
          <KurikulumTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
