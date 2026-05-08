"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  disabled?: boolean;
  onClick: () => void;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-xl shadow-black/10 animate-in slide-in-from-bottom-4 duration-200"
      style={{ minWidth: "min(520px, calc(100vw - 2rem))" }}
    >
      <span className="flex-1 text-sm font-medium text-foreground">
        {selectedCount} dipilih
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action, i) => (
          <Button
            key={i}
            type="button"
            size="sm"
            variant={action.variant ?? "outline"}
            disabled={action.disabled}
            onClick={action.onClick}
            className="gap-1.5"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Batalkan pilihan"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
