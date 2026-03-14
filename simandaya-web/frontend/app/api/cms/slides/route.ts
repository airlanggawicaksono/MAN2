import { NextResponse } from "next/server";
import { readSlides, writeSlides } from "@/lib/cms-store";
import type { CreateSlideRequest } from "@/types/cms";
import { randomUUID } from "crypto";

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

  const newSlide = {
    id: randomUUID(),
    type: body.type ?? "carousel" as const,
    title: body.title,
    description: body.description,
    bg: body.bg,
    fg: body.fg,
    image_url: body.image_url ?? null,
    link_url: body.link_url ?? null,
    link_label: body.link_label ?? null,
    order_index: body.order_index ?? slides.length,
    is_active: true,
  };

  slides.push(newSlide);
  writeSlides(slides);

  return NextResponse.json(newSlide, { status: 201 });
}
