import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-coral-200/40 blur-3xl" />
      <div className={cn("relative mx-auto px-4 pt-12 pb-4 sm:px-6 sm:pt-16", wide ? "max-w-3xl" : "max-w-md")}>
        <div className="text-center">
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight sm:text-[2.75rem]">{title}</h1>
          {subtitle && <p className="mx-auto mt-3 max-w-lg text-[17px] text-muted">{subtitle}</p>}
        </div>
        <div className="mt-9 rounded-[2rem] bg-white p-6 shadow-lift ring-1 ring-line/70 sm:p-9">{children}</div>
        {footer && <div className="mt-6 text-center text-[15px] text-muted">{footer}</div>}
      </div>
    </div>
  );
}
