"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import type { NavItem } from "@/config/navigation";
import { isNavGroup } from "@/config/navigation";
import { NavSidebar } from "./nav-sidebar";

const triggerStyle =
  "text-[#8FC3DD] bg-transparent hover:text-[#F3F1EA] hover:bg-white/5 data-[state=open]:text-[#F3F1EA] data-[active]:text-[#EAD79A]";
const activeTriggerStyle =
  "text-[#EAD79A] font-semibold bg-transparent hover:text-[#F3F1EA] hover:bg-white/5 data-[state=open]:text-[#F3F1EA]";
const dropdownLinkStyle =
  "block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

interface SharedHeaderProps {
  navItems: NavItem[];
  actionLabel: string;
  onActionClick: () => void;
}

export default function SharedHeader({
  navItems,
  actionLabel,
  onActionClick,
}: SharedHeaderProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="relative bg-[#173B52] text-[#F3F1EA] px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3 lg:gap-4">
        <Image src="/man2.png" alt="Logo" width={48} height={48} priority className="shrink-0 lg:h-[60px] lg:w-[60px]" />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-sm font-semibold tracking-wide lg:text-xl">
            Madrasah Aliyah Negeri 2 Yogyakarta
          </h1>
          <p className="truncate text-xs text-[#8FC3DD] italic lg:text-sm">Ukir prasasti dengan prestasi</p>
        </div>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <NavigationMenu>
          <NavigationMenuList className="gap-1">
            {navItems.map((item) => {
              if (isNavGroup(item)) {
                const isActive = item.children.some((child) => pathname === child.href);
                return (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger className={isActive ? activeTriggerStyle : triggerStyle}>
                      {item.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className={`${item.width ?? "w-[240px]"} p-2`}>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <NavigationMenuLink asChild>
                              {child.href.startsWith("http") ? (
                                <a
                                  href={child.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={dropdownLinkStyle}
                                >
                                  {child.label}
                                </a>
                              ) : (
                                <Link href={child.href} prefetch={false} className={dropdownLinkStyle}>
                                  {child.label}
                                </Link>
                              )}
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              }

              const isActive = pathname === item.href;
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    asChild
                    className={
                      navigationMenuTriggerStyle() + " " + (isActive ? activeTriggerStyle : triggerStyle)
                    }
                  >
                    <Link href={item.href} prefetch={false}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <button
          onClick={onActionClick}
          className="text-[#8FC3DD] hover:text-[#F3F1EA] transition-colors text-sm px-4 py-2"
        >
          {actionLabel}
        </button>
      </div>

      <button
        aria-label="Buka menu"
        className="inline-flex items-center justify-center rounded-md border border-[#8FC3DD]/40 p-2 text-[#8FC3DD] transition-colors hover:bg-white/10 hover:text-[#F3F1EA] lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <NavSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        navItems={navItems}
        actionLabel={actionLabel}
        onActionClick={onActionClick}
      />
    </header>
  );
}
