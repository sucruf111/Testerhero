import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentTester } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "/#so-gehts", label: "So geht’s" },
  { href: "/#regeln", label: "Regeln" },
  { href: "/#fragen", label: "Fragen" },
];

export async function SiteHeader() {
  const tester = await getCurrentTester();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="TesterHero Startseite" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {tester ? (
            <>
              <LinkButton href="/konto" variant="secondary" size="sm">
                <UserRound /> Meine Pakete
              </LinkButton>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-sand hover:text-ink"
                  aria-label="Ausloggen"
                  title="Ausloggen"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <LinkButton href="/anmelden" variant="ghost" size="sm">
                Einloggen
              </LinkButton>
              <LinkButton href="/registrieren" size="sm">
                Kostenlos mitmachen
              </LinkButton>
            </>
          )}
        </div>

        <MobileNav links={links} loggedIn={Boolean(tester)} logout={logoutAction} />
      </div>
    </header>
  );
}
