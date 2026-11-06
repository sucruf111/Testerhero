import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getCurrentTester } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { getOpenProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Aktuelle Produkttests",
  description: "Entdecke aktuelle Produkttests und bewirb dich kostenlos als Tester:in.",
};

export default async function ProductsPage({ searchParams }: PageProps<"/produkte">) {
  const [{ kategorie }, products, tester] = await Promise.all([searchParams, getOpenProducts(), getCurrentTester()]);
  const categories = [...new Set(products.map((p) => p.category))].sort();
  const active = typeof kategorie === "string" && categories.includes(kategorie) ? kategorie : null;
  const visible = active ? products.filter((p) => p.category === active) : products;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold tracking-widest text-coral-600 uppercase">Jetzt bewerben</p>
        <h1 className="mt-3 font-display text-5xl leading-tight font-semibold tracking-tight">Aktuelle Produkttests</h1>
        <p className="mt-4 text-lg text-muted">
          Such dir aus, was dich interessiert, und bewirb dich mit einem Klick. Die Plätze sind begrenzt.
        </p>
      </div>

      {categories.length > 1 && (
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Nach Kategorie filtern">
          <FilterPill href="/produkte" active={!active}>
            Alle ({products.length})
          </FilterPill>
          {categories.map((c) => (
            <FilterPill key={c} href={`/produkte?kategorie=${encodeURIComponent(c)}`} active={active === c}>
              {c}
            </FilterPill>
          ))}
        </nav>
      )}

      <div className="mt-10">
        {visible.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<PackageOpen />}
            title="Gerade sind alle Tests vergeben"
            action={
              tester ? (
                <LinkButton href="/konto/profil" variant="secondary">
                  Benachrichtigungen prüfen
                </LinkButton>
              ) : (
                <LinkButton href="/registrieren">Kostenlos registrieren</LinkButton>
              )
            }
          >
            Neue Produkte kommen regelmäßig dazu. Mit aktivierten E-Mail-Benachrichtigungen erfährst du als Erste:r davon.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
        active ? "bg-ink text-white ring-ink" : "bg-white text-ink-soft ring-line hover:ring-ink/30",
      )}
    >
      {children}
    </Link>
  );
}
