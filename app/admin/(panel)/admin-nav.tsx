"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, Star, Truck, UsersRound, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { adminLogoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { href: "/admin/produkte", label: "Produkte & Bewerbungen", icon: Package, badge: "produkte" },
  { href: "/admin/versand", label: "Versand", icon: Truck, badge: "versand" },
  { href: "/admin/tester", label: "Tester", icon: UsersRound },
  { href: "/admin/bewertungen", label: "Bewertungen", icon: Star },
] as const;

export function AdminNav({ email, badges }: { email: string; badges: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin-Navigation">
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
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
              active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className={cn("size-[18px]", active && "text-coral-400")} />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-white/10 pt-4">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
        <ExternalLink className="size-4" /> Website ansehen
      </Link>
      <form action={adminLogoutAction}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="size-4" /> Abmelden
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-xs text-white/40" title={email}>
        {email}
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden bg-ink lg:block">
        <aside className="sticky top-0 flex h-dvh flex-col gap-8 px-4 py-6">
          <Link href="/admin" className="px-2">
            <Logo light />
          </Link>
          <div className="flex-1">{nav}</div>
          {footer}
        </aside>
      </div>

      {/* Mobil */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link href="/admin">
          <Logo light />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-xl text-white hover:bg-white/10"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-6 overflow-y-auto bg-ink px-4 py-6 lg:hidden">
          {nav}
          {footer}
        </div>
      )}
    </>
  );
}
