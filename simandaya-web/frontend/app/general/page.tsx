"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  Briefcase,
  MapPin,
  Play,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import Link from "next/link";
import type { CarouselSlide } from "@/types/cms";
import { HomeImageCarousel } from "@/app/components/home-image-carousel";
import { HomeSectionHeader } from "@/app/components/home-section-header";

const layananCards = [
  {
    title: "Layanan Akademik",
    description:
      "Informasi kurikulum, jadwal pelajaran, nilai, dan rapor siswa MAN 2 Yogyakarta.",
    icon: BookOpen,
    href: "/general/layanan-akademik",
  },
  {
    title: "Layanan Publik",
    description:
      "Informasi umum, pengumuman, dan layanan publik bagi masyarakat dan orang tua.",
    icon: Users,
    href: "/general/layanan-publik",
  },
  {
    title: "Layanan PTK",
    description: "Layanan bagi Pendidik dan Tenaga Kependidikan.",
    icon: Briefcase,
    href: "/general/layanan-ptk",
  },
];

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export default function IndexPage() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [flyerItems, setFlyerItems] = useState<CarouselSlide[]>([]);
  const [mediaItems, setMediaItems] = useState<CarouselSlide[]>([]);
  const [videoItems, setVideoItems] = useState<CarouselSlide[]>([]);
  const [lokasiItems, setLokasiItems] = useState<CarouselSlide[]>([]);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/data.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => {
        setSlides(
          data
            .filter((s) => s.is_active)
            .filter((s) => !s.type || s.type === "carousel"),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/cms/slides?type=flyer")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => setFlyerItems(data.filter((s) => s.is_active)))
      .catch(() => {});

    fetch("/api/cms/slides?type=media")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => setMediaItems(data.filter((s) => s.is_active)))
      .catch(() => {});

    fetch("/api/cms/slides?type=video")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => setVideoItems(data.filter((s) => s.is_active)))
      .catch(() => {});

    fetch("/api/cms/slides?type=lokasi")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => setLokasiItems(data.filter((s) => s.is_active)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    videoItems.forEach((video) => {
      if (!video.link_url) return;
      const videoId = extractYouTubeId(video.link_url);
      if (!videoId || videoTitles[video.id]) return;
      fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(
          video.link_url,
        )}&format=json`,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.title) {
            setVideoTitles((prev) => ({ ...prev, [video.id]: data.title }));
          }
        })
        .catch(() => {});
    });
  }, [videoItems]);

  return (
    <main className="flex flex-col gap-12 px-4 py-8 md:px-8 lg:px-16">
      {slides.length > 0 && (
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <Card
                  className={`${slide.bg} ${slide.fg} border-none overflow-hidden`}
                >
                  <CardContent className="flex flex-col p-0">
                    {slide.image_url && (
                      <img
                        src={slide.image_url}
                        alt={slide.title || ""}
                        className="w-full max-h-[480px] object-contain"
                      />
                    )}
                    {(slide.title ||
                      slide.description ||
                      (slide.link_url && slide.link_label)) && (
                      <div className="flex flex-col items-center p-6 text-center">
                        {slide.title && (
                          <h2 className="text-2xl font-bold md:text-4xl">
                            {slide.title}
                          </h2>
                        )}
                        {slide.description && (
                          <p className="mt-3 max-w-2xl text-base md:text-lg opacity-90">
                            {slide.description}
                          </p>
                        )}
                        {slide.link_url && slide.link_label && (
                          <Button asChild variant="secondary" className="mt-6">
                            <Link href={slide.link_url}>
                              {slide.link_label}
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 md:left-6" />
          <CarouselNext className="right-4 md:right-6" />
        </Carousel>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {layananCards.map((item) => {
          const Icon = item.icon;
          const card = (
            <Card
              key={item.title}
              className={`transition-shadow hover:shadow-lg h-full ${
                item.href ? "cursor-pointer" : ""
              }`}
            >
              <CardHeader className="items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          );

          if (!item.href) return card;
          if (item.href.startsWith("http")) {
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                {card}
              </a>
            );
          }

          return (
            <Link key={item.title} href={item.href} className="block h-full">
              {card}
            </Link>
          );
        })}
      </div>

      <section>
        <HomeSectionHeader icon={ImageIcon} title="Flyer MAN 2" />
        <HomeImageCarousel items={flyerItems} imageClassName="max-h-[400px]" />
      </section>

      <section>
        <HomeSectionHeader icon={Play} title="Media Center" />
        <HomeImageCarousel
          items={mediaItems}
          imageClassName="max-h-[260px]"
          cardClassName="shadow-sm"
        />
      </section>

      <section>
        <HomeSectionHeader icon={Video} title="Video" />
        <div className="grid gap-6 md:grid-cols-2">
          {videoItems.map((video) => {
            if (!video.link_url) return null;
            const videoId = extractYouTubeId(video.link_url);
            if (!videoId) return null;
            return (
              <Card key={video.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                      title={videoTitles[video.id] || "Video"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {videoTitles[video.id] && (
                    <div className="p-4">
                      <p className="font-semibold">{videoTitles[video.id]}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {videoItems.length === 0 && (
            <div className="col-span-2 flex items-center justify-center h-48 bg-muted rounded-lg">
              <p className="text-muted-foreground">Belum ada video</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <HomeSectionHeader icon={MapPin} title="Lokasi" />
        {lokasiItems.length > 0 ? (
          lokasiItems.map((loc) => (
            <Card key={loc.id} className="overflow-hidden">
              <CardContent className="p-0">
                {loc.link_url && (
                  <iframe
                    src={loc.link_url}
                    className="w-full h-[400px]"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
                {loc.title && (
                  <div className="p-4">
                    <p className="font-semibold">{loc.title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.1!2d110.365!3d-7.802!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5787bd5b6bc5%3A0x21723fd4d3684f71!2sMAN%202%20Yogyakarta!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid"
                className="w-full h-[400px]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
