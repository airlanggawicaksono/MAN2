export function diagLog(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const payload = { event, data, ts: new Date().toISOString() };
  console.log(`[DIAG] ${event}`, data ?? "");
  fetch("/api/diag/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
