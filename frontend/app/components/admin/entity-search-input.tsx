"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EntitySearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EntitySearchInput({
  placeholder,
  value,
  onChange,
  className,
}: EntitySearchInputProps) {
  return (
    <div className={className ?? "relative max-w-sm"}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
      />
    </div>
  );
}

