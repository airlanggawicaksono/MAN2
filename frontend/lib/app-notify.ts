"use client";

export type AppNoticeType = "success" | "error" | "info";

export type AppNotice = {
  id: string;
  type: AppNoticeType;
  message: string;
  durationMs?: number;
};

type NoticeListener = (notice: AppNotice) => void;

const listeners = new Set<NoticeListener>();

export function subscribeNotice(listener: NoticeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notify(message: string, type: AppNoticeType = "info", durationMs = 2200): void {
  const notice: AppNotice = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
    durationMs,
  };
  listeners.forEach((listener) => listener(notice));
}

export function notifySuccess(message: string, durationMs?: number): void {
  notify(message, "success", durationMs ?? 2200);
}

export function notifyError(message: string, durationMs?: number): void {
  notify(message, "error", durationMs ?? 2600);
}
