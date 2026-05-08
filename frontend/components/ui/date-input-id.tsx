"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatIsoToIdDate, normalizeDateToIso } from "@/lib/date-id";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DayCalendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

type BaseProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
>;

interface DateInputIdProps extends BaseProps {
  value: string;
  onValueChange: (isoDate: string) => void;
}

export function DateInputId({
  value,
  onValueChange,
  ...props
}: DateInputIdProps) {
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 6;
  const toYear = currentYear + 5;
  const [textValue, setTextValue] = React.useState(formatIsoToIdDate(value));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setTextValue(formatIsoToIdDate(value));
  }, [value]);

  const selectedDate = React.useMemo(() => {
    const iso = normalizeDateToIso(value);
    if (!iso) return undefined;
    const [year, month, day] = iso
      .split("-")
      .map((part) => Number.parseInt(part, 10));
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
  }, [value]);

  const commitValue = React.useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        onValueChange("");
        setTextValue("");
        return;
      }
      const iso = normalizeDateToIso(trimmed);
      if (!iso) return;
      onValueChange(iso);
      setTextValue(formatIsoToIdDate(iso));
    },
    [onValueChange],
  );

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn("pr-10", props.className)}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={textValue}
        onChange={(event) => {
          const next = event.target.value;
          setTextValue(next);
          const parsed = normalizeDateToIso(next);
          if (parsed) onValueChange(parsed);
        }}
        onBlur={() => commitValue(textValue)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitValue(textValue);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            aria-label="Pilih tanggal"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <DayCalendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            onSelect={(date) => {
              if (!date) return;
              const iso = `${date.getFullYear()}-${String(
                date.getMonth() + 1,
              ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              onValueChange(iso);
              setTextValue(formatIsoToIdDate(iso));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
