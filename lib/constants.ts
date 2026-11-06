import type { ApplicationStatus, ProductStatus, TesterStatus } from "@/lib/db/schema";

export const SITE_NAME = "TesterHero";

export const CATEGORIES = [
  "Haushalt & Küche",
  "Beauty & Pflege",
  "Elektronik & Technik",
  "Sport & Outdoor",
  "Baby & Kind",
  "Haustier",
  "Garten & Heimwerken",
  "Gesundheit & Wellness",
  "Mode & Accessoires",
  "Spielzeug & Freizeit",
  "Büro & Schreibwaren",
  "Auto & Fahrrad",
] as const;

export const COUNTRIES: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
};

export const CARRIERS = ["DHL", "Hermes", "DPD", "GLS", "UPS", "Deutsche Post", "Amazon"] as const;

export const APPLICATION_STATUS: Record<
  ApplicationStatus,
  { label: string; testerLabel: string; tone: Tone }
> = {
  pending: { label: "Neu", testerLabel: "Beworben", tone: "amber" },
  accepted: { label: "Ausgewählt", testerLabel: "Du bist dabei!", tone: "violet" },
  shipped: { label: "Versendet", testerLabel: "Unterwegs zu dir", tone: "sky" },
  received: { label: "Erhalten", testerLabel: "Bitte bewerten", tone: "coral" },
  reviewed: { label: "Bewertet", testerLabel: "Bewertet – danke!", tone: "green" },
  rejected: { label: "Abgelehnt", testerLabel: "Diesmal nicht dabei", tone: "slate" },
  withdrawn: { label: "Zurückgezogen", testerLabel: "Zurückgezogen", tone: "slate" },
};

/** Status, die einen vergebenen Testplatz bedeuten */
export const SLOT_STATUSES: ApplicationStatus[] = ["accepted", "shipped", "received", "reviewed"];

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: Tone }> = {
  draft: { label: "Entwurf", tone: "slate" },
  active: { label: "Bewerbung offen", tone: "green" },
  closed: { label: "Abgeschlossen", tone: "violet" },
};

export const TESTER_STATUS: Record<TesterStatus, { label: string; tone: Tone }> = {
  active: { label: "Aktiv", tone: "green" },
  unsubscribed: { label: "Abgemeldet", tone: "slate" },
  blocked: { label: "Gesperrt", tone: "red" },
};

export type Tone = "amber" | "violet" | "sky" | "coral" | "green" | "slate" | "red";
