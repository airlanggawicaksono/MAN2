"use client";

import { useEffect, useState } from "react";
import type { CarouselSlide } from "@/types/cms";

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export function useGeneralHomeController() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [flyerItems, setFlyerItems] = useState<CarouselSlide[]>([]);
  const [mediaItems, setMediaItems] = useState<CarouselSlide[]>([]);
  const [videoItems, setVideoItems] = useState<CarouselSlide[]>([]);
  const [lokasiItems, setLokasiItems] = useState<CarouselSlide[]>([]);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/data.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => {
        setSlides(
          data
            .filter((s) => s.is_active)
            .filter((s) => !s.type || s.type === "carousel"),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/cms/slides")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CarouselSlide[]) => {
        const active = data.filter((s) => s.is_active);
        setFlyerItems(active.filter((s) => s.type === "flyer"));
        setMediaItems(active.filter((s) => s.type === "media"));
        setVideoItems(active.filter((s) => s.type === "video"));
        setLokasiItems(active.filter((s) => s.type === "lokasi"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    videoItems.forEach((video) => {
      if (!video.link_url) return;
      const videoId = extractYouTubeId(video.link_url);
      if (!videoId || videoTitles[video.id]) return;
      fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(
          video.link_url,
        )}&format=json`,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.title) {
            setVideoTitles((prev) => ({ ...prev, [video.id]: data.title }));
          }
        })
        .catch(() => {});
    });
  }, [videoItems, videoTitles]);

  return {
    flyerItems,
    lokasiItems,
    mediaItems,
    slides,
    videoItems,
    videoTitles,
  };
}

