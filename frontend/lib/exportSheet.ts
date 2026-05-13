import * as XLSX from "xlsx";

export type ExportFormat = "csv" | "xlsx";

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function buildSheet<T>(rows: T[], columns: ExportColumn<T>[]) {
  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    for (const col of columns) {
      const value = col.accessor(row);
      obj[col.header] = value === null || value === undefined ? "" : value;
    }
    return obj;
  });
  return XLSX.utils.json_to_sheet(data, {
    header: columns.map((c) => c.header),
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportRows<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filenameBase: string,
  format: ExportFormat,
): void {
  const sheet = buildSheet(rows, columns);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const ext = format === "csv" ? "csv" : "xlsx";
  const mime =
    format === "csv"
      ? "text/csv;charset=utf-8;"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const output = XLSX.write(workbook, {
    bookType: format,
    type: "array",
  }) as ArrayBuffer;
  const blob = new Blob([output], { type: mime });
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `${filenameBase}-${stamp}.${ext}`);
}
