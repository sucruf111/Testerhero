"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/konto", label: "Meine Pakete" },
  { href: "/konto/profil", label: "Profil" },
];

export function KontoNav() {
  const pathname = usePathname();
  return (
    <nav className="inline-flex self-start rounded-xl border border-line bg-cream p-1 sm:self-auto" aria-label="Kontobereich">
      {items.map((item) => {
        const active = item.href === "/konto" ? pathname === "/konto" || pathname.startsWith("/konto/bewertung") : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition",
              active ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
