"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, Settings, Star, Truck, UsersRound, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { adminLogoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { href: "/admin/produkte", label: "Produkte", icon: Package },
  { href: "/admin/versand", label: "Versand", icon: Truck, badge: "versand" },
  { href: "/admin/tester", label: "Tester", icon: UsersRound },
  { href: "/admin/bewertungen", label: "Bewertungen", icon: Star },
  { href: "/admin/einstellungen", label: "Einstellungen", icon: Settings },
] as const;

export function AdminNav({ email, badges }: { email: string; badges: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Admin-Navigation">
      {items.map((item) => {
        const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
        const badge = "badge" in item ? badges[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
              active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className={cn("size-4", active && "text-coral-400")} />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && <span className="rounded bg-coral-500 px-1.5 text-[11px] font-bold text-white">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-0.5 border-t border-white/10 pt-3">
      <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-white/60 hover:bg-white/5 hover:text-white">
        <ExternalLink className="size-3.5" /> Website ansehen
      </Link>
      <form action={adminLogoutAction}>
        <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="size-3.5" /> Ausloggen
        </button>
      </form>
      <p className="truncate px-2.5 pt-1 text-xs text-white/40" title={email}>
        {email}
      </p>
    </div>
  );

  return (
    <>
      <div className="hidden bg-ink lg:block">
        <aside className="sticky top-0 flex h-dvh flex-col gap-6 px-3 py-5">
          <Link href="/admin" className="px-2">
            <Logo light />
          </Link>
          <div className="flex-1">{nav}</div>
          {footer}
        </aside>
      </div>

      <div className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-2.5 lg:hidden">
        <Link href="/admin">
          <Logo light />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-lg text-white hover:bg-white/10"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-13 bottom-0 z-40 flex flex-col gap-5 overflow-y-auto bg-ink px-3 py-4 lg:hidden">
          {nav}
          {footer}
        </div>
      )}
    </>
  );
}
