"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
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
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] bg-[#173B52] text-[#F3F1EA] shadow-xl">
        <div className="flex items-center justify-between border-b border-white/15 px-4 py-4">
          <p className="text-sm font-semibold tracking-wide text-[#8FC3DD]">Menu Navigasi</p>
          <button
            aria-label="Tutup menu"
            className="rounded-md p-2 text-[#8FC3DD] hover:bg-white/10 hover:text-[#F3F1EA]"
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
                    className="rounded-md bg-white/5"
                    open={isActive}
                  >
                    <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-[#8FC3DD] hover:text-[#F3F1EA]">
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
                              "block rounded-md px-3 py-2 text-sm transition-colors " +
                              (childActive
                                ? "bg-white/15 text-[#EAD79A] font-semibold"
                                : "text-[#8FC3DD] hover:bg-white/10 hover:text-[#F3F1EA]")
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
                    "block rounded-md px-3 py-2 text-sm transition-colors " +
                    (isActive
                      ? "bg-white/15 text-[#EAD79A] font-semibold"
                      : "text-[#8FC3DD] hover:bg-white/10 hover:text-[#F3F1EA]")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-white/15 pt-4">
            <button
              onClick={() => {
                onOpenChange(false);
                onActionClick();
              }}
              className="w-full rounded-md border border-[#8FC3DD]/40 px-3 py-2 text-sm text-[#8FC3DD] transition-colors hover:bg-white/10 hover:text-[#F3F1EA]"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
