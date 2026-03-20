"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { siswaNav } from "@/config/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth";
import { useLogoutMutation } from "@/api/public/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SharedHeader from "./shared-header";

export default function SiswaHeader() {
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
      <SharedHeader
        navItems={siswaNav}
        actionLabel="Keluar"
        onActionClick={() => setShowLogoutDialog(true)}
      />

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogDescription>Apakah Anda ingin keluar dari Simandaya?</DialogDescription>
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
