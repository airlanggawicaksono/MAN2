"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useListPublicCivitasQuery } from "@/api/admin/userman";

export function useGeneralStrukturOrganisasiController() {
  const [search, setSearch] = useState("");
  const { data, isLoading: loading, error } = useListPublicCivitasQuery({
    limit: 100,
  });
  const civitas = data?.items ?? [];

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartVisible, setChartVisible] = useState(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filteredCivitas = useMemo(() => {
    return civitas.filter((p) => {
      const searchLower = search.toLowerCase();
      return (
        (p.nama || "").toLowerCase().includes(searchLower) ||
        (p.nip || "").toLowerCase().includes(searchLower) ||
        (p.nik || "").toLowerCase().includes(searchLower) ||
        (p.matapelajaran || "").toLowerCase().includes(searchLower)
      );
    });
  }, [civitas, search]);

  return {
    chartRef,
    chartVisible,
    civitas,
    error,
    filteredCivitas,
    loading,
    search,
    setSearch,
  };
}

