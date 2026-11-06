"use client";

import { useEffect, useState } from "react";

/**
 * Countdown bis zur täglichen Auslosung freier Plätze.
 * Der Verteil-Job läuft täglich um 6:17 UTC (vercel.json). Auf dem Hobby-Tarif startet Vercel ihn
 * irgendwann in dieser Stunde, deshalb zeigen wir ehrlich ein Zeitfenster statt einer Minute.
 */
const DRAW_HOUR_UTC = 6;

function nextWindow(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DRAW_HOUR_UTC));
  if (now >= start) start.setUTCDate(start.getUTCDate() + 1);
  return start;
}

const berlinHour = (d: Date) =>
  Number(
    new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Berlin" })
      .formatToParts(d)
      .find((part) => part.type === "hour")?.value ?? 7,
  );
const berlinDay = (d: Date) => new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeZone: "Europe/Berlin" }).format(d);

function describe(now: Date) {
  const start = nextWindow(now);
  const from = berlinHour(start);
  const day = berlinDay(start) === berlinDay(now) ? "heute" : "morgen";
  const mins = Math.max(1, Math.round((start.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return {
    when: `${day} zwischen ${from} und ${from + 1} Uhr`,
    countdown: h > 0 ? `in ${h} Std. ${m} Min.` : `in ${m} Min.`,
  };
}

export function NextDraw({ variant = "full" }: { variant?: "full" | "short" }) {
  const [info, setInfo] = useState<ReturnType<typeof describe> | null>(null);

  useEffect(() => {
    const tick = () => setInfo(describe(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Uhrzeit hängt vom Gerät ab: erst im Browser anzeigen, damit nichts springt
  if (!info) return <span className="inline-block h-[1em] w-28 animate-pulse rounded bg-ink/10 align-middle" />;
  if (variant === "short") return <span>{info.countdown}</span>;
  return (
    <span>
      {info.when} <span className="font-semibold text-ink">({info.countdown})</span>
    </span>
  );
}
