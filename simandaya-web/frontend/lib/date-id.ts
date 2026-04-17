function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

export function normalizeDateToIso(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyNumeric = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyNumeric) {
    const day = Number.parseInt(dmyNumeric[1], 10);
    const month = Number.parseInt(dmyNumeric[2], 10);
    const year = Number.parseInt(dmyNumeric[3], 10);
    if (!isValidDateParts(year, month, day)) return "";
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return "";
}

export function formatIsoToIdDate(value?: string | null): string {
  const iso = normalizeDateToIso(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

export function formatIsoToApiDmy(value?: string): string | undefined {
  const iso = normalizeDateToIso(value);
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
