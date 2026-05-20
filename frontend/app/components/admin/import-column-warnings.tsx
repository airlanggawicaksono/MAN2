"use client";

type ImportColumnWarningsProps = {
  warnings: string[];
  title?: string;
};

const FALLBACK_COLUMN = "lainnya";
const FALLBACK_EXPECTED = "format yang valid";

function extractColumnKey(message: string): string {
  const doubleQuoteMatch = message.match(/kolom\s+"([^"]+)"/i);
  if (doubleQuoteMatch?.[1]) return doubleQuoteMatch[1];
  const singleQuoteMatch = message.match(/kolom\s+'([^']+)'/i);
  if (singleQuoteMatch?.[1]) return singleQuoteMatch[1];
  return FALLBACK_COLUMN;
}

function extractExpected(message: string): string {
  const m = message.match(/\(harus\s+([^)]+)\)/i);
  return m?.[1]?.trim() ?? FALLBACK_EXPECTED;
}

type Summary = { column: string; count: number; expected: string };

function summarize(warnings: string[]): Summary[] {
  const acc = new Map<string, Summary>();
  for (const w of warnings) {
    const column = extractColumnKey(w);
    const existing = acc.get(column);
    if (existing) {
      existing.count += 1;
      continue;
    }
    acc.set(column, { column, count: 1, expected: extractExpected(w) });
  }
  return Array.from(acc.values()).sort((a, b) => b.count - a.count);
}

export function ImportColumnWarnings({
  warnings,
  title = "Peringatan format kolom — baris bermasalah dilewati, sisanya tetap diimpor:",
}: ImportColumnWarningsProps) {
  if (warnings.length === 0) return null;
  const summary = summarize(warnings);

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-2">
      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{title}</p>
      <ul className="space-y-1">
        {summary.map((s) => (
          <li key={s.column} className="text-xs text-yellow-700 dark:text-yellow-400">
            <span className="font-medium">kolom &quot;{s.column}&quot;</span>: {s.count} baris formatnya salah → harus {s.expected}.
          </li>
        ))}
      </ul>
    </div>
  );
}
