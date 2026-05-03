"use client";

import { useEffect, useState } from "react";
import type { AppNotice } from "@/lib/app-notify";
import { subscribeNotice } from "@/lib/app-notify";

function toneClass(type: AppNotice["type"]): string {
  if (type === "success") {
    return "border-[oklch(var(--chart-3)/0.45)] bg-[oklch(var(--chart-3)/0.12)] text-[oklch(var(--chart-3))]";
  }
  if (type === "error") {
    return "border-destructive/40 bg-destructive/10 text-destructive";
  }
  return "border-border/70 bg-card text-foreground";
}

export default function AppNotifications() {
  const [items, setItems] = useState<AppNotice[]>([]);

  useEffect(() => {
    return subscribeNotice((notice) => {
      setItems((prev) => [...prev, notice]);
      const timeoutMs = notice.durationMs ?? 2200;
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== notice.id));
      }, timeoutMs);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-20 z-[120] flex max-w-sm flex-col gap-2 lg:top-24"
      role="status"
      aria-live="polite"
    >
      {items.map((notice) => (
        <div
          key={notice.id}
          className={`rounded-md border px-4 py-2 text-sm shadow-lg ${toneClass(notice.type)}`}
        >
          {notice.message}
        </div>
      ))}
    </div>
  );
}
