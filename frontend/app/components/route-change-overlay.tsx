"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_VISIBLE_MS = 320;
const MAX_VISIBLE_MS = 900;

export default function RouteChangeOverlay() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setVisible(true);
    const startedAt = Date.now();
    const minTimer = setTimeout(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => setVisible(false), remaining);
    }, MIN_VISIBLE_MS);
    const safety = setTimeout(() => setVisible(false), MAX_VISIBLE_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(safety);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-primary/10">
      <div className="h-full w-2/5 animate-[route-loading_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite] bg-primary shadow-[0_0_8px_oklch(var(--primary)/0.6)]" />
    </div>
  );
}
