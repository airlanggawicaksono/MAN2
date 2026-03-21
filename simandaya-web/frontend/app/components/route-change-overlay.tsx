"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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
    const timer = setTimeout(() => setVisible(false), 280);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] bg-background/45 backdrop-blur-[1px]">
      <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden">
        <div className="h-full w-1/3 animate-[route-loading_0.8s_ease-in-out_infinite] bg-primary" />
      </div>
    </div>
  );
}
