"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

type SearchableSelectProps = {
  value?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Data tidak ditemukan.",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  useEffect(() => {
    if (!open) setQuery(selected?.label ?? "");
  }, [open, selected]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery(selected?.label ?? "");
      }}
    >
      <PopoverAnchor asChild>
        <div className={cn("relative w-full", className)}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            value={query}
            placeholder={open ? searchPlaceholder : placeholder}
            onFocus={() => {
              if (!open) {
                setOpen(true);
                setQuery("");
              }
            }}
            onChange={(event) => {
              if (!open) setOpen(true);
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            className="h-9 w-full pr-9 pl-9"
          />
          <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width, 100%)" }}
        align="start"
      >
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">{emptyText}</p>
          ) : null}
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
                setQuery(option.label);
              }}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="truncate">{option.label}</span>
              <Check
                className={cn(
                  "ml-2 h-4 w-4 shrink-0",
                  option.value === value ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
