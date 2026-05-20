export interface ValidationRule {
  isValid: boolean;
  message: string;
}

const YEAR_MIN = 1900;
const YEAR_MAX = new Date().getFullYear() + 10;

export function validateWithAlert(rules: ValidationRule[]): boolean {
  const failedRule = rules.find((rule) => !rule.isValid);
  if (!failedRule) return true;
  if (typeof window !== "undefined") {
    window.alert(failedRule.message);
  }
  return false;
}

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isDigitsOnly(value: string): boolean {
  return /^\d+$/.test(value);
}

export function isOptionalDigits(value: string | null | undefined): boolean {
  if (!value) return true;
  return isDigitsOnly(value);
}

export function isValidYear(value: number | null | undefined): boolean {
  if (value == null) return true;
  return Number.isInteger(value) && value >= YEAR_MIN && value <= YEAR_MAX;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isHttpUrlOrPath(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  return isHttpUrl(value);
}

/// True iff [value] looks like a bare domain (no scheme), e.g. `xxx.com`,
/// `man2yk.sch.id`, or `site.co.id/path`. Used for lenient CTA link entry —
/// admins can type bare domains and the form normalizes by prepending https.
export function isBareDomain(value: string): boolean {
  if (!value || value.includes(" ")) return false;
  if (value.startsWith("/")) return false;
  if (/^https?:/i.test(value)) return false;
  if (!value.includes(".")) return false;
  try {
    const url = new URL(`https://${value}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

/// Normalize user-entered CTA link into something Next.js Link/anchor can use.
/// Bare domains get `https://` prepended. Paths and full URLs pass through.
export function normalizeCtaLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || /^https?:/i.test(trimmed)) return trimmed;
  if (isBareDomain(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function isYouTubeUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  return (
    host === "youtu.be" ||
    host.endsWith(".youtu.be") ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com")
  );
}

export function isGoogleMapsEmbedUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  return host.includes("google.") && url.pathname.includes("/maps/embed");
}

export function isPhoneLike(value: string): boolean {
  if (!value) return true;
  return /^\+?\d{6,20}$/.test(value);
}

export function normalizeJenisKelamin(value: string): "Laki-Laki" | "Perempuan" | undefined {
  const v = value.trim().toLowerCase().replace(/[-_\s]/g, "");
  if (!v) return undefined;
  if (v === "lakilaki" || v === "l" || v === "pria" || v === "male" || v === "m") return "Laki-Laki";
  if (v === "perempuan" || v === "p" || v === "wanita" || v === "female" || v === "f") return "Perempuan";
  return undefined;
}
