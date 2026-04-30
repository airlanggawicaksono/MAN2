"use client";

import type { LucideIcon } from "lucide-react";

interface HomeSectionHeaderProps {
  icon: LucideIcon;
  title: string;
}

export function HomeSectionHeader({ icon: Icon, title }: HomeSectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-card text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
    </div>
  );
}
