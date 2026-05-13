"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type { ExportFormat } from "@/lib/exportSheet";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  isLoading?: boolean;
  onExport: (format: ExportFormat) => void | Promise<void>;
}

export function ExportDialog({
  open,
  onClose,
  title,
  description,
  isLoading = false,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("xlsx");

  const handleExport = async () => {
    await onExport(format);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Pilih format file:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("xlsx")}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                format === "xlsx"
                  ? "border-primary bg-primary/5"
                  : "border-border/70 hover:border-border"
              }`}
            >
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">XLSX</span>
              <span className="text-xs text-muted-foreground">Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                format === "csv"
                  ? "border-primary bg-primary/5"
                  : "border-border/70 hover:border-border"
              }`}
            >
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">CSV</span>
              <span className="text-xs text-muted-foreground">Teks</span>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" disabled={isLoading} onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? "Memproses..." : `Export ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
