"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth";
import { useLogoutMutation } from "@/api/public/auth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { adminNav, isNavGroup } from "@/config/navigation";

const triggerStyle = "text-[#F3F1EA] bg-transparent hover:bg-white/10 data-[state=open]:bg-white/10";
const dropdownLinkStyle = "block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

export default function AdminHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } finally {
      dispatch(logout());
      setShowLogoutDialog(false);
      router.push("/");
    }
  };

  return (
    <>
      <header className="bg-[#173B52] text-[#F3F1EA] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/man2.png" alt="Logo" width={60} height={60} priority />
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-wide">
              Madrasah Aliyah Negeri 2 Yogyakarta
            </h1>
            <p className="text-sm text-[#8FC3DD] italic">
              Ukir prasasti dengan prestasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {adminNav.map((item) =>
                isNavGroup(item) ? (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger className={triggerStyle}>
                      {item.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className={`${item.width ?? "w-[240px]"} p-2`}>
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <NavigationMenuLink asChild>
                              <Link href={child.href} className={dropdownLinkStyle}>
                                {child.label}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle() + " " + triggerStyle}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="text-[#8FC3DD] hover:text-[#F3F1EA] transition-colors text-sm px-4 py-2"
          >
            Keluar
          </button>
        </div>
      </header>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogDescription>
              Apakah Anda ingin keluar dari Simandaya?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowLogoutDialog(false)}
              className="px-4 py-2 rounded-md border border-input text-sm hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Ya, Keluar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
