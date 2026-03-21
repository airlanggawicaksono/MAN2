"use client";

import type { LucideIcon } from "lucide-react";

interface HomeSectionHeaderProps {
  icon: LucideIcon;
  title: string;
}

export function HomeSectionHeader({ icon: Icon, title }: HomeSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
    </div>
  );
}
