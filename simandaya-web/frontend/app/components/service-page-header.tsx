"use client";

interface ServicePageHeaderProps {
  title: string;
  description: string;
  accentClassName: string;
}

export function ServicePageHeader({
  title,
  description,
  accentClassName,
}: ServicePageHeaderProps) {
  return (
    <div className="max-w-4xl space-y-3">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
      <p className="max-w-[72ch] text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
      <div className={`h-1.5 w-20 rounded-full ${accentClassName}`} />
    </div>
  );
}
