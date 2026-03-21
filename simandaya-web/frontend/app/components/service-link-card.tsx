import type { LucideIcon } from "lucide-react";
import { ExternalLink } from "lucide-react";
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
}: ServiceLinkCardProps) {
  const isExternal = link.startsWith("http");
  const target = isExternal ? "_blank" : "_self";
  const rel = isExternal ? "noopener noreferrer" : undefined;

  return (
    <Card className="group border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden rounded-2xl bg-white">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
          {Icon ? (
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
              <Icon className="w-5 h-5 text-white" />
            </div>
          ) : overlayLabel ? (
            <span className="text-white text-xs font-medium uppercase tracking-wider">
              {overlayLabel}
            </span>
          ) : null}
        </div>
      </div>

      <CardHeader className="pt-6">
        <CardTitle className={`text-xl font-bold text-slate-900 transition-colors ${hoverColorClassName}`}>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </CardContent>

      <CardFooter className="pb-8 pt-2">
        <Button
          asChild
          className={`w-full h-12 rounded-xl bg-slate-900 text-white font-semibold transition-all shadow-md active:scale-95 group/btn ${buttonHoverClassName}`}
        >
          <a href={link} target={target} rel={rel} className="flex items-center justify-center gap-2">
            Buka Layanan
            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
