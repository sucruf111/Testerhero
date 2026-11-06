import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="th-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7C58" />
          <stop offset="1" stopColor="#EC4321" />
        </linearGradient>
      </defs>
      <path
        d="M20 2.5 34.5 8v11.2c0 9-6.1 15.8-14.5 18.3C11.6 35 5.5 28.2 5.5 19.2V8L20 2.5Z"
        fill="url(#th-grad)"
      />
      <path
        d="m20 11 2.47 5.01 5.53.8-4 3.9.94 5.5L20 23.62l-4.94 2.6.94-5.5-4-3.9 5.53-.8L20 11Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("font-display text-[22px] font-bold tracking-tight", light ? "text-white" : "text-ink")}>
        Tester<span className="text-coral-500">Hero</span>
      </span>
    </span>
  );
}
