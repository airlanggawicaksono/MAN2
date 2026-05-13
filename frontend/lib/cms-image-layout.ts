import type { ContentType, ImageFitMode } from "@/types/cms";

export const CMS_DEFAULT_IMAGE_FIT_BY_TYPE: Record<ContentType, ImageFitMode> = {
  carousel: "contain",
  flyer: "cover",
  media: "cover",
  video: "cover",
  lokasi: "cover",
};

export const CMS_IMAGE_FRAME_CLASS_BY_TYPE: Record<"carousel" | "flyer" | "media", string> = {
  carousel: "aspect-[21/4]",
  flyer: "aspect-square",
  media: "aspect-square",
};

export const CMS_SIZE_GUIDE: Record<
  ContentType,
  { ratio: string; recommended: string; note: string }
> = {
  carousel: {
    ratio: "21:4",
    recommended: "2100 x 400 px",
    note: "Hero panjang dan tipis (landscape).",
  },
  flyer: {
    ratio: "1:1",
    recommended: "1200 x 1200 px",
    note: "Flyer boxy (kotak), tampil 2 item per baris (desktop).",
  },
  media: {
    ratio: "1:1",
    recommended: "1200 x 1200 px",
    note: "Media Center boxy (kotak), tampil 2 item per baris (desktop).",
  },
  video: {
    ratio: "16:9",
    recommended: "Gunakan URL YouTube",
    note: "Embed video tetap 16:9.",
  },
  lokasi: {
    ratio: "16:9",
    recommended: "Google Maps Embed URL",
    note: "Peta tampil dalam frame embed tetap.",
  },
};
