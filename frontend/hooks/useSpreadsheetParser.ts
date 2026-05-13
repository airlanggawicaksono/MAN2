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
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
      });
      const errors: string[] = [];

      if (rawRows.length === 0) {
        return {
          rows: [],
          errors: ["File kosong. Pastikan ada header dan data."],
          warnings: [],
          totalRows: 0,
          skippedCount: 0,
        };
      }

      const headerLookup = new Map<string, string>();
      Object.keys(rawRows[0]).forEach((header) => {
        headerLookup.set(normalizeHeader(header), header);
      });

      for (const requiredHeader of requiredHeaders) {
        if (!headerLookup.has(requiredHeader)) {
          errors.push(`Header wajib '${requiredHeader}' tidak ditemukan.`);
        }
      }
      if (errors.length > 0) {
        return { rows: [], errors, warnings: [], totalRows: rawRows.length, skippedCount: 0 };
      }

      const rows: T[] = [];
      const warnings: string[] = [];
      let skippedCount = 0;
      const context = createContext ? createContext() : (undefined as C);

      rawRows.forEach((rawRow, index) => {
        const line = index + 2;
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

      return { rows, errors, warnings, totalRows: rawRows.length, skippedCount };
    },
    [createContext, mapRow, requiredHeaders]
  );

  return { validateFileType, parseFile };
}
