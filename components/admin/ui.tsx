import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm font-semibold text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description && <div className="mt-1.5 text-[15px] text-muted">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  accent?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className={cn("text-sm font-semibold", accent ? "text-white/80" : "text-muted")}>{label}</p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl [&_svg]:size-[18px]",
            accent ? "bg-white/15 text-white" : "bg-coral-50 text-coral-600",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold">{value}</p>
      {hint && <p className={cn("mt-1 text-sm", accent ? "text-white/75" : "text-muted")}>{hint}</p>}
    </>
  );
  const className = cn(
    "block rounded-3xl p-5 ring-1 transition",
    accent ? "bg-gradient-to-br from-coral-500 to-coral-400 text-white ring-coral-500 shadow-glow" : "bg-white ring-line/70 shadow-soft",
    href && "hover:-translate-y-0.5 hover:shadow-lift",
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function Panel({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/70", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
          {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={padded ? "p-5 sm:p-6" : undefined}>{children}</div>
    </section>
  );
}

export function Tabs({ items }: { items: { href: string; label: string; count?: number; active: boolean }[] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-soft ring-1 ring-line/70" aria-label="Filter">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition",
            t.active ? "bg-ink text-white" : "text-ink-soft hover:bg-sand",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-xs", t.active ? "bg-white/20" : "bg-sand text-muted")}>{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export const th = "px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase whitespace-nowrap";
export const td = "px-4 py-3.5 align-top text-sm";
