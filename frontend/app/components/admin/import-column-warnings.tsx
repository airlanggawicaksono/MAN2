"use client";

type ImportColumnWarningsProps = {
  warnings: string[];
  title?: string;
};

type WarningGroup = {
  column: string;
  items: string[];
};

const FALLBACK_COLUMN = "lainnya";

function extractColumnKey(message: string): string {
  const doubleQuoteMatch = message.match(/kolom\s+"([^"]+)"/i);
  if (doubleQuoteMatch?.[1]) return doubleQuoteMatch[1];

  const singleQuoteMatch = message.match(/kolom\s+'([^']+)'/i);
  if (singleQuoteMatch?.[1]) return singleQuoteMatch[1];

  return FALLBACK_COLUMN;
}

function groupWarningsByColumn(warnings: string[]): WarningGroup[] {
  const groups = new Map<string, string[]>();

  for (const warning of warnings) {
    const column = extractColumnKey(warning);
    if (!groups.has(column)) groups.set(column, []);
    groups.get(column)!.push(warning);
  }

  return Array.from(groups.entries()).map(([column, items]) => ({ column, items }));
}

export function ImportColumnWarnings({
  warnings,
  title = "Format kolom tidak valid (import diblokir):",
}: ImportColumnWarningsProps) {
  if (warnings.length === 0) return null;

  const grouped = groupWarningsByColumn(warnings);

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
      <p className="text-xs font-semibold text-destructive">{title}</p>
      <p className="text-[11px] text-destructive/90">
        Tiap kolom menampilkan maksimal 5 item sekaligus. Scroll untuk lihat sisanya.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {grouped.map((group) => (
          <div key={group.column} className="rounded border border-destructive/30 bg-background/70 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-destructive">
                kolom "{group.column}"
              </p>
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">
                {group.items.length} item
              </span>
            </div>
            <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
              {group.items.map((item, index) => (
                <li key={`${group.column}-${index}`} className="text-xs text-destructive">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
