"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";

type ParseHelpers = {
  line: number;
  get: (headerKey: string) => string;
};

type ParseRowResult<T> = {
  row?: T;
  error?: string;
  skip?: boolean;
  warnings?: string[];
};

type SpreadsheetParserOptions<T, C> = {
  requiredHeaders: readonly string[];
  createContext?: () => C;
  mapRow: (
    rawRow: Record<string, unknown>,
    helpers: ParseHelpers,
    context: C
  ) => ParseRowResult<T>;
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function dateToIso(dt: Date): string {
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function excelSerialToIso(serial: number): string | null {
  // Excel epoch: 1899-12-30 (handles 1900 leap year bug).
  if (!Number.isFinite(serial) || serial <= 0 || serial > 2958465) return null;
  const ms = Math.round(serial * 86400000);
  const dt = new Date(Date.UTC(1899, 11, 30) + ms);
  if (Number.isNaN(dt.getTime())) return null;
  return dateToIso(dt);
}

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return dateToIso(value);
  }
  if (typeof value === "number") {
    // Fallback: decimal serial in plausible date range when cellDates didn't catch it.
    if (!Number.isInteger(value) && value > 3650 && value < 73050) {
      const iso = excelSerialToIso(value);
      if (iso) return iso;
    }
    return String(value);
  }
  return String(value).trim();
}

function rowHasContent(row: unknown[]): boolean {
  return row.some((cell) => normalizeCell(cell) !== "");
}

// Skip leading blank rows (Google Sheets pads exports with empty rows/columns).
// Returns index of first row containing any non-empty cell, or -1 if none.
function findHeaderRow(grid: unknown[][]): number {
  for (let i = 0; i < grid.length; i += 1) {
    if (rowHasContent(grid[i])) return i;
  }
  return -1;
}

type HeaderMap = {
  headerByCol: Map<number, string>;
  lookup: Map<string, string>;
};

// Build column-index → label map from header row, dropping blank cells.
// Filters out Google-export artifacts: empty headers, whitespace-only headers.
function buildHeaderMap(headerRow: unknown[]): HeaderMap {
  const headerByCol = new Map<number, string>();
  const lookup = new Map<string, string>();
  headerRow.forEach((rawHeader, colIdx) => {
    const label = normalizeCell(rawHeader);
    if (label === "") return;
    headerByCol.set(colIdx, label);
    lookup.set(normalizeHeader(label), label);
  });
  return { headerByCol, lookup };
}

// Reconstruct a row object using only known (non-blank) header columns.
// Returns null if every named column is empty for this row.
function buildRowObject(
  row: unknown[],
  headerByCol: Map<number, string>,
): Record<string, unknown> | null {
  const obj: Record<string, unknown> = {};
  let hasAny = false;
  headerByCol.forEach((label, colIdx) => {
    const value = row[colIdx] ?? "";
    obj[label] = value;
    if (normalizeCell(value) !== "") hasAny = true;
  });
  return hasAny ? obj : null;
}

export function useSpreadsheetParser<T, C = undefined>({
  requiredHeaders,
  createContext,
  mapRow,
}: SpreadsheetParserOptions<T, C>) {
  const validateFileType = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return null;
    }
    return "Format file tidak didukung. Gunakan CSV atau XLSX.";
  }, []);

  const parseFile = useCallback(
    async (
      file: File,
    ): Promise<{
      rows: T[];
      errors: string[];
      warnings: string[];
      totalRows: number;
      skippedCount: number;
    }> => {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return { rows: [], errors: ["File tidak memiliki sheet."], warnings: [], totalRows: 0, skippedCount: 0 };
      }

      const firstSheet = workbook.Sheets[firstSheetName];
      // Read as 2D grid so we can detect/skip Google Sheets export artifacts
      // (leading blank rows, blank columns) before trusting any header row.
      // Keep blank rows in grid (no blankrows:false) so file line numbers stay accurate.
      const grid = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
        header: 1,
        defval: "",
      });
      const errors: string[] = [];

      if (grid.length === 0) {
        return {
          rows: [],
          errors: ["File kosong. Pastikan ada header dan data."],
          warnings: [],
          totalRows: 0,
          skippedCount: 0,
        };
      }

      const headerRowIdx = findHeaderRow(grid);
      if (headerRowIdx === -1) {
        return {
          rows: [],
          errors: ["Tidak menemukan baris header. Pastikan ada baris berisi nama kolom."],
          warnings: [],
          totalRows: 0,
          skippedCount: 0,
        };
      }

      const { headerByCol, lookup: headerLookup } = buildHeaderMap(grid[headerRowIdx]);

      for (const requiredHeader of requiredHeaders) {
        if (!headerLookup.has(requiredHeader)) {
          errors.push(`Header wajib '${requiredHeader}' tidak ditemukan.`);
        }
      }

      // Pair each data row with its real file line (1-indexed) so error messages
      // point at the actual row the user sees in Excel/Sheets even after we
      // skipped leading blanks.
      const dataGrid = grid.slice(headerRowIdx + 1);
      const indexedRows: { obj: Record<string, unknown>; line: number }[] = [];
      dataGrid.forEach((row, dataIdx) => {
        const obj = buildRowObject(row, headerByCol);
        if (obj) indexedRows.push({ obj, line: headerRowIdx + 2 + dataIdx });
      });

      if (errors.length > 0) {
        return { rows: [], errors, warnings: [], totalRows: indexedRows.length, skippedCount: 0 };
      }

      const rows: T[] = [];
      const warnings: string[] = [];
      let skippedCount = 0;
      const context = createContext ? createContext() : (undefined as C);

      indexedRows.forEach(({ obj: rawRow, line }) => {
        const result = mapRow(
          rawRow,
          {
            line,
            get: (headerKey: string) =>
              normalizeCell(rawRow[headerLookup.get(headerKey) ?? ""]),
          },
          context
        );

        if (result.warnings?.length) {
          result.warnings.forEach((w) => warnings.push(`Baris ${line}: ${w}`));
        }
        if (result.skip) {
          skippedCount += 1;
          return;
        }
        if (result.error) {
          errors.push(result.error);
          return;
        }
        if (result.row) {
          rows.push(result.row);
        }
      });

      return { rows, errors, warnings, totalRows: indexedRows.length, skippedCount };
    },
    [createContext, mapRow, requiredHeaders]
  );

  return { validateFileType, parseFile };
}
