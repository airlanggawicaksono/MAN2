"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { roleRoutePrefix } from "@/config/navigation";
import type { UserType } from "@/types/auth";

interface RoleRouteGuardProps {
  requiredRole: UserType;
  children: ReactNode;
}

export default function RoleRouteGuard({ requiredRole, children }: RoleRouteGuardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated || !user) {
      router.replace("/");
      return;
    }

    if (user.user_type !== requiredRole) {
      router.replace(roleRoutePrefix[user.user_type] ?? "/");
    }
  }, [mounted, isAuthenticated, user, requiredRole, router]);

  if (!mounted) return null;
  if (!isAuthenticated || !user) return null;
  if (user.user_type !== requiredRole) return null;

  return <>{children}</>;
}
