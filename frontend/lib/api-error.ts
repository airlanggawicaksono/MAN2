export function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const status = (error as { status?: unknown }).status;

  // Network failure (CORS, DNS, server down, etc.)
  if (status === "FETCH_ERROR") {
    return "Tidak dapat menghubungi server. Periksa koneksi.";
  }
  if (status === "TIMEOUT_ERROR") {
    return "Permintaan melebihi batas waktu. Coba lagi.";
  }
  if (status === "PARSING_ERROR") {
    return "Respons server tidak valid (kemungkinan body terlalu besar atau proxy error).";
  }

  if (!("data" in error)) {
    if (typeof status === "number") {
      return mapHttpStatus(status);
    }
    return undefined;
  }

  const data = (error as { data?: unknown }).data;

  // Non-JSON response (e.g. nginx HTML error page for 413/502/504).
  if (typeof data === "string") {
    if (typeof status === "number") {
      return `${mapHttpStatus(status)} (${status})`;
    }
    return data.slice(0, 200);
  }

  if (!data || typeof data !== "object") {
    if (typeof status === "number") return mapHttpStatus(status);
    return undefined;
  }

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String((item as { msg?: unknown }).msg ?? "")
          : "",
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof status === "number") return mapHttpStatus(status);
  return undefined;
}

function mapHttpStatus(status: number): string {
  if (status === 413) return "Data terlalu besar. Naikkan client_max_body_size di nginx (saat ini 20M).";
  if (status === 502) return "Backend tidak merespons (502 Bad Gateway). Periksa container backend.";
  if (status === 504) return "Backend timeout (504 Gateway Timeout).";
  if (status === 401) return "Sesi habis. Silakan login ulang.";
  if (status === 403) return "Tidak punya izin untuk aksi ini.";
  if (status === 404) return "Endpoint tidak ditemukan.";
  if (status >= 500) return `Server error (${status}).`;
  if (status >= 400) return `Permintaan ditolak (${status}).`;
  return `HTTP ${status}`;
}

