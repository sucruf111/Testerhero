import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Die Community für ehrliche Produkttests. Teste Neuheiten vor allen anderen und hilf Marken, noch besser zu
            werden.
          </p>
        </div>
        <FooterCol
          title="Für Tester:innen"
          links={[
            { href: "/produkte", label: "Aktuelle Produkttests" },
            { href: "/registrieren", label: "Kostenlos registrieren" },
            { href: "/konto", label: "Meine Tests" },
          ]}
        />
        <FooterCol
          title="Hilfe"
          links={[
            { href: "/#so-funktionierts", label: "So funktioniert’s" },
            { href: "/#faq", label: "Häufige Fragen" },
            { href: "/abmelden", label: "Abmelden" },
          ]}
        />
        <FooterCol
          title="Rechtliches"
          links={[
            { href: "/impressum", label: "Impressum" },
            { href: "/datenschutz", label: "Datenschutz" },
            { href: "/teilnahmebedingungen", label: "Teilnahmebedingungen" },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} TesterHero. Alle Rechte vorbehalten.</p>
          <p>Mit ♥ für ehrliche Meinungen gemacht.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
