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
  imageClassName?: string;
  loading?: boolean;
}

export function HomeImageCarousel({
  items,
  cardClassName = "",
  imageClassName = "max-h-[360px]",
  loading = false,
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
                  <img
                    src={item.image_url}
                    alt={item.title || ""}
                    loading="lazy"
                    className={`w-full object-cover ${imageClassName}`}
                  />
                )}
                {item.title && (
                  <div className="p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );

          return (
            <CarouselItem key={item.id}>
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
