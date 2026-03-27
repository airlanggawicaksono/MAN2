"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <header className="bg-[#173B52] text-[#F3F1EA] px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Image src="/man2.png" alt="Logo" width={60} height={60} priority />
        <div className="leading-tight">
          <h1 className="text-xl font-semibold tracking-wide">
            Madrasah Aliyah Negeri 2 Yogyakarta
          </h1>
          <p className="text-sm text-[#8FC3DD] italic">Ukir prasasti dengan prestasi</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
    </header>
  );
}
