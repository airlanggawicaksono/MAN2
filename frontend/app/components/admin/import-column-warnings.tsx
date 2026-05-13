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
  title = "Peringatan kolom — beberapa baris dilewati atau nilai diabaikan:",
}: ImportColumnWarningsProps) {
  if (warnings.length === 0) return null;

  const grouped = groupWarningsByColumn(warnings);

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-2">
      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{title}</p>
      <p className="text-[11px] text-yellow-700/80 dark:text-yellow-400/80">
        Tiap kolom menampilkan maksimal 5 item sekaligus. Scroll untuk lihat sisanya.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {grouped.map((group) => (
          <div key={group.column} className="rounded border border-yellow-500/30 bg-background/70 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                kolom "{group.column}"
              </p>
              <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] text-yellow-700 dark:text-yellow-400">
                {group.items.length} item
              </span>
            </div>
            <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
              {group.items.map((item, index) => (
                <li key={`${group.column}-${index}`} className="text-xs text-yellow-700 dark:text-yellow-400">
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
