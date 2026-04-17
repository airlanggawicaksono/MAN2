"use client";

import { Search } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SelectionItem = {
  id: string;
};

type SelectionAssignDialogProps<T extends SelectionItem> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  emptyText?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  topContent?: ReactNode;
  bottomContent?: ReactNode;
  isItemDisabled?: (item: T) => boolean;
  renderItem: (item: T, selected: boolean) => ReactNode;
};

export function SelectionAssignDialog<T extends SelectionItem>({
  open,
  onOpenChange,
  title,
  items,
  selectedIds,
  onToggle,
  onSubmit,
  submitLabel,
  cancelLabel = "Batal",
  submitDisabled,
  emptyText = "Tidak ada data.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  topContent,
  bottomContent,
  isItemDisabled,
  renderItem,
}: SelectionAssignDialogProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {onSearchChange ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
          ) : null}

          {topContent}

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : null}
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              const disabled = isItemDisabled?.(item) ?? false;
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                    disabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    selected
                      ? "border-primary bg-primary/5"
                      : !disabled
                        ? "hover:bg-muted/50"
                        : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => {
                      if (!disabled) onToggle(item.id);
                    }}
                    className="rounded"
                  />
                  <div className="min-w-0 flex-1">{renderItem(item, selected)}</div>
                </label>
              );
            })}
          </div>

          {bottomContent}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" disabled={submitDisabled} onClick={onSubmit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
