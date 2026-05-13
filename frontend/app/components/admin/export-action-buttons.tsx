"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExportScope } from "@/hooks/useEntityExport";

interface ExportActionButtonsProps {
  onTrigger: (scope: ExportScope) => void;
  disabled?: boolean;
}

export function ExportActionButtons({ onTrigger, disabled }: ExportActionButtonsProps) {
  return (
    <>
      <Button variant="outline" disabled={disabled} onClick={() => onTrigger("filtered")}>
        <Download className="h-4 w-4 mr-2" />
        Export Tampilan
      </Button>
      <Button variant="outline" disabled={disabled} onClick={() => onTrigger("all")}>
        <Download className="h-4 w-4 mr-2" />
        Export Semua
      </Button>
    </>
  );
}
