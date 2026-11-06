import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentTester } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "/produkte", label: "Produkttests" },
  { href: "/#so-funktionierts", label: "So funktioniert’s" },
  { href: "/#faq", label: "FAQ" },
];

export async function SiteHeader() {
  const tester = await getCurrentTester();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="TesterHero Startseite" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {tester ? (
            <>
              <LinkButton href="/konto" variant="secondary" size="sm">
                <UserRound /> {tester.firstName}
              </LinkButton>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-sand hover:text-ink"
                  aria-label="Abmelden"
                  title="Ausloggen"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <LinkButton href="/anmelden" variant="ghost" size="sm">
                Anmelden
              </LinkButton>
              <LinkButton href="/registrieren" size="sm">
                Tester:in werden
              </LinkButton>
            </>
          )}
        </div>

        <MobileNav links={links} loggedIn={Boolean(tester)} firstName={tester?.firstName} logout={logoutAction} />
      </div>
    </header>
  );
}
