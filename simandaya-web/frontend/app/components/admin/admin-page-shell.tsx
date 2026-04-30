import type { ReactNode } from "react";

interface AdminPageShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  description,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div className="w-full space-y-8 px-4 py-7 md:px-8 md:py-10 lg:px-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
