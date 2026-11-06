"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, UserRoundCog } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/konto", label: "Meine Tests", icon: ClipboardList },
  { href: "/konto/profil", label: "Profil & Einstellungen", icon: UserRoundCog },
];

export function KontoNav() {
  const pathname = usePathname();
  return (
    <nav className="inline-flex self-start rounded-full bg-white p-1 shadow-soft ring-1 ring-line/70 sm:self-auto" aria-label="Kontobereich">
      {items.map((item) => {
        const active = item.href === "/konto" ? pathname === "/konto" || pathname.startsWith("/konto/bewertung") : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              active ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
