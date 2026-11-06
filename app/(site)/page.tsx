import { ArrowRight, Check, Gift, PackageCheck, PenLine, Truck } from "lucide-react";
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

      {/* Einstieg */}
      <section className="border-b border-line bg-gradient-to-b from-coral-50/80 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="animate-fade-up">
            <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Überraschungspakete testen <span className="text-coral-500">und behalten.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Melde dich kostenlos an. Ab und zu schicken wir dir ein neues Produkt nach Hause. Was drin ist, siehst du erst
              beim Auspacken. Du testest es, sagst uns deine Meinung und darfst es behalten.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {tester ? (
                <LinkButton href="/konto" size="lg">
                  Zu meinen Paketen <ArrowRight />
                </LinkButton>
              ) : (
                <>
                  <LinkButton href="/registrieren" size="lg">
                    Kostenlos mitmachen <ArrowRight />
                  </LinkButton>
                  <LinkButton href="#so-gehts" size="lg" variant="secondary">
                    So geht’s
                  </LinkButton>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-muted">Die Anmeldung dauert zwei Minuten. Abmelden geht jederzeit.</p>
          </div>

          <PackagePreview />
        </div>
      </section>

      {/* So geht's */}
      <section id="so-gehts" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">So geht’s</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Anmelden", text: "Konto anlegen und Lieferadresse eintragen. Mehr musst du nicht tun." },
            { title: "Ausgelost werden", text: "Gibt es ein neues Produkt, losen wir aus, wer es bekommt. Du bekommst dann eine E-Mail." },
            { title: "Auspacken", text: "Das Paket kommt zu dir nach Hause. Erst beim Auspacken siehst du, was drin ist." },
            { title: "Bewerten", text: "Probier das Produkt aus und schreib uns kurz, wie es dir gefällt. Behalten darfst du es." },
          ].map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-line p-4">
              <span className="grid size-7 place-items-center rounded-lg bg-coral-500 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Regeln + Fragen */}
      <section id="fragen" className="mx-auto grid max-w-6xl scroll-mt-20 gap-8 px-4 sm:px-6 lg:grid-cols-[22rem_1fr]">
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

/** Vorschau, wie ein Paket im Konto aussieht */
function PackagePreview() {
  const rows = [
    { icon: Gift, title: "Du wurdest ausgelost", text: "Wir packen dein Paket.", done: true },
    { icon: Truck, title: "Paket unterwegs", text: "Sendungsnummer per E-Mail", done: true },
    { icon: PackageCheck, title: "Auspacken", text: "Jetzt siehst du, was drin ist.", done: false },
    { icon: PenLine, title: "Bewerten", text: "Ein paar Sätze reichen.", done: false },
  ];
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-lift lg:mr-0">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-coral-500 text-white">
          <Gift className="size-6" />
        </span>
        <div>
          <p className="font-semibold">Überraschungspaket</p>
          <p className="text-sm text-muted">Was drin ist? Siehst du beim Auspacken.</p>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.title} className="flex items-center gap-3">
            <span
              className={
                r.done
                  ? "grid size-8 shrink-0 place-items-center rounded-lg bg-coral-50 text-coral-600"
                  : "grid size-8 shrink-0 place-items-center rounded-lg bg-sand text-muted"
              }
            >
              <r.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={r.done ? "text-sm font-semibold" : "text-sm font-semibold text-muted"}>{r.title}</p>
              <p className="text-xs text-muted">{r.text}</p>
            </div>
            {r.done && <Check className="size-4 text-emerald-600" />}
          </li>
        ))}
      </ol>
    </div>
  );
}
