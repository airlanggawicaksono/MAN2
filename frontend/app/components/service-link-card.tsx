"use client";

import type { LucideIcon } from "lucide-react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ServiceLinkCardProps {
  title: string;
  description: string;
  link: string;
  image: string;
  hoverColorClassName: string;
  buttonHoverClassName: string;
  icon?: LucideIcon;
  overlayLabel?: string;
  onActionClick?: () => void;
}

export function ServiceLinkCard({
  title,
  description,
  link,
  image,
  hoverColorClassName,
  buttonHoverClassName,
  icon: Icon,
  overlayLabel,
  onActionClick,
}: ServiceLinkCardProps) {
  const isExternal = link.startsWith("http");
  const target = isExternal ? "_blank" : "_self";
  const rel = isExternal ? "noopener noreferrer" : undefined;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/80 bg-card transition-colors duration-200 hover:border-primary/30">
      <div className="relative h-48 w-full overflow-hidden border-b border-border/70 bg-muted/25">
        <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-end p-4">
          {Icon ? (
            <div className="rounded-sm border border-white/45 bg-foreground/25 p-2 text-white">
              <Icon className="h-4 w-4" />
            </div>
          ) : overlayLabel ? (
            <span className="rounded-sm border border-white/35 bg-foreground/30 px-2 py-1 text-xs font-medium uppercase tracking-wide text-white">
              {overlayLabel}
            </span>
          ) : null}
        </div>
      </div>

      <CardHeader className="pt-5">
        <CardTitle className={`text-lg font-semibold text-foreground transition-colors duration-200 ${hoverColorClassName}`}>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>

      <CardFooter className="border-t border-border/70 pb-5 pt-4">
        {onActionClick ? (
          <Button
            onClick={onActionClick}
            variant="outline"
            className={`group/btn h-10 w-full rounded-sm border-border/80 font-medium transition-colors duration-200 ${buttonHoverClassName}`}
          >
            <span className="flex items-center justify-center gap-2">
              Buka Layanan
              <ExternalLink className="h-4 w-4" />
            </span>
          </Button>
        ) : isExternal ? (
          <Button
            asChild
            variant="outline"
            className={`group/btn h-10 w-full rounded-sm border-border/80 font-medium transition-colors duration-200 ${buttonHoverClassName}`}
          >
            <a href={link} target={target} rel={rel} className="flex items-center justify-center gap-2">
              Buka Layanan
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className={`group/btn h-10 w-full rounded-sm border-border/80 font-medium transition-colors duration-200 ${buttonHoverClassName}`}
          >
            <Link href={link} prefetch={false} className="flex items-center justify-center gap-2">
              Buka Layanan
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
