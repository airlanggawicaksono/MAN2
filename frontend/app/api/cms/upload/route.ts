import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

function resolveUploadPathFromUrl(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const filename = path.basename(url);
  if (!filename) return null;
  return path.join(process.cwd(), "public", "uploads", filename);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const extFromName = path.extname(file.name).toLowerCase();
  const extFromMime = MIME_TO_EXT[file.type] ?? "";
  const ext = extFromName || extFromMime;
  if (!ext) {
    return NextResponse.json({ error: "Unsupported image file type" }, { status: 400 });
  }
  const filename = `${Date.now()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  fs.writeFileSync(filepath, new Uint8Array(bytes));

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url;

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const filepath = resolveUploadPathFromUrl(url);
  if (!filepath) {
    return NextResponse.json({ error: "Invalid upload url" }, { status: 400 });
  }

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  return new NextResponse(null, { status: 204 });
}
