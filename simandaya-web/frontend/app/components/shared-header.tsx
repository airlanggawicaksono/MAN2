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
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { isNavGroup } from "@/config/navigation";
import { NavSidebar } from "./nav-sidebar";

const triggerStyle =
  "h-10 rounded-md border border-transparent bg-transparent px-3 text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground data-[state=open]:border-secondary-foreground/35 data-[state=open]:bg-secondary-foreground/10 data-[state=open]:text-secondary-foreground";
const activeTriggerStyle =
  "h-10 rounded-md border border-secondary-foreground/40 bg-secondary-foreground/12 px-3 font-semibold text-secondary-foreground hover:bg-secondary-foreground/15 hover:text-secondary-foreground";
const dropdownLinkStyle =
  "block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors duration-200 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground";

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
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-secondary-foreground/20 bg-secondary px-4 py-3 text-secondary-foreground lg:px-8 lg:py-4">
      <div className="flex min-w-0 items-center gap-4 lg:gap-6">
        <Image
          src="/man2.png"
          alt="Logo MAN 2"
          width={52}
          height={52}
          priority
          className="shrink-0 rounded-md bg-card/10 p-1 ring-1 ring-white/25 lg:h-[62px] lg:w-[62px]"
        />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-sm font-semibold tracking-wide lg:text-xl">
            Madrasah Aliyah Negeri 2 Yogyakarta
          </h1>
          <p className="truncate text-xs text-secondary-foreground/70 lg:text-sm">
            Ukir prasasti dengan prestasi
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-3 lg:ml-auto lg:flex">
        <NavigationMenu className="max-w-none">
          <NavigationMenuList className="gap-1">
            {navItems.map((item, index) => {
              if (isNavGroup(item)) {
                const isActive = item.children.some((child) => pathname === child.href);
                const shouldAlignRight = index >= navItems.length - 2;
                return (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger className={isActive ? activeTriggerStyle : triggerStyle}>
                      {item.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className={shouldAlignRight ? "left-auto right-0" : undefined}>
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
                    <Link href={item.href} prefetch={false}>
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
        <Button
          variant="secondary"
          size="sm"
          onClick={onActionClick}
          className="min-w-20 rounded-md border border-secondary-foreground/35 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10"
        >
          {actionLabel}
        </Button>
      </div>

      <button
        aria-label="Buka menu"
        className="inline-flex items-center justify-center rounded-md border border-secondary-foreground/35 p-2 text-secondary-foreground transition-colors duration-200 hover:bg-secondary-foreground/10 lg:hidden"
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
