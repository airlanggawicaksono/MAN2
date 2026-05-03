"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Network, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGeneralStrukturOrganisasiController } from "./use-general-struktur-organisasi-controller";

const OrgChart = dynamic(
  () => import("@/components/OrgChart").then((mod) => mod.OrgChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[760px] w-full items-center justify-center bg-muted/35">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    ),
  },
);

export default function StrukturOrganisasiPage() {
  const {
    chartRef,
    chartVisible,
    civitas,
    error,
    filteredCivitas,
    loading,
    search,
    setSearch,
  } = useGeneralStrukturOrganisasiController();

  return (
    <div className="w-full space-y-6 px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Struktur Organisasi & Civitas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Peta struktur organisasi dan profil civitas MAN 2 Yogyakarta.
            </p>
          </div>
          <div className="relative w-full md:w-[420px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, atau mapel..."
              className="h-11 border-border/70 bg-muted/25 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Card className="flex min-h-[760px] flex-col overflow-hidden border-border/70 shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card p-4">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Bagan Struktur Organisasi</h2>
            </div>
            <div className="text-xs text-muted-foreground">Scroll untuk zoom, drag untuk geser</div>
          </div>
          <CardContent ref={chartRef} className="relative min-h-[680px] flex-1 bg-muted/20 p-0">
            <div className="absolute inset-0 h-full w-full">
              {chartVisible ? (
                <OrgChart civitas={civitas} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/35">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex max-h-[760px] flex-col overflow-hidden border-border/70 shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Daftar Civitas Akademik</h2>
            </div>
            <Badge variant="secondary">{filteredCivitas.length}</Badge>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              </div>
            ) : error ? (
              <div className="m-4 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                Terjadi kesalahan saat memuat data civitas.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-px bg-border/60">
                {filteredCivitas.length === 0 ? (
                  <div className="col-span-full bg-card p-8 text-center text-sm text-muted-foreground">
                    Data tidak ditemukan
                  </div>
                ) : (
                  filteredCivitas.map((person, idx) => (
                    <article
                      key={`${person.nip ?? person.nama}-${idx}`}
                      className="bg-card p-4 transition-colors duration-200 hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold leading-tight text-foreground">{person.nama}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>NIP: {person.nip || "-"}</span>
                            {person.kontak ? <span>{person.kontak}</span> : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant="secondary" className="whitespace-nowrap text-[10px] font-semibold">
                            {person.jabatan_struktural}
                          </Badge>
                          {person.matapelajaran ? (
                            <Badge variant="outline" className="whitespace-nowrap text-[10px] font-normal">
                              {person.matapelajaran}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
