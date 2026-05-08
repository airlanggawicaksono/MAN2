export function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if (!("data" in error)) return undefined;

  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return undefined;

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

  return undefined;
}

