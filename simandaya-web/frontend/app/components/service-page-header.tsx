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
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h1>
      <p className="text-lg text-slate-600 leading-relaxed">{description}</p>
      <div className={`w-24 h-1.5 rounded-full ${accentClassName}`} />
    </div>
  );
}
