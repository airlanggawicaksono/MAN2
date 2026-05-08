import { NextResponse } from "next/server";
import { readSlides, writeSlides } from "@/lib/cms-store";
import type { UpdateSlideRequest } from "@/types/cms";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = (await request.json()) as UpdateSlideRequest;
  const slides = readSlides();
  const idx = slides.findIndex((s) => s.id === params.id);

  if (idx === -1) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  slides[idx] = { ...slides[idx], ...body };
  writeSlides(slides);

  return NextResponse.json(slides[idx]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const slides = readSlides();
  const filtered = slides.filter((s) => s.id !== params.id);

  if (filtered.length === slides.length) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  writeSlides(filtered);
  return new NextResponse(null, { status: 204 });
}
