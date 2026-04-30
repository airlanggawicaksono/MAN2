"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { isNavGroup } from "@/config/navigation";

interface NavSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[];
  actionLabel: string;
  onActionClick: () => void;
}

export function NavSidebar({
  open,
  onOpenChange,
  navItems,
  actionLabel,
  onActionClick,
}: NavSidebarProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Tutup menu"
        className="absolute inset-0 bg-foreground/35"
        onClick={() => onOpenChange(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-border/50 bg-secondary text-secondary-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-secondary-foreground/15 px-4 py-4">
          <p className="text-sm font-semibold tracking-wide text-secondary-foreground/80">Menu Navigasi</p>
          <button
            aria-label="Tutup menu"
            className="rounded-md p-2 text-secondary-foreground/80 transition-colors duration-200 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto px-3 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (isNavGroup(item)) {
                const isActive = item.children.some((child) => pathname === child.href);
                return (
                  <details
                    key={item.label}
                    className="rounded-md bg-secondary-foreground/5"
                    open={isActive}
                  >
                    <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-secondary-foreground/80 hover:text-secondary-foreground">
                      {item.label}
                    </summary>
                    <div className="space-y-1 px-2 pb-2">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={false}
                            onClick={() => onOpenChange(false)}
                            className={
                              "block rounded-md px-3 py-2 text-sm transition-colors duration-200 " +
                              (childActive
                                ? "bg-accent/40 text-secondary-foreground font-semibold"
                                : "text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground")
                            }
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => onOpenChange(false)}
                  className={
                    "block rounded-md px-3 py-2 text-sm transition-colors duration-200 " +
                    (isActive
                      ? "bg-accent/40 text-secondary-foreground font-semibold"
                      : "text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-secondary-foreground/15 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
                onActionClick();
              }}
              className="w-full"
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
