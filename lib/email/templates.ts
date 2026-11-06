import "server-only";
import { getBaseUrl } from "@/lib/config";
import { formatLongDate } from "@/lib/format";
import type { EmailContent } from "./index";

type Named = { firstName: string };
type ProductLike = {
  title: string;
  slug: string;
  shortDescription: string;
  applicationDeadline: string | null;
};

export function verifyEmailTemplate(tester: Named, link: string): EmailContent {
  return {
    subject: "Bitte bestätige deine E-Mail-Adresse",
    preheader: "Nur noch ein Klick, dann bist du startklar.",
    heading: `Willkommen bei TesterHero, ${tester.firstName}!`,
    paragraphs: [
      "Schön, dass du dabei bist. Bitte bestätige kurz deine E-Mail-Adresse – danach kannst du dich direkt für spannende Produkttests bewerben.",
    ],
    cta: { label: "E-Mail-Adresse bestätigen", url: link },
    footnote: "Der Link ist 7 Tage gültig. Du hast dich nicht registriert? Dann ignoriere diese E-Mail einfach.",
  };
}

export function passwordResetTemplate(tester: Named, link: string): EmailContent {
  return {
    subject: "Neues Passwort für TesterHero",
    preheader: "Hier kannst du dein Passwort zurücksetzen.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: ["du hast ein neues Passwort angefordert. Klicke auf den Button, um ein neues Passwort festzulegen."],
    cta: { label: "Neues Passwort festlegen", url: link },
    footnote: "Der Link ist 1 Stunde gültig. Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.",
  };
}

export function acceptedTemplate(tester: Named, product: ProductLike): EmailContent {
  return {
    subject: `Du bist dabei: ${product.title} 🎉`,
    preheader: "Deine Bewerbung war erfolgreich – das Produkt ist bald unterwegs.",
    heading: `Glückwunsch, ${tester.firstName}!`,
    paragraphs: [
      `Du wurdest als Tester:in für „${product.title}“ ausgewählt. Wir bereiten den Versand vor und schicken dir die Sendungsnummer, sobald dein Paket unterwegs ist.`,
      "Bitte prüfe in deinem Profil, ob deine Lieferadresse noch stimmt.",
    ],
    cta: { label: "Meine Tests ansehen", url: `${getBaseUrl()}/konto` },
  };
}

export function rejectedTemplate(tester: Named, product: ProductLike): EmailContent {
  return {
    subject: `Deine Bewerbung für ${product.title}`,
    preheader: "Diesmal hat es leider nicht geklappt.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: [
      `vielen Dank für deine Bewerbung für „${product.title}“. Diesmal hat es leider nicht geklappt – wir hatten sehr viele Bewerbungen für nur wenige Plätze.`,
      "Bleib dran: Es kommen regelmäßig neue Produkte dazu, und wir freuen uns auf deine nächste Bewerbung!",
    ],
    cta: { label: "Aktuelle Produkttests", url: `${getBaseUrl()}/produkte` },
  };
}

export function shippedTemplate(
  tester: Named,
  product: ProductLike,
  shipping: { carrier?: string | null; trackingNumber?: string | null },
): EmailContent {
  const highlight = [
    ...(shipping.carrier ? [{ label: "Versanddienstleister", value: shipping.carrier }] : []),
    ...(shipping.trackingNumber ? [{ label: "Sendungsnummer", value: shipping.trackingNumber }] : []),
  ];
  return {
    subject: `Dein Testprodukt ist unterwegs: ${product.title}`,
    preheader: "Dein Paket wurde verschickt.",
    heading: "Dein Paket ist unterwegs! 📦",
    paragraphs: [
      `Hallo ${tester.firstName}, „${product.title}“ wurde soeben an dich verschickt.`,
      "Sobald es angekommen ist, bestätige bitte den Empfang in deinem Konto. Nach dem Testen freuen wir uns auf deine ehrliche Bewertung.",
    ],
    highlight,
    cta: { label: "Zu meinen Tests", url: `${getBaseUrl()}/konto` },
  };
}

export function newProductTemplate(tester: Named, product: ProductLike): EmailContent {
  const deadline = product.applicationDeadline
    ? `Bewerbungen sind bis zum ${formatLongDate(product.applicationDeadline)} möglich.`
    : "Die Plätze sind begrenzt – schnell sein lohnt sich.";
  return {
    subject: `Neuer Produkttest: ${product.title}`,
    preheader: product.shortDescription,
    heading: `Neu zum Testen: ${product.title}`,
    paragraphs: [`Hallo ${tester.firstName},`, product.shortDescription, deadline],
    cta: { label: "Jetzt ansehen & bewerben", url: `${getBaseUrl()}/produkte/${product.slug}` },
  };
}
