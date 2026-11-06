import { Check } from "lucide-react";
import { Story } from "@/components/story/story";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { getCurrentTester } from "@/lib/auth/session";
import { getSettings } from "@/lib/claims";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [tester, settings, params] = await Promise.all([getCurrentTester(), getSettings(), searchParams]);

  const rules = [
    "Die Pakete werden unter allen angemeldeten Testern ausgelost.",
    `Du bekommst höchstens ${settings.maxClaimsPerWindow} Pakete in ${settings.claimWindowDays} Tagen.`,
    settings.maxOpenTests === 1
      ? "Erst wenn du dein Paket bewertet hast, kannst du wieder ausgelost werden."
      : `Du kannst höchstens ${settings.maxOpenTests} Pakete gleichzeitig offen haben. Danach erst bewerten.`,
    "Du bekommst nie zweimal dasselbe Produkt. Das gilt auch für alle, die mit dir zusammenwohnen.",
    "Was im Paket ist, darfst du behalten.",
  ];

  const faqs = [
    { q: "Kostet mich das etwas?", a: "Nein. Die Anmeldung, die Produkte und der Versand sind kostenlos." },
    { q: "Darf ich die Produkte behalten?", a: "Ja. Was in deinem Paket ist, gehört dir." },
    {
      q: "Was ist in den Paketen?",
      a: "Neue Produkte aus allen möglichen Bereichen, zum Beispiel Küche, Pflege, Technik oder Sport. Was du bekommst, entscheidet der Zufall.",
    },
    {
      q: "Wie oft bekomme ich ein Paket?",
      a: `Das hängt davon ab, wie viele Produkte es gerade gibt und wie viele mitmachen. Mehr als ${settings.maxClaimsPerWindow} Pakete in ${settings.claimWindowDays} Tagen bekommt niemand, damit alle eine Chance haben.`,
    },
    {
      q: "Muss ich bei Amazon eine Bewertung schreiben?",
      a: "Nein. Du schreibst deine Bewertung nur hier bei uns. Sie geht an den Hersteller und wird nicht veröffentlicht.",
    },
    { q: "Bis wann muss ich bewerten?", a: "Am besten innerhalb von zwei Wochen, nachdem das Paket bei dir angekommen ist." },
    { q: "Was macht ihr mit meiner Adresse?", a: "Wir brauchen sie nur für den Versand. Für Werbung geben wir sie nicht weiter." },
    {
      q: "Wie melde ich mich wieder ab?",
      a: "In jeder E-Mail von uns ist ein Link zum Abmelden. Du kannst dich auch in deinem Konto abmelden oder das Konto ganz löschen.",
    },
  ];

  return (
    <>
      {params.konto === "geloescht" && (
        <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
          <Alert tone="success">Dein Konto und alle deine Daten sind gelöscht.</Alert>
        </div>
      )}

      <Story loggedIn={Boolean(tester)} />

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
              Kostenlos mitmachen
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
    </>
  );
}
