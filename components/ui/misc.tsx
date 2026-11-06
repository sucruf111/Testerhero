import { Star } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/constants";
import { cn } from "@/lib/cn";

const tones: Record<Tone, string> = {
  amber: "bg-sun-100 text-amber-800 ring-sun-300/60",
  violet: "bg-lilac-50 text-lilac-700 ring-lilac-100",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  coral: "bg-coral-50 text-coral-700 ring-coral-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  slate: "bg-sand text-muted ring-line",
  red: "bg-red-50 text-red-700 ring-red-200",
};

const dots: Record<Tone, string> = {
  amber: "bg-sun-500",
  violet: "bg-lilac-500",
  sky: "bg-sky-500",
  coral: "bg-coral-500",
  green: "bg-emerald-500",
  slate: "bg-muted/50",
  red: "bg-red-500",
};

export function Badge({ tone = "slate", children, className, dot = true }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/70 sm:p-8", className)}>{children}</div>;
}

export function Stars({ value, size = "md", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = { sm: "size-3.5", md: "size-4.5", lg: "size-6" }[size];
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={cn("relative inline-block", px)}>
            <Star className={cn("absolute inset-0 text-line", px)} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("text-sun-400", px)} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line bg-white/50 px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-coral-50 text-coral-500 [&_svg]:size-7">{icon}</div>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      {children && <div className="mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const palette = ["bg-coral-100 text-coral-700", "bg-lilac-100 text-lilac-700", "bg-sun-100 text-amber-800", "bg-emerald-100 text-emerald-800", "bg-sky-100 text-sky-800"];
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold", palette[hash % palette.length], className)}>
      {initials}
    </span>
  );
}
