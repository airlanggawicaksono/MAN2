"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const SCHEDULE_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];

export interface ScheduleGridEvent {
  id: string;
  day: ScheduleDay;
  start: string; // HH:mm
  end: string; // HH:mm
  title: string;
  subtitle?: string;
  className?: string;
}

interface ScheduleGridProps {
  events: ScheduleGridEvent[];
  editable?: boolean;
  stepMinutes?: number;
  rowHeight?: number;
  onEventChange?: (eventId: string, next: { day: ScheduleDay; start: string; end: string }) => void | Promise<void>;
  onEventDelete?: (eventId: string) => void | Promise<void>;
  onEventEdit?: (eventId: string) => void;
  onEventCopy?: (eventId: string) => void | Promise<void>;
}

type DraftPosition = {
  day: ScheduleDay;
  startMin: number;
  endMin: number;
};

type InteractionState = {
  eventId: string;
  mode: "drag" | "resize-start" | "resize-end";
  pointerStartX: number;
  pointerStartY: number;
  originDayIndex: number;
  originStartMin: number;
  originEndMin: number;
};

const MIN_TIME = 5 * 60; // 05:00
const MAX_TIME = 18 * 60; // 18:00

export function ScheduleGrid({
  events,
  editable = false,
  stepMinutes = 30,
  rowHeight = 28,
  onEventChange,
  onEventDelete,
  onEventEdit,
  onEventCopy,
}: ScheduleGridProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [draftById, setDraftById] = useState<Record<string, DraftPosition>>({});
  const [interaction, setInteraction] = useState<InteractionState | null>(null);

  const timeRange = useMemo(
    () => ({
      startMin: floorToStep(MIN_TIME, stepMinutes),
      endMin: ceilToStep(MAX_TIME, stepMinutes),
    }),
    [stepMinutes],
  );

  const rows = useMemo(() => {
    const out: number[] = [];
    for (let t = timeRange.startMin; t <= timeRange.endMin; t += stepMinutes) out.push(t);
    return out;
  }, [timeRange, stepMinutes]);

  const totalHeight = Math.max(1, rows.length - 1) * rowHeight;

  const visualEvents = useMemo(() => {
    return events.map((e) => {
      const draft = draftById[e.id];
      const startMin = draft?.startMin ?? toMinutes(e.start);
      const endMin = draft?.endMin ?? toMinutes(e.end);
      const day = draft?.day ?? e.day;
      return { ...e, startMin, endMin, day };
    });
  }, [events, draftById]);

  const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!interaction || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const dayWidth = rect.width / SCHEDULE_DAYS.length;
    const deltaX = ev.clientX - interaction.pointerStartX;
    const deltaY = ev.clientY - interaction.pointerStartY;
    const rowDelta = Math.round(deltaY / rowHeight);
    const minDelta = rowDelta * stepMinutes;
    const dayDelta = Math.round(deltaX / dayWidth);
    const targetDayIdx = clamp(interaction.originDayIndex + dayDelta, 0, SCHEDULE_DAYS.length - 1);
    let nextStart = interaction.originStartMin;
    let nextEnd = interaction.originEndMin;

    if (interaction.mode === "drag") {
      const duration = interaction.originEndMin - interaction.originStartMin;
      nextStart = clamp(interaction.originStartMin + minDelta, timeRange.startMin, timeRange.endMin - duration);
      nextEnd = nextStart + duration;
    } else if (interaction.mode === "resize-start") {
      nextStart = clamp(interaction.originStartMin + minDelta, timeRange.startMin, interaction.originEndMin - stepMinutes);
    } else {
      nextEnd = clamp(interaction.originEndMin + minDelta, interaction.originStartMin + stepMinutes, timeRange.endMin);
    }

    setDraftById((prev) => ({
      ...prev,
      [interaction.eventId]: {
        day: SCHEDULE_DAYS[targetDayIdx],
        startMin: nextStart,
        endMin: nextEnd,
      },
    }));
  };

  const commitInteraction = async () => {
    if (!interaction || !onEventChange) return setInteraction(null);
    const draft = draftById[interaction.eventId];
    setInteraction(null);
    if (!draft) return;
    await onEventChange(interaction.eventId, {
      day: draft.day,
      start: toTimeString(draft.startMin),
      end: toTimeString(draft.endMin),
    });
    setDraftById((prev) => {
      const copy = { ...prev };
      delete copy[interaction.eventId];
      return copy;
    });
  };

  const startInteraction = (
    ev: React.PointerEvent,
    eventId: string,
    mode: InteractionState["mode"],
    day: ScheduleDay,
    startMin: number,
    endMin: number,
  ) => {
    if (!editable) return;
    ev.preventDefault();
    ev.stopPropagation();
    const dayIdx = SCHEDULE_DAYS.indexOf(day);
    setInteraction({
      eventId,
      mode,
      pointerStartX: ev.clientX,
      pointerStartY: ev.clientY,
      originDayIndex: Math.max(0, dayIdx),
      originStartMin: startMin,
      originEndMin: endMin,
    });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="min-w-[1080px]">
          <div className="grid grid-cols-[100px_repeat(6,minmax(0,1fr))] border-b bg-muted/30">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waktu</div>
            {SCHEDULE_DAYS.map((day) => (
              <div key={day} className="border-l px-3 py-2 text-sm font-semibold">
                {day}
              </div>
            ))}
          </div>

          <div
            ref={boardRef}
            className="relative grid grid-cols-[100px_repeat(6,minmax(0,1fr))]"
            onPointerMove={onPointerMove}
            onPointerUp={commitInteraction}
            onPointerCancel={commitInteraction}
          >
            <div className="relative border-r">
              {rows.slice(0, -1).map((t, i) => (
                <div
                  key={t}
                  className="absolute inset-x-0 border-b px-2 text-[11px] text-muted-foreground"
                  style={{ top: i * rowHeight, height: rowHeight }}
                >
                  {toTimeString(t)}
                </div>
              ))}
            </div>

            {SCHEDULE_DAYS.map((day) => (
              <div key={day} className="relative border-l" style={{ height: totalHeight }}>
                {rows.slice(0, -1).map((t, i) => (
                  <div
                    key={`${day}-${t}`}
                    className={cn("absolute inset-x-0 border-b", i % 2 === 0 ? "bg-background" : "bg-muted/10")}
                    style={{ top: i * rowHeight, height: rowHeight }}
                  />
                ))}

                {visualEvents
                  .filter((e) => e.day === day)
                  .map((event) => {
                    const top = ((event.startMin - timeRange.startMin) / stepMinutes) * rowHeight;
                    const height = Math.max(rowHeight, ((event.endMin - event.startMin) / stepMinutes) * rowHeight);
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md border bg-primary/10 px-2 py-1 text-xs shadow-sm",
                          event.className,
                        )}
                        style={{ top, height, touchAction: "none" }}
                        onPointerDown={(ev) =>
                          startInteraction(ev, event.id, "drag", event.day, event.startMin, event.endMin)
                        }
                      >
                        <div className="line-clamp-1 pr-16 text-xs font-semibold">{event.title}</div>
                        {event.subtitle ? <div className="line-clamp-1 text-[11px] text-muted-foreground">{event.subtitle}</div> : null}
                        <div className="text-[10px] text-muted-foreground">{toTimeString(event.startMin)} - {toTimeString(event.endMin)}</div>

                        {(onEventEdit || onEventDelete || onEventCopy) && (
                          <div className="absolute right-1 top-1 flex gap-1">
                            {onEventCopy ? (
                              <button
                                type="button"
                                className="rounded bg-background/90 p-1 hover:bg-background"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  void onEventCopy(event.id);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            ) : null}
                            {onEventEdit ? (
                              <button
                                type="button"
                                className="rounded bg-background/90 p-1 hover:bg-background"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onEventEdit(event.id);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            ) : null}
                            {onEventDelete ? (
                              <button
                                type="button"
                                className="rounded bg-background/90 p-1 hover:bg-background"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  void onEventDelete(event.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            ) : null}
                          </div>
                        )}

                        {editable && (
                          <>
                            <div
                              className="absolute inset-x-3 -top-1 h-2 cursor-ns-resize rounded bg-transparent"
                              onPointerDown={(ev) =>
                                startInteraction(ev, event.id, "resize-start", event.day, event.startMin, event.endMin)
                              }
                            />
                            <div
                              className="absolute inset-x-3 -bottom-1 h-2 cursor-ns-resize rounded bg-transparent"
                              onPointerDown={(ev) =>
                                startInteraction(ev, event.id, "resize-end", event.day, event.startMin, event.endMin)
                              }
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {editable
          ? "Drag kartu untuk pindah hari/jam. Tarik tepi atas/bawah kartu untuk ubah durasi (snap 30 menit)."
          : "Tampilan jadwal mingguan."}
      </p>
    </div>
  );
}

function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map((v) => Number(v));
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
