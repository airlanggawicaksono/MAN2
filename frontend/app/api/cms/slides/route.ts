import { NextResponse } from "next/server";
import { readSlides, writeSlides } from "@/lib/cms-store";
import type { ContentType, CreateSlideRequest, ImageFitMode } from "@/types/cms";
import { randomUUID } from "crypto";

const DEFAULT_IMAGE_FIT: Record<ContentType, ImageFitMode> = {
  carousel: "contain",
  flyer: "cover",
  media: "cover",
  video: "cover",
  lokasi: "cover",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  let slides = readSlides();
  if (type) {
    slides = slides.filter((s) => s.type === type);
  }
  return NextResponse.json(slides);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSlideRequest;
  const slides = readSlides();
  const type = (body.type ?? "carousel") as ContentType;

  const newSlide = {
    id: randomUUID(),
    type,
    title: body.title ?? null,
    description: body.description ?? null,
    bg: body.bg,
    fg: body.fg,
    image_url: body.image_url ?? null,
    image_version: body.image_url ? Date.now() : null,
    image_fit: body.image_fit ?? DEFAULT_IMAGE_FIT[type],
    image_position_x: body.image_position_x ?? 50,
    image_position_y: body.image_position_y ?? 50,
    image_zoom: body.image_zoom ?? 100,
    link_url: body.link_url ?? null,
    link_label: body.link_label ?? null,
    order_index: body.order_index ?? slides.length,
    is_active: true,
  };

  slides.push(newSlide);
  writeSlides(slides);

  return NextResponse.json(newSlide, { status: 201 });
}
