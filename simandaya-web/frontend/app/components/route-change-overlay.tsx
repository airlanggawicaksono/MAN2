"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteChangeOverlay() {
  const enabled = process.env.NEXT_PUBLIC_ROUTE_OVERLAY === "1";
  const pathname = usePathname();
  const firstRender = useRef(true);
  const prevPathname = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (firstRender.current) {
      firstRender.current = false;
      prevPathname.current = pathname;
      return;
    }

    const prev = prevPathname.current ?? "";
    const isLayananTransition =
      prev.startsWith("/general/layanan") && pathname.startsWith("/general/layanan");
    prevPathname.current = pathname;
    if (isLayananTransition) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 120);
    return () => clearTimeout(timer);
  }, [enabled, pathname]);

  if (!enabled || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] bg-background/35">
      <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden">
        <div className="h-full w-1/3 animate-[route-loading_0.65s_linear_infinite] bg-primary" />
      </div>
    </div>
  );
}
