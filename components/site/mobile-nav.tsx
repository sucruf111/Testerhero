"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

type Props = {
  links: { href: string; label: string }[];
  loggedIn: boolean;
  firstName?: string;
  logout: () => Promise<void>;
};

export function MobileNav({ links, loggedIn, firstName, logout }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-full text-ink transition hover:bg-sand"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
      >
        {open ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-18 bottom-0 z-50 overflow-y-auto bg-cream px-4 pt-4 pb-10 animate-fade-up">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-4 font-display text-2xl font-semibold text-ink hover:bg-sand">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
            {loggedIn ? (
              <>
                <Link href="/konto" className={buttonClass("primary", "lg")} onClick={() => setOpen(false)}>
                  Meine Tests{firstName ? ` · ${firstName}` : ""}
                </Link>
                <form action={logout}>
                  <button type="submit" className={buttonClass("secondary", "lg", "w-full")}>
                    Ausloggen
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/registrieren" className={buttonClass("primary", "lg")}>
                  Kostenlos Tester:in werden
                </Link>
                <Link href="/anmelden" className={buttonClass("secondary", "lg")}>
                  Anmelden
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
