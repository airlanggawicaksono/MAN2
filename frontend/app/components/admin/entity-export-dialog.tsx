"use client";

import { ExportDialog } from "./export-dialog";
import type { ExportScope } from "@/hooks/useEntityExport";
import type { ExportFormat } from "@/lib/exportSheet";

interface EntityExportDialogProps {
  scope: ExportScope | null;
  onClose: () => void;
  entityLabel: string;
  isLoading?: boolean;
  onExport: (format: ExportFormat) => void | Promise<void>;
  filteredHint?: string;
}

export function EntityExportDialog({
  scope,
  onClose,
  entityLabel,
  isLoading,
  onExport,
  filteredHint,
}: EntityExportDialogProps) {
  const lower = entityLabel.toLowerCase();
  const title =
    scope === "all" ? `Export Semua ${entityLabel}` : `Export ${entityLabel} (Tampilan)`;
  const description =
    scope === "all"
      ? `Mengekspor seluruh data ${lower} tanpa filter.`
      : filteredHint ?? `Mengekspor data ${lower} sesuai pencarian aktif.`;

  return (
    <ExportDialog
      open={scope !== null}
      onClose={onClose}
      title={title}
      description={description}
      isLoading={isLoading}
      onExport={onExport}
    />
  );
}
