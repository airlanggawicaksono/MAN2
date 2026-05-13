"use client";

import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import type { CarouselSlide } from "@/types/cms";

interface HomeImageCarouselProps {
  items: CarouselSlide[];
  cardClassName?: string;
  itemClassName?: string;
  imageFrameClassName?: string;
  defaultImageFit?: "cover" | "contain" | "fill";
  loading?: boolean;
  showTitle?: boolean;
}

function toObjectFitClass(mode: CarouselSlide["image_fit"], fallback: "cover" | "contain" | "fill") {
  const fit = mode ?? fallback;
  if (fit === "contain") return "object-contain";
  if (fit === "fill") return "object-fill";
  return "object-cover";
}

export function HomeImageCarousel({
  items,
  cardClassName = "",
  itemClassName = "basis-full",
  imageFrameClassName = "aspect-[4/3]",
  defaultImageFit = "cover",
  loading = false,
  showTitle = true,
}: HomeImageCarouselProps) {
  if (loading && items.length === 0) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-busy="true"
        aria-label="Memuat konten"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-44 animate-pulse rounded-lg border border-border/60 bg-muted/40 ${cardClassName}`}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-border/70 bg-muted/35">
        <p className="text-sm text-muted-foreground">Belum ada konten</p>
      </div>
    );
  }

  return (
    <Carousel opts={{ loop: true }} className="w-full">
      <CarouselContent>
        {items.map((item) => {
          const content = (
            <Card className={`overflow-hidden border-border/60 ${cardClassName}`}>
              <CardContent className="flex flex-col p-0">
                {item.image_url && (
                  <div className={`w-full bg-muted/25 ${imageFrameClassName}`}>
                    <img
                      src={item.image_url}
                      alt={item.title || ""}
                      loading="lazy"
                      draggable={false}
                      className={`h-full w-full ${toObjectFitClass(item.image_fit, defaultImageFit)}`}
                      style={{
                        objectPosition: `${item.image_position_x ?? 50}% ${item.image_position_y ?? 50}%`,
                        transform: `scale(${(item.image_zoom ?? 100) / 100})`,
                        transformOrigin: `${item.image_position_x ?? 50}% ${item.image_position_y ?? 50}%`,
                      }}
                    />
                  </div>
                )}
                {showTitle && item.title && (
                  <div className="p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );

          return (
            <CarouselItem key={item.id} className={itemClassName}>
              {item.link_url ? (
                <Link href={item.link_url} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}
