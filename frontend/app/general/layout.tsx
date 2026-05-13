import type { Metadata } from "next";
import type { ReactNode } from "react";
import { readSlides } from "@/lib/cms-store";
import type { CarouselSlide, ContentType } from "@/types/cms";

const BASE_TITLE = "Simandaya MAN 2 Yogyakarta";
const TAGLINE = "Ukirprasasti dengan prestasi";

const SECTION_LABELS: Record<ContentType, string> = {
  carousel: "Carousel Utama",
  flyer: "Flyer MAN 2",
  media: "Media Center",
  video: "Video",
  lokasi: "Lokasi",
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function itemText(slide: CarouselSlide): string {
  if (slide.title) return normalizeText(slide.title);
  if (slide.type === "video" && slide.link_url) return normalizeText(slide.link_url);
  if (slide.description) return normalizeText(slide.description);
  return "";
}

function topThreeByType(slides: CarouselSlide[], type: ContentType): string[] {
  const unique = new Set<string>();
  for (const slide of slides) {
    if (!slide.is_active || slide.type !== type) continue;
    const txt = itemText(slide);
    if (!txt) continue;
    unique.add(txt);
    if (unique.size >= 3) break;
  }
  return Array.from(unique);
}

function getMetadataBase(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv);
    } catch {
      // fallback below
    }
  }
  return new URL("http://localhost:3000");
}

export async function generateMetadata(): Promise<Metadata> {
  const slides = readSlides();
  const topCarousel = topThreeByType(slides, "carousel");
  const topFlyer = topThreeByType(slides, "flyer");
  const topMedia = topThreeByType(slides, "media");
  const topVideo = topThreeByType(slides, "video");

  const sectionLines = [
    topCarousel.length ? `${SECTION_LABELS.carousel}: ${topCarousel.join(", ")}.` : "",
    topFlyer.length ? `${SECTION_LABELS.flyer}: ${topFlyer.join(", ")}.` : "",
    topMedia.length ? `${SECTION_LABELS.media}: ${topMedia.join(", ")}.` : "",
    topVideo.length ? `${SECTION_LABELS.video}: ${topVideo.join(", ")}.` : "",
  ].filter(Boolean);

  const descriptionParts = [
    `${TAGLINE}. Beranda ${BASE_TITLE}.`,
    ...sectionLines,
  ];
  const description = descriptionParts.join(" ");

  const keywordSeed = [
    "simandaya",
    "man 2 yogyakarta",
    "beranda",
    "ukirprasasti dengan prestasi",
    SECTION_LABELS.carousel.toLowerCase(),
    SECTION_LABELS.flyer.toLowerCase(),
    SECTION_LABELS.media.toLowerCase(),
    SECTION_LABELS.video.toLowerCase(),
    ...topCarousel,
    ...topFlyer,
    ...topMedia,
    ...topVideo,
  ];
  const keywords = Array.from(
    new Set(keywordSeed.map((k) => normalizeText(k).toLowerCase()).filter(Boolean)),
  );

  const metadataBase = getMetadataBase();
  const canonicalPath = "/general";
  const firstImage = slides.find((s) => s.is_active && !!s.image_url)?.image_url ?? null;

  return {
    metadataBase,
    title: {
      absolute: `${BASE_TITLE} | ${TAGLINE}`,
    },
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: BASE_TITLE,
      title: `${BASE_TITLE} | ${TAGLINE}`,
      description,
      images: firstImage ? [{ url: firstImage, alt: BASE_TITLE }] : undefined,
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: `${BASE_TITLE} | ${TAGLINE}`,
      description,
      images: firstImage ? [firstImage] : undefined,
    },
  };
}

interface Props {
  readonly children: ReactNode;
}

export default function GeneralLayout({ children }: Props) {
  return children;
}
