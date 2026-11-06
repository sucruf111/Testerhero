import "server-only";
import { getBaseUrl } from "@/lib/config";
import type { EmailContent } from "./index";

type Named = { firstName: string };

export function verifyEmailTemplate(tester: Named, link: string): EmailContent {
  return {
    subject: "Bitte bestätige deine E-Mail-Adresse",
    preheader: "Ein Klick, dann bist du dabei.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: [
      "danke für deine Anmeldung bei TesterHero. Bitte klick auf den Button, damit wir wissen, dass die E-Mail-Adresse wirklich dir gehört.",
      "Danach bist du dabei und kannst Überraschungspakete von uns bekommen.",
    ],
    cta: { label: "E-Mail-Adresse bestätigen", url: link },
    footnote: "Der Link gilt 7 Tage. Wenn du dich nicht angemeldet hast, kannst du diese E-Mail einfach löschen.",
  };
}

export function passwordResetTemplate(tester: Named, link: string): EmailContent {
  return {
    subject: "Dein neues Passwort für TesterHero",
    preheader: "Hier kannst du ein neues Passwort festlegen.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: ["du wolltest ein neues Passwort. Über den Button kannst du es jetzt festlegen."],
    cta: { label: "Neues Passwort festlegen", url: link },
    footnote: "Der Link gilt 1 Stunde. Wenn du kein neues Passwort wolltest, musst du nichts tun.",
  };
}

export function assignedTemplate(tester: Named): EmailContent {
  return {
    subject: "Ein Überraschungspaket für dich",
    preheader: "Du wurdest ausgelost. Was drin ist, siehst du beim Auspacken.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: [
      "gute Nachricht: Du wurdest für ein Testprodukt ausgelost. Was es ist, verraten wir noch nicht.",
      "Wir packen dein Paket in den nächsten Tagen und sagen dir Bescheid, sobald es unterwegs ist. Bitte prüf kurz in deinem Konto, ob deine Adresse stimmt.",
    ],
    cta: { label: "Adresse prüfen", url: `${getBaseUrl()}/konto/profil` },
  };
}

export function cancelledTemplate(tester: Named): EmailContent {
  return {
    subject: "Dein Überraschungspaket wurde storniert",
    preheader: "Leider können wir dir dieses Paket nicht schicken.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: [
      "leider können wir dir das reservierte Paket doch nicht schicken. Du bleibst aber dabei und bekommst bei der nächsten Auslosung wieder eine Chance.",
      "Wenn du Fragen hast, antworte einfach auf diese E-Mail.",
    ],
  };
}

export function shippedTemplate(tester: Named): EmailContent {
  return {
    subject: "Dein Überraschungspaket ist unterwegs",
    preheader: "Wir haben dein Paket verschickt.",
    heading: `Hallo ${tester.firstName},`,
    paragraphs: [
      "dein Überraschungspaket ist unterwegs zu dir und sollte in den nächsten Tagen ankommen.",
      "Wenn es da ist, sag uns bitte in deinem Konto Bescheid. Dann siehst du dort auch, was drin ist, und kannst nach dem Testen deine Bewertung schreiben.",
    ],
    cta: { label: "Zu meinen Paketen", url: `${getBaseUrl()}/konto` },
  };
}
