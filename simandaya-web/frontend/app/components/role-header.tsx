"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import AdminHeader from "./admin-header";
import GuruHeader from "./guru-header";
import PublicHeader from "./public-header";
import SiswaHeader from "./siswa-header";

export default function RoleHeader() {
  const [mounted, setMounted] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && user?.user_type === "Admin") return <AdminHeader />;
  if (mounted && user?.user_type === "Guru") return <GuruHeader />;
  if (mounted && user?.user_type === "Siswa") return <SiswaHeader />;
  return <PublicHeader />;
}
