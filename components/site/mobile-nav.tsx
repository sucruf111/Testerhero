"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

type Props = {
  links: { href: string; label: string }[];
  loggedIn: boolean;
  logout: () => Promise<void>;
};

export function MobileNav({ links, loggedIn, logout }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-lg text-ink transition hover:bg-sand"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-white px-4 pt-2 pb-4 shadow-lift animate-fade-up">
          <nav className="flex flex-col" aria-label="Mobile Navigation">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-3 text-base font-semibold text-ink hover:bg-sand">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
            {loggedIn ? (
              <>
                <Link href="/konto" className={buttonClass("primary")} onClick={() => setOpen(false)}>
                  Meine Pakete
                </Link>
                <form action={logout}>
                  <button type="submit" className={buttonClass("secondary", "md", "w-full")}>
                    Ausloggen
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/anmelden" className={buttonClass("secondary")}>
                  Einloggen
                </Link>
                <Link href="/registrieren" className={buttonClass("primary")}>
                  Mitmachen
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
