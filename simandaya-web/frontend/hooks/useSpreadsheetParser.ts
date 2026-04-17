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

function normalizeCell(value: unknown): string {
  return String(value ?? "").trim();
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
    async (file: File): Promise<{ rows: T[]; errors: string[] }> => {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return { rows: [], errors: ["File tidak memiliki sheet."] };
      }

      const firstSheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
      });
      const errors: string[] = [];

      if (rawRows.length === 0) {
        return { rows: [], errors: ["File kosong. Pastikan ada header dan data."] };
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
        return { rows: [], errors };
      }

      const rows: T[] = [];
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

        if (result.skip) return;
        if (result.error) {
          errors.push(result.error);
          return;
        }
        if (result.row) {
          rows.push(result.row);
        }
      });

      return { rows, errors };
    },
    [createContext, mapRow, requiredHeaders]
  );

  return { validateFileType, parseFile };
}
