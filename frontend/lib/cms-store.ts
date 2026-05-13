import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import type { CarouselSlide } from "@/types/cms";

const DATA_PATH = path.join(process.cwd(), "public", "data.json");
let slidesCache: CarouselSlide[] | null = null;
let cacheMtimeMs: number | null = null;

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    id: randomUUID(),
    type: "carousel",
    title: "Selamat Datang di SIMANDAYA",
    description: "Sistem Informasi Manajemen Data Madrasah Aliyah - MAN 2 Yogyakarta",
    bg: "bg-primary",
    fg: "text-primary-foreground",
    image_url: null,
    image_version: null,
    image_fit: "contain",
    image_position_x: 50,
    image_position_y: 50,
    image_zoom: 100,
    link_url: null,
    link_label: null,
    order_index: 0,
    is_active: true,
  },
  {
    id: randomUUID(),
    type: "carousel",
    title: "Layanan Digital Terpadu",
    description: "Akses informasi akademik, absensi, dan layanan sekolah dalam satu platform",
    bg: "bg-secondary",
    fg: "text-secondary-foreground",
    image_url: null,
    image_version: null,
    image_fit: "contain",
    image_position_x: 50,
    image_position_y: 50,
    image_zoom: 100,
    link_url: null,
    link_label: null,
    order_index: 1,
    is_active: true,
  },
  {
    id: randomUUID(),
    type: "carousel",
    title: "Transparan dan Akuntabel",
    description: "Mendukung pengelolaan madrasah yang modern, transparan, dan akuntabel",
    bg: "bg-accent",
    fg: "text-accent-foreground",
    image_url: null,
    image_version: null,
    image_fit: "contain",
    image_position_x: 50,
    image_position_y: 50,
    image_zoom: 100,
    link_url: null,
    link_label: null,
    order_index: 2,
    is_active: true,
  },
];

export function readSlides(): CarouselSlide[] {
  if (slidesCache && fs.existsSync(DATA_PATH)) {
    const currentMtimeMs = fs.statSync(DATA_PATH).mtimeMs;
    if (cacheMtimeMs !== null && currentMtimeMs === cacheMtimeMs) {
      return slidesCache.map((s) => ({ ...s }));
    }
  }

  // First run: seed defaults so CMS and carousel are in sync
  if (!fs.existsSync(DATA_PATH)) {
    writeSlides(DEFAULT_SLIDES);
    return DEFAULT_SLIDES.map((s) => ({ ...s }));
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8").replace(/^\uFEFF/, "");
    const slides = JSON.parse(raw) as CarouselSlide[];
    // Migration: add type: "carousel" to any item missing the field
    slidesCache = slides.map((s) => ({
      ...s,
      type: s.type ?? "carousel",
      image_version: s.image_version ?? (s.image_url ? 1 : null),
      image_fit: s.image_fit ?? (s.type === "carousel" ? "contain" : "cover"),
      image_position_x: s.image_position_x ?? 50,
      image_position_y: s.image_position_y ?? 50,
      image_zoom: s.image_zoom ?? 100,
    })) as CarouselSlide[];
    cacheMtimeMs = fs.statSync(DATA_PATH).mtimeMs;
    return slidesCache.map((s) => ({ ...s }));
  } catch {
    return [];
  }
}

export function writeSlides(slides: CarouselSlide[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(slides, null, 2), "utf-8");
  slidesCache = slides.map((s) => ({ ...s }));
  cacheMtimeMs = fs.statSync(DATA_PATH).mtimeMs;
}
