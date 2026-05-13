import { NextResponse } from "next/server";
import { readSlides, writeSlides } from "@/lib/cms-store";
import type { UpdateSlideRequest } from "@/types/cms";
import path from "path";
import fs from "fs";

function toUploadFilePath(imageUrl: string): string | null {
  if (!imageUrl.startsWith("/uploads/")) return null;
  const filename = path.basename(imageUrl);
  if (!filename) return null;
  return path.join(process.cwd(), "public", "uploads", filename);
}

function removeUploadIfUnused(imageUrl: string, slides: { image_url: string | null }[]) {
  const filePath = toUploadFilePath(imageUrl);
  if (!filePath) return;
  const stillUsed = slides.some((s) => s.image_url === imageUrl);
  if (stillUsed) return;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

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

  const previousImageUrl = slides[idx].image_url;
  slides[idx] = { ...slides[idx], ...body };
  writeSlides(slides);
  const currentImageUrl = slides[idx].image_url;
  if (previousImageUrl && previousImageUrl !== currentImageUrl) {
    removeUploadIfUnused(previousImageUrl, slides);
  }

  return NextResponse.json(slides[idx]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const slides = readSlides();
  const target = slides.find((s) => s.id === params.id);
  const filtered = slides.filter((s) => s.id !== params.id);

  if (filtered.length === slides.length) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  writeSlides(filtered);
  if (target?.image_url) {
    removeUploadIfUnused(target.image_url, filtered);
  }
  return new NextResponse(null, { status: 204 });
}
