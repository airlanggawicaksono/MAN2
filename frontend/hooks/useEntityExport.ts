"use client";

import { useState } from "react";
import { exportRows, type ExportColumn, type ExportFormat } from "@/lib/exportSheet";

export type ExportScope = "filtered" | "all";

type FetchFn<T> = () => Promise<{ items: T[] }>;

interface UseEntityExportOptions<T> {
  fetchFiltered: FetchFn<T>;
  fetchAll: FetchFn<T>;
  columns: ExportColumn<T>[];
  filenames: { filtered: string; all: string };
}

export function useEntityExport<T>({
  fetchFiltered,
  fetchAll,
  columns,
  filenames,
}: UseEntityExportOptions<T>) {
  const [scope, setScope] = useState<ExportScope | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: ExportFormat) {
    if (!scope) return;
    setExporting(true);
    try {
      const res = scope === "filtered" ? await fetchFiltered() : await fetchAll();
      const filenameBase = scope === "filtered" ? filenames.filtered : filenames.all;
      exportRows(res.items, columns, filenameBase, format);
      setScope(null);
    } finally {
      setExporting(false);
    }
  }

  return {
    scope,
    open: (s: ExportScope) => setScope(s),
    close: () => setScope(null),
    exporting,
    handleExport,
  };
}
