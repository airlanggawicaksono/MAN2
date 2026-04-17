"use client";

import type { LucideIcon } from "lucide-react";

interface DashboardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function DashboardHeader({ icon: Icon, title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
