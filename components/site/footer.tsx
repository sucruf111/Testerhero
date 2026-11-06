import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/#so-gehts", label: "So geht’s" },
  { href: "/#fragen", label: "Fragen" },
  { href: "/abmelden", label: "Abmelden" },
  { href: "/teilnahmebedingungen", label: "Teilnahmebedingungen" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/impressum", label: "Impressum" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-xs text-muted">© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Footer">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-6 text-[11px] text-muted/80 sm:px-6">
        Beispielprodukte als 3D-Modelle von Poly Haven und Khronos (CC0) sowie Sneaker von Shopify (
        <a href="https://creativecommons.org/licenses/by/4.0/deed.de" className="underline hover:text-ink" rel="noopener" target="_blank">
          CC BY 4.0
        </a>
        ).
      </p>
    </footer>
  );
}
