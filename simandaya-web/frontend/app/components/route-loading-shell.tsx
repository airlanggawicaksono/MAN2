type RouteLoadingShellProps = {
  title?: string;
};

export function RouteLoadingShell({ title = "Memuat halaman..." }: RouteLoadingShellProps) {
  return (
    <div className="min-h-[60vh] w-full p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-md bg-muted/80" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl border bg-card" />
          <div className="h-28 animate-pulse rounded-xl border bg-card" />
          <div className="h-28 animate-pulse rounded-xl border bg-card" />
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="h-5 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/80" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/80" />
          <div className="h-10 w-4/5 animate-pulse rounded-md bg-muted/80" />
        </div>

        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
