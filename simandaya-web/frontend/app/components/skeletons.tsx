import { TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  label?: string;
}

export function TableSkeleton({ rows = 6, label }: TableSkeletonProps) {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label={label ?? "Memuat data"}
    >
      <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-12 w-full animate-pulse rounded-md bg-muted/70" />
      ))}
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

interface StatLineSkeletonProps {
  count?: number;
}

export function StatLineSkeleton({ count = 4 }: StatLineSkeletonProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-8 gap-y-2 border-y border-border/60 py-3"
      role="status"
      aria-busy="true"
      aria-label="Memuat statistik"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="h-5 w-10 animate-pulse rounded bg-muted" />
          <span className="h-3 w-14 animate-pulse rounded bg-muted/70" />
        </span>
      ))}
    </div>
  );
}

interface CardListSkeletonProps {
  rows?: number;
}

export function CardListSkeleton({ rows = 4 }: CardListSkeletonProps) {
  return (
    <ul
      className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/70 bg-card"
      role="status"
      aria-busy="true"
      aria-label="Memuat daftar"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-4 px-4 py-4 sm:px-6">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-1/3 animate-pulse rounded bg-muted" />
            <span className="block h-3 w-2/3 animate-pulse rounded bg-muted/70" />
          </span>
        </li>
      ))}
    </ul>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function CardGridSkeleton({ count = 6, columns = 3 }: CardGridSkeletonProps) {
  const gridClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div
      className={`grid grid-cols-1 gap-4 ${gridClass}`}
      role="status"
      aria-busy="true"
      aria-label="Memuat konten"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border/70 bg-card p-4">
          <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted/80" />
          <div className="h-3 w-full animate-pulse rounded bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Memuat formulir">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <span className="block h-3 w-24 animate-pulse rounded bg-muted/70" />
          <span className="block h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}

interface HeroSkeletonProps {
  ratio?: string;
}

export function HeroSkeleton({ ratio = "aspect-[16/6]" }: HeroSkeletonProps) {
  return (
    <div
      className={`${ratio} w-full animate-pulse rounded-lg border border-border/60 bg-muted/40`}
      role="status"
      aria-busy="true"
      aria-label="Memuat banner"
    />
  );
}

interface VideoGridSkeletonProps {
  count?: number;
  columns?: 2 | 3;
}

export function VideoGridSkeleton({ count = 2, columns = 2 }: VideoGridSkeletonProps) {
  const gridClass = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <div
      className={`grid gap-6 ${gridClass}`}
      role="status"
      aria-busy="true"
      aria-label="Memuat video"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-video w-full animate-pulse rounded-lg border border-border/60 bg-muted/40"
        />
      ))}
    </div>
  );
}

interface MediaListSkeletonProps {
  rows?: number;
}

export function MediaListSkeleton({ rows = 3 }: MediaListSkeletonProps) {
  return (
    <div
      className="flex flex-col gap-2 py-2"
      role="status"
      aria-busy="true"
      aria-label="Memuat konten"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-2">
          <div className="h-12 w-16 shrink-0 animate-pulse rounded bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted/80" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableBodyRowSkeletonProps {
  rows?: number;
  cols: number;
}

export function TableBodyRowSkeleton({ rows = 5, cols }: TableBodyRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skel-${i}`}>
          <TableCell colSpan={cols} className="py-2">
            <div className="h-9 w-full animate-pulse rounded-md bg-muted/70" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
