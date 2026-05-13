"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, SkipForward } from "lucide-react";

type ImportSummaryProps = {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  warnings: string[];
};

const HIGH_SKIP_RATIO = 0.3;

function extractColumnKey(message: string): string {
  const dq = message.match(/kolom\s+"([^"]+)"/i);
  if (dq?.[1]) return dq[1];
  const sq = message.match(/kolom\s+'([^']+)'/i);
  if (sq?.[1]) return sq[1];
  return "lainnya";
}

function countByColumn(warnings: string[]): Array<{ column: string; count: number }> {
  const map = new Map<string, number>();
  for (const w of warnings) {
    const col = extractColumnKey(w);
    map.set(col, (map.get(col) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([column, count]) => ({ column, count }))
    .sort((a, b) => b.count - a.count);
}

export function ImportSummary({ totalRows, validRows, skippedRows, warnings }: ImportSummaryProps) {
  if (totalRows === 0) return null;

  const skipRatio = totalRows > 0 ? skippedRows / totalRows : 0;
  const highSkip = skipRatio >= HIGH_SKIP_RATIO;
  const columnCounts = countByColumn(warnings);

  return (
    <div
      className={`rounded-lg border p-3 space-y-3 ${
        highSkip
          ? "border-destructive/40 bg-destructive/10"
          : skippedRows > 0
            ? "border-yellow-500/30 bg-yellow-500/10"
            : "border-emerald-500/30 bg-emerald-500/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-foreground">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <span>
            Total baris: <strong>{totalRows}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Siap import: <strong>{validRows}</strong>
          </span>
        </div>
        {skippedRows > 0 && (
          <div
            className={`flex items-center gap-1.5 ${
              highSkip ? "text-destructive" : "text-yellow-700 dark:text-yellow-400"
            }`}
          >
            <SkipForward className="h-4 w-4" />
            <span>
              Dilewati: <strong>{skippedRows}</strong> ({Math.round(skipRatio * 100)}%)
            </span>
          </div>
        )}
      </div>

      {highSkip && (
        <div className="flex items-start gap-2 rounded border border-destructive/40 bg-background/70 p-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <p className="text-xs text-destructive">
            <strong>Banyak baris dilewati ({Math.round(skipRatio * 100)}%).</strong> Periksa data sumber sebelum import.
            Anda masih bisa lanjut, tapi hasil hanya akan berisi {validRows} baris.
          </p>
        </div>
      )}

      {columnCounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {columnCounts.map(({ column, count }) => (
            <span
              key={column}
              className="inline-flex items-center gap-1 rounded border border-border/70 bg-background/70 px-2 py-0.5 text-[11px]"
            >
              <span className="font-mono text-muted-foreground">{column}</span>
              <span className="font-semibold text-foreground">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
