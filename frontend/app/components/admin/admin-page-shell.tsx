import type { ReactNode } from "react";

interface AdminPageShellProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  description,
  eyebrow,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div className="w-full space-y-8 px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-end gap-2">{actions}</div> : null}
      </header>
      <div className="h-px w-12 bg-[oklch(var(--accent))]" aria-hidden />
      {children}
    </div>
  );
}
