"use client";

import { useEffect, useState } from "react";
import type { AppNotice } from "@/lib/app-notify";
import { subscribeNotice } from "@/lib/app-notify";

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
    <div className="pointer-events-none fixed right-6 top-6 z-[120] flex max-w-sm flex-col gap-2">
      {items.map((notice) => (
        <div
          key={notice.id}
          className={`rounded-md border px-4 py-2 text-sm shadow-lg ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : notice.type === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          {notice.message}
        </div>
      ))}
    </div>
  );
}
