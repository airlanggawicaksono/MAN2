"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = isAuthenticated && user?.user_type === "Admin";

  useEffect(() => {
    if (!mounted) return;
    if (!isAdmin) {
      router.replace("/");
    }
  }, [mounted, isAdmin, router]);

  if (!mounted || !isAdmin) return null;

  return <>{children}</>;
}
