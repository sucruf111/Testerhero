import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellOff,
  ClipboardPen,
  Gift,
  Lock,
  MessageSquareHeart,
  PackageOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundPlus,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { EmptyState, Stars } from "@/components/ui/misc";
import { ProductCard } from "@/components/site/product-card";
import { getCurrentTester } from "@/lib/auth/session";
import { getOpenProducts } from "@/lib/queries";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [products, tester, params] = await Promise.all([getOpenProducts(3), getCurrentTester(), searchParams]);

  return (
    <>
      {params.konto === "geloescht" && (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Alert tone="success" title="Dein Konto wurde gelöscht.">
            Alle deine Daten wurden entfernt. Danke, dass du dabei warst!
          </Alert>
        </div>
      )}

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 -right-40 size-[38rem] rounded-full bg-coral-200/50 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-40 size-[28rem] rounded-full bg-sun-300/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink-soft shadow-soft ring-1 ring-line">
              <Sparkles className="size-4 text-coral-500" />
              Kostenlos · Unverbindlich · Ehrlich
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.04] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Teste Neues, <span className="text-gradient italic">bevor es alle anderen tun.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Als TesterHero bekommst du ausgewählte Produkte kostenlos nach Hause, testest sie in Ruhe und teilst
              deine ehrliche Meinung direkt mit den Herstellern – ganz ohne öffentliche Rezension.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {tester ? (
                <LinkButton href="/produkte" size="lg">
                  Zu den Produkttests <ArrowRight />
                </LinkButton>
              ) : (
                <LinkButton href="/registrieren" size="lg">
                  Kostenlos Tester:in werden <ArrowRight />
                </LinkButton>
              )}
              <LinkButton href={tester ? "/konto" : "/produkte"} size="lg" variant="secondary">
                {tester ? "Meine Tests" : "Aktuelle Produkte ansehen"}
              </LinkButton>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-soft">
              {["100 % kostenlos", "Jederzeit abmelden", "Daten nur für den Versand"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-4.5 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroCollage />
        </div>
      </section>

      {/* ───────── So funktioniert's ───────── */}
      <section id="so-funktionierts" className="scroll-mt-24 border-y border-line/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <SectionIntro
            eyebrow="So funktioniert’s"
            title="In vier Schritten zum Produkttest"
            text="Kein Haken, keine Kosten. Du brauchst nur Neugier und Lust, ehrlich zu sagen, was du denkst."
          />
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: UserRoundPlus, title: "Registrieren", text: "Lege in zwei Minuten dein kostenloses Profil mit Lieferadresse und Interessen an." },
              { icon: Search, title: "Bewerben", text: "Stöbere durch aktuelle Produkttests und bewirb dich mit einem Klick." },
              { icon: Truck, title: "Testen", text: "Wirst du ausgewählt, schicken wir dir das Produkt kostenlos nach Hause." },
              { icon: ClipboardPen, title: "Bewerten", text: "Teile deine ehrliche Erfahrung über ein kurzes Formular – fertig!" },
            ].map((step, i) => (
              <li key={step.title} className="relative rounded-3xl bg-cream p-6 ring-1 ring-line/70">
                <span className="absolute top-5 right-6 font-display text-5xl font-semibold text-coral-200">{i + 1}</span>
                <span className="grid size-12 place-items-center rounded-2xl bg-white text-coral-500 shadow-soft ring-1 ring-line">
                  <step.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Aktuelle Produkte ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionIntro eyebrow="Jetzt bewerben" title="Aktuelle Produkttests" align="left" />
          {products.length > 0 && (
            <Link href="/produkte" className="inline-flex items-center gap-1.5 font-semibold text-coral-600 hover:text-coral-700">
              Alle Produkttests <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        <div className="mt-10">
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<PackageOpen />}
              title="Neue Produkttests sind in Vorbereitung"
              action={!tester && <LinkButton href="/registrieren">Jetzt registrieren</LinkButton>}
            >
              Registriere dich schon jetzt – wir informieren dich per E-Mail, sobald es losgeht.
            </EmptyState>
          )}
        </div>
      </section>

      {/* ───────── Vorteile ───────── */}
      <section className="px-4 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-white sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-coral-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-lilac-500/20 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold tracking-widest text-coral-300 uppercase">Warum TesterHero?</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Deine Meinung landet genau da, wo sie etwas bewegt.
            </h2>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Gift, title: "Kostenlos & unverbindlich", text: "Die Teilnahme kostet dich nichts. Du entscheidest selbst, für welche Produkte du dich bewirbst." },
                { icon: MessageSquareHeart, title: "Ehrlich statt geschönt", text: "Deine Bewertung geht direkt an das Produktteam – keine öffentlichen Rezensionen, kein Druck." },
                { icon: Lock, title: "Deine Daten sind sicher", text: "Deine Adresse nutzen wir ausschließlich für den Versand deiner Testprodukte." },
                { icon: BellOff, title: "Jederzeit abmelden", text: "Kein Interesse mehr? Ein Klick in jeder E-Mail genügt und du erhältst nichts mehr von uns." },
                { icon: Truck, title: "Bequem nach Hause", text: "Wir kümmern uns um den Versand. Die Sendungsnummer bekommst du per E-Mail." },
                { icon: ShieldCheck, title: "Transparent", text: "In deinem Konto siehst du jederzeit den Status all deiner Bewerbungen und Tests." },
              ].map((b) => (
                <div key={b.title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-coral-300 ring-1 ring-white/10">
                    <b.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{b.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-white/65">{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6 lg:py-24">
        <SectionIntro eyebrow="FAQ" title="Häufige Fragen" />
        <div className="mt-12 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white px-6 py-5 shadow-soft ring-1 ring-line/70 open:ring-coral-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sand text-lg leading-none text-ink-soft transition group-open:rotate-45 group-open:bg-coral-500 group-open:text-white">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      {!tester && (
        <section className="px-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-coral-500 via-coral-400 to-sun-400 px-6 py-14 text-center sm:px-12">
            <div className="bg-grain pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight font-semibold text-white sm:text-5xl">
                Bereit für deinen ersten Produkttest?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-white/90">
                Registriere dich kostenlos und verpasse keine neuen Produkte mehr.
              </p>
              <LinkButton href="/registrieren" size="lg" variant="dark" className="mt-8">
                Jetzt kostenlos registrieren <ArrowRight />
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

const faqs = [
  { q: "Was kostet die Teilnahme?", a: "Nichts. Die Registrierung, die Testprodukte und der Versand sind für dich komplett kostenlos." },
  {
    q: "Muss ich eine Rezension auf Amazon schreiben?",
    a: "Nein. Deine Bewertung gibst du ausschließlich hier auf TesterHero ab. Sie wird intern an das Produktteam weitergegeben und nicht öffentlich veröffentlicht.",
  },
  {
    q: "Wie werden die Tester:innen ausgewählt?",
    a: "Wir achten auf eine gute Mischung und darauf, dass das Produkt zu deinen Interessen passt. Ein paar Sätze zu deiner Motivation erhöhen deine Chancen. Über die Auswahl informieren wir dich per E-Mail.",
  },
  {
    q: "Wofür braucht ihr meine Adresse?",
    a: "Ausschließlich für den Versand deiner Testprodukte. Wir geben deine Daten nicht für Werbezwecke weiter.",
  },
  {
    q: "Wie lange habe ich Zeit für meine Bewertung?",
    a: "Teste das Produkt in Ruhe im Alltag. Wir freuen uns, wenn deine Bewertung innerhalb von etwa zwei Wochen nach Erhalt eingeht.",
  },
  {
    q: "Wie kann ich mich abmelden?",
    a: "Jederzeit mit einem Klick über den Link in jeder E-Mail oder in deinem Konto unter „Profil“. Dort kannst du auch dein Konto inklusive aller Daten löschen.",
  },
];

function SectionIntro({
  eyebrow,
  title,
  text,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  text?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-semibold tracking-widest text-coral-600 uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-muted">{text}</p>}
    </div>
  );
}

function HeroCollage() {
  return (
    <div className="relative mx-auto h-[34rem] w-full max-w-md sm:h-[30rem] lg:max-w-none" aria-hidden>
      {/* Produkt-Karte */}
      <div className="absolute top-2 left-0 w-64 rotate-[-4deg] rounded-[2rem] bg-white p-4 shadow-lift ring-1 ring-line/70 sm:w-80 lg:left-8">
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-coral-100 via-coral-50 to-sun-100">
          <div className="bg-grain absolute inset-0" />
          <div className="relative grid size-24 place-items-center rounded-[1.75rem] bg-white shadow-soft">
            <PackageOpen className="size-11 text-coral-500" strokeWidth={1.5} />
          </div>
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink">Haushalt & Küche</span>
        </div>
        <div className="px-1 pt-4 pb-1">
          <p className="text-[11px] font-semibold tracking-wider text-coral-600 uppercase">Neu im Test</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-ink">Milchaufschäumer Pro</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-coral-500 to-sun-400" />
          </div>
          <p className="mt-2 text-xs font-medium text-muted">7 von 20 Plätzen frei</p>
        </div>
      </div>

      {/* Bewertungskarte */}
      <div className="absolute right-0 bottom-2 w-56 rotate-[3deg] animate-float rounded-3xl bg-white p-5 shadow-lift ring-1 ring-line/70 sm:w-64">
        <Stars value={5} />
        <p className="mt-2 font-display text-[17px] leading-snug font-semibold text-ink">„Hält, was es verspricht!“</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">Schäumt in Sekunden und ist super leicht zu reinigen.</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-lilac-100 text-[11px] font-bold text-lilac-700">LM</span>
          <span className="text-xs font-semibold text-ink-soft">Lena M., Tester:in</span>
        </div>
      </div>

      {/* Status-Pille */}
      <div className="absolute bottom-8 -left-6 hidden items-center gap-3 rounded-2xl bg-ink py-3 pr-5 pl-3 text-white shadow-lift lg:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-coral-500">
          <Truck className="size-5" />
        </span>
        <span>
          <span className="block text-[11px] text-white/60">Status-Update</span>
          <span className="block text-sm font-semibold">Dein Paket ist unterwegs!</span>
        </span>
      </div>
    </div>
  );
}
