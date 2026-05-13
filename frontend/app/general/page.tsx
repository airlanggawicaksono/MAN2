"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { HomeImageCarousel } from "@/app/components/home-image-carousel";
import { HomeSectionHeader } from "@/app/components/home-section-header";
import { useGeneralHomeController } from "./use-general-home-controller";
import { useAppSelector } from "@/store/hooks";
import { roleRoutePrefix } from "@/config/navigation";
import { HeroSkeleton, VideoGridSkeleton } from "@/app/components/skeletons";

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

function toObjectFitClass(mode?: "cover" | "contain" | "fill" | null) {
  if (mode === "contain") return "object-contain";
  if (mode === "fill") return "object-fill";
  return "object-cover";
}

export default function IndexPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const {
    flyerItems,
    lokasiItems,
    mediaItems,
    slides,
    videoItems,
    videoTitles,
    loadingSlides,
    loadingCms,
  } = useGeneralHomeController();

  useEffect(() => {
    if (!isAuthenticated || !user?.user_type) return;
    const targetRoute = roleRoutePrefix[user.user_type] ?? "/general";
    if (targetRoute !== "/general") {
      router.replace(targetRoute);
    }
  }, [isAuthenticated, user?.user_type, router]);

  return (
    <main className="flex w-full flex-col gap-10 px-4 py-7 md:px-8 md:py-10 lg:px-12">
      {loadingSlides && slides.length === 0 && <HeroSkeleton />}
      {slides.length > 0 && (
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <Card className="overflow-hidden border-border/60">
                  <CardContent className="flex flex-col p-0">
                    {slide.image_url && (
                      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-border/60 bg-muted/25 aspect-[16/4]">
                        <img
                          src={slide.image_url}
                          alt={slide.title || ""}
                          draggable={false}
                          className={`h-full w-full ${toObjectFitClass(slide.image_fit ?? "contain")}`}
                          style={{
                            objectPosition: `${slide.image_position_x ?? 50}% ${slide.image_position_y ?? 50}%`,
                            transform: `scale(${(slide.image_zoom ?? 100) / 100})`,
                            transformOrigin: `${slide.image_position_x ?? 50}% ${slide.image_position_y ?? 50}%`,
                          }}
                        />
                      </div>
                    )}
                    {(slide.title ||
                      slide.description ||
                      (slide.link_url && slide.link_label)) && (
                      <div className="flex flex-col items-center p-6 text-center">
                        {slide.title && (
                          <h2 className="text-2xl font-semibold md:text-4xl">{slide.title}</h2>
                        )}
                        {slide.description && (
                          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
                            {slide.description}
                          </p>
                        )}
                        {slide.link_url && slide.link_label && (
                          <Button asChild variant="secondary" className="mt-6">
                            <Link href={slide.link_url}>{slide.link_label}</Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 md:left-4" />
          <CarouselNext className="right-3 md:right-4" />
        </Carousel>
      )}

      <section className="space-y-4">
        <HomeSectionHeader icon={BookOpen} title="Akses Layanan" />
        <div className="grid gap-5 md:grid-cols-3">
          {layananCards.map((item) => {
            const Icon = item.icon;
            const card = (
              <Card
                key={item.title}
                className={`h-full border-border/70 transition-colors duration-200 hover:border-primary/35 ${
                  item.href ? "cursor-pointer" : ""
                }`}
              >
                <CardHeader className="items-center text-center">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
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
              <Link key={item.title} href={item.href} prefetch={false} className="block h-full">
                {card}
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <HomeSectionHeader icon={ImageIcon} title="Flyer MAN 2" />
        <HomeImageCarousel
          items={flyerItems}
          itemClassName="basis-full sm:basis-1/2"
          imageFrameClassName="aspect-[4/5]"
          defaultImageFit="cover"
          loading={loadingCms}
        />
      </section>

      <section>
        <HomeSectionHeader icon={Play} title="Media Center" />
        <HomeImageCarousel
          items={mediaItems}
          itemClassName="basis-full sm:basis-1/2"
          imageFrameClassName="aspect-[4/3]"
          defaultImageFit="cover"
          cardClassName="shadow-none"
          loading={loadingCms}
        />
      </section>

      <section>
        <HomeSectionHeader icon={Video} title="Video" />
        {loadingCms && videoItems.length === 0 ? (
          <VideoGridSkeleton count={2} />
        ) : (
        <div>
          {videoItems.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-border/70 bg-muted/35">
              <p className="text-muted-foreground">Belum ada video</p>
            </div>
          ) : (
            <Carousel opts={{ loop: videoItems.length > 2 }} className="w-full">
              <CarouselContent>
                {videoItems.map((video) => {
                  if (!video.link_url) return null;
                  const videoId = extractYouTubeId(video.link_url);
                  if (!videoId) return null;
                  return (
                    <CarouselItem key={video.id} className="basis-full md:basis-1/2">
                      <Card className="overflow-hidden border-border/70">
                        <CardContent className="p-0">
                          <div className="relative aspect-video w-full bg-muted/20">
                            <iframe
                              className="absolute inset-0 h-full w-full"
                              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                              title={videoTitles[video.id] || "Video"}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                          {videoTitles[video.id] && (
                            <div className="p-4">
                              <p className="font-semibold">{videoTitles[video.id]}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          )}
        </div>
        )}
      </section>

      <section>
        <HomeSectionHeader icon={MapPin} title="Lokasi" />
        {lokasiItems.length > 0 ? (
          lokasiItems.map((loc) => (
            <Card key={loc.id} className="overflow-hidden border-border/70">
              <CardContent className="p-0">
                {loc.link_url && (
                  <iframe
                    src={loc.link_url}
                    className="h-[400px] w-full"
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
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.1!2d110.365!3d-7.802!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5787bd5b6bc5%3A0x21723fd4d3684f71!2sMAN%202%20Yogyakarta!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid"
                className="h-[400px] w-full"
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
