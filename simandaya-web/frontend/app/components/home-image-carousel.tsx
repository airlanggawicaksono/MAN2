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
}

export function HomeImageCarousel({
  items,
  cardClassName = "",
  imageClassName = "max-h-[360px]",
}: HomeImageCarouselProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
        <p className="text-muted-foreground">Belum ada konten</p>
      </div>
    );
  }

  return (
    <Carousel opts={{ loop: true }} className="w-full">
      <CarouselContent>
        {items.map((item) => {
          const content = (
            <Card className={`border-none overflow-hidden ${cardClassName}`}>
              <CardContent className="flex flex-col p-0">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title || ""}
                    className={`w-full object-cover ${imageClassName}`}
                  />
                )}
                {item.title && (
                  <div className="p-4">
                    <p className="font-semibold text-sm">{item.title}</p>
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
