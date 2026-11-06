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
    <div className={cn("mx-auto px-4 pt-10 sm:px-6 sm:pt-14", wide ? "max-w-2xl" : "max-w-md")}>
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-lift sm:p-7">{children}</div>
      {footer && <div className="mt-5 text-sm text-muted">{footer}</div>}
    </div>
  );
}
