import {
  Baby,
  Bike,
  Dumbbell,
  Gamepad2,
  HeartPulse,
  Laptop,
  type LucideIcon,
  Package,
  PawPrint,
  PenTool,
  Shirt,
  Sparkles,
  Sprout,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/cn";

const categoryStyle: Record<string, { icon: LucideIcon; bg: string }> = {
  "Haushalt & Küche": { icon: UtensilsCrossed, bg: "from-coral-100 via-coral-50 to-sun-100" },
  "Beauty & Pflege": { icon: Sparkles, bg: "from-pink-100 via-rose-50 to-coral-50" },
  "Elektronik & Technik": { icon: Laptop, bg: "from-lilac-100 via-lilac-50 to-sky-50" },
  "Sport & Outdoor": { icon: Dumbbell, bg: "from-emerald-100 via-emerald-50 to-sun-100" },
  "Baby & Kind": { icon: Baby, bg: "from-sky-100 via-sky-50 to-lilac-50" },
  Haustier: { icon: PawPrint, bg: "from-sun-100 via-amber-50 to-coral-50" },
  "Garten & Heimwerken": { icon: Sprout, bg: "from-lime-100 via-emerald-50 to-sand" },
  "Gesundheit & Wellness": { icon: HeartPulse, bg: "from-teal-100 via-emerald-50 to-sky-50" },
  "Mode & Accessoires": { icon: Shirt, bg: "from-rose-100 via-coral-50 to-lilac-50" },
  "Spielzeug & Freizeit": { icon: Gamepad2, bg: "from-sun-100 via-coral-50 to-lilac-100" },
  "Büro & Schreibwaren": { icon: PenTool, bg: "from-sand via-white to-lilac-50" },
  "Auto & Fahrrad": { icon: Bike, bg: "from-slate-100 via-sky-50 to-sand" },
};

export function categoryIcon(category: string) {
  return categoryStyle[category]?.icon ?? Package;
}

export function ProductImage({
  src,
  alt,
  category,
  className,
}: {
  src?: string | null;
  alt: string;
  category: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- beliebige Bild-URLs der Agentur
      <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover", className)} />
    );
  }
  const style = categoryStyle[category] ?? { icon: Package, bg: "from-sand via-white to-coral-50" };
  const Icon = style.icon;
  return (
    <div className={cn("relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br", style.bg, className)} role="img" aria-label={alt}>
      <div className="bg-grain absolute inset-0 opacity-60" />
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/50 blur-2xl" />
      <div className="relative grid aspect-square w-[56%] max-w-20 place-items-center rounded-[28%] bg-white/80 shadow-soft ring-1 ring-white backdrop-blur">
        <Icon className="size-[46%] text-ink/80" strokeWidth={1.6} />
      </div>
    </div>
  );
}
