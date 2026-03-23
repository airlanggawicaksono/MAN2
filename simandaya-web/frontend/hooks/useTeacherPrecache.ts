"use client";

import { useEffect } from "react";
import { teachersApi } from "@/api/admin/teachers";

const usePrefetch = teachersApi.usePrefetch;

const CHUNK = 30;

/**
 * Precaches adjacent 30-item chunks into RTK Query state so pagination
 * feels instant. Given the current offset (skip), it prefetches:
 *  - Next chunk  (skip + CHUNK) if within total
 *  - Prev chunk  (skip - CHUNK) if >= 0
 *
 * @param skip   Current query offset (not display page number)
 * @param total  Total records returned by the API
 * @param search Current search term (forwarded to prefetch calls)
 */
export function useTeacherPrecache(skip: number, total: number, search?: string) {
  const prefetch = usePrefetch("listTeachers");

  useEffect(() => {
    if (total === 0) return;

    const chunkIndex = Math.floor(skip / CHUNK);

    // Next chunk
    const nextSkip = (chunkIndex + 1) * CHUNK;
    if (nextSkip < total) {
      const remaining = total - nextSkip;
      if (remaining >= CHUNK) {
        prefetch({ skip: nextSkip, limit: CHUNK, search });
      }
    }

    // Prev chunk
    const prevSkip = (chunkIndex - 1) * CHUNK;
    if (prevSkip >= 0) {
      const remaining = total - prevSkip;
      if (remaining >= CHUNK) {
        prefetch({ skip: prevSkip, limit: CHUNK, search });
      }
    }
  }, [skip, total, search, prefetch]);
}
