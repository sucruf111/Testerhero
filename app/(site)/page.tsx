import { Check } from "lucide-react";
import { RoundPanel } from "@/components/fomo/round-panel";
import { StickyCta } from "@/components/fomo/sticky-cta";
import { Story } from "@/components/story/story";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { getCurrentTester } from "@/lib/auth/session";
import { getSettings } from "@/lib/claims";
import { getPublicStats } from "@/lib/public-stats";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [tester, settings, stats, params] = await Promise.all([
    getCurrentTester(),
    getSettings(),
    getPublicStats(),
    searchParams,
  ]);

  const rules = [
    "Die Pakete werden unter allen angemeldeten Testern mit bestätigter E-Mail-Adresse ausgelost.",
    `Du bekommst höchstens ${settings.maxClaimsPerWindow} Pakete in ${settings.claimWindowDays} Tagen.`,
    settings.maxOpenTests === 1
      ? "Erst wenn du dein Paket bewertet hast, kannst du wieder ausgelost werden."
      : `Du kannst höchstens ${settings.maxOpenTests} Pakete gleichzeitig offen haben. Danach erst bewerten.`,
    "Du bekommst nie zweimal dasselbe Produkt. Das gilt auch für alle, die mit dir zusammenwohnen.",
    "Was im Paket ist, darfst du behalten. Du musst nichts zurückschicken.",
  ];

  const faqs = [
    {
      q: "Ist das wirklich kostenlos?",
      a: "Ja, zu 100 %. Du zahlst nichts für das Produkt und nichts für den Versand. Es gibt kein Abo, und wir fragen nie nach Bank- oder Kartendaten.",
    },
    {
      q: "Warum verschenkt ihr Produkte?",
      a: "Wir arbeiten für Hersteller und Händler, die wissen wollen, wie ihre Produkte im Alltag ankommen. Sie stellen die Produkte zur Verfügung und bekommen dafür ehrliche Rückmeldungen von echten Nutzern.",
    },
    {
      q: "Wie läuft das ab?",
      a: "Kostenlos anmelden, E-Mail-Adresse bestätigen und Lieferadresse hinterlegen. Wirst du ausgelost, kommt ein Paket zu dir. Du probierst das Produkt aus und schreibst uns eine kurze Bewertung.",
    },
    { q: "Darf ich die Produkte behalten?", a: "Ja. Was in deinem Paket ist, gehört dir. Du musst nichts zurückschicken." },
    {
      q: "Was ist in den Paketen?",
      a: "Neue Produkte aus Haushalt, Garten, Gesundheit, Pflege, Sport und mehr. Der Wert liegt meist zwischen 5 und 50 Euro. Was du bekommst, entscheidet das Los.",
    },
    {
      q: "Wie groß sind meine Chancen?",
      a: `Das hängt davon ab, wie viele Produkte es gerade gibt und wie viele mitmachen. Pro Produkt gibt es nur eine begrenzte Zahl an Plätzen. Mehr als ${settings.maxClaimsPerWindow} Pakete in ${settings.claimWindowDays} Tagen bekommt niemand, damit alle eine Chance haben.`,
    },
    {
      q: "Muss ich eine gute Bewertung schreiben?",
      a: "Nein. Wir wollen deine ehrliche Meinung. Kritik hilft den Herstellern oft mehr als Lob, und sie hat keinen Einfluss darauf, ob du wieder ausgelost wirst.",
    },
    {
      q: "Muss ich bei Amazon eine Bewertung schreiben?",
      a: "Nein. Du schreibst deine Bewertung nur hier bei uns. Sie geht an den Hersteller und wird nicht veröffentlicht.",
    },
    { q: "Bis wann muss ich bewerten?", a: "Am besten innerhalb von zwei Wochen, nachdem das Paket bei dir angekommen ist." },
    {
      q: "Was macht ihr mit meiner Adresse?",
      a: "Wir nutzen sie nur, um dir Pakete zu schicken. Wir verkaufen sie nicht und geben sie nicht für Werbung weiter.",
    },
    {
      q: "Wie melde ich mich wieder ab?",
      a: "In jeder E-Mail von uns ist ein Link zum Abmelden. Du kannst dich auch in deinem Konto abmelden oder das Konto ganz löschen.",
    },
  ];

  // Nur ehrliche Aussagen: Die Fragen gibt es auch als strukturierte Daten für Suchmaschinen
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      {params.konto === "geloescht" && (
        <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
          <Alert tone="success">Dein Konto und alle deine Daten sind gelöscht.</Alert>
        </div>
      )}

      <Story loggedIn={Boolean(tester)} freeSlots={stats.freeSlots} />

      <RoundPanel
        stats={stats}
        maxClaims={settings.maxClaimsPerWindow}
        windowDays={settings.claimWindowDays}
        loggedIn={Boolean(tester)}
      />

      {/* Regeln + Fragen */}
      <section id="fragen" className="mx-auto mt-14 grid max-w-6xl scroll-mt-20 gap-8 px-4 sm:px-6 lg:grid-cols-[22rem_1fr]">
        <div id="regeln" className="self-start rounded-2xl bg-ink p-6 text-white">
          <h2 className="font-display text-xl font-bold">Die Regeln</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            {rules.map((r) => (
              <li key={r} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-coral-400" />
                {r}
              </li>
            ))}
          </ul>
          {!tester && (
            <LinkButton href="/registrieren" className="mt-6 w-full">
              100 % kostenlos mitmachen
            </LinkButton>
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Fragen und Antworten</h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {!tester && <StickyCta freeSlots={stats.freeSlots} />}
    </>
  );
}
