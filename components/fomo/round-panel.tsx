import { ArrowRight, CalendarClock, PackageCheck, Users } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import type { PublicStats } from "@/lib/public-stats";
import { NextDraw } from "./next-draw";

type Props = {
  stats: PublicStats;
  maxClaims: number;
  windowDays: number;
  loggedIn: boolean;
};

/** Live-Stand der aktuellen Runde – nur mit echten Zahlen, kleine Zahlen werden nicht gezeigt */
export function RoundPanel({ stats, maxClaims, windowDays, loggedIn }: Props) {
  const { activeProducts, totalSlots, freeSlots, newTesters7d, shipped30d } = stats;

  let title: string;
  let text: string;
  if (freeSlots > 0) {
    title = `Gerade sind noch ${freeSlots} von ${totalSlots} Paketen frei.`;
    text =
      "Freie Pakete verlosen wir unter allen bestätigten Testern. Wer sich jetzt anmeldet und die E-Mail-Adresse bestätigt, ist sofort mit im Topf.";
  } else if (activeProducts > 0) {
    title = `Alle ${totalSlots} Pakete dieser Runde sind vergeben.`;
    text = "Neue Produkte verlosen wir, sobald sie da sind. Dabei ist nur, wer dann schon angemeldet ist.";
  } else {
    title = "Sei bei der nächsten Runde dabei.";
    text = "Neue Produkte verlosen wir, sobald sie da sind. Dabei ist nur, wer dann schon angemeldet ist.";
  }

  const facts: { icon: typeof Users; text: React.ReactNode }[] = [];
  if (freeSlots > 0) facts.push({ icon: CalendarClock, text: <>Nächste Auslosung: <NextDraw /></> });
  if (newTesters7d >= 10) facts.push({ icon: Users, text: `${newTesters7d} neue Tester in den letzten 7 Tagen` });
  if (shipped30d >= 5) facts.push({ icon: PackageCheck, text: `${shipped30d} Pakete in den letzten 30 Tagen verschickt` });
  facts.push({ icon: PackageCheck, text: `Höchstens ${maxClaims} Pakete pro Person in ${windowDays} Tagen, damit alle eine Chance haben` });

  return (
    <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6" aria-labelledby="runde-titel">
      <div className="grid gap-5 rounded-2xl border border-line bg-white p-5 shadow-lift sm:p-7 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-coral-600 uppercase">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-coral-400 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-coral-500" />
            </span>
            Aktuelle Runde
          </p>
          <h2 id="runde-titel" className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{text}</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
            {facts.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <f.icon className="mt-0.5 size-4 shrink-0 text-coral-500" aria-hidden />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link href={loggedIn ? "/konto" : "/registrieren"} className={buttonClass("primary", "lg", "shadow-glow")}>
          {loggedIn ? "Zu meinen Paketen" : "100 % kostenlos mitmachen"} <ArrowRight />
        </Link>
      </div>
    </section>
  );
}
