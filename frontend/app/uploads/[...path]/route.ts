import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
};

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadsDir, params.path.join("/"));

  if (!filePath.startsWith(uploadsDir)) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const file = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
