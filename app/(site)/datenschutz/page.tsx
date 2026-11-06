import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <section>
        <h2>1. Wer verantwortlich ist</h2>
        <p>[Name der Agentur, Anschrift, E-Mail] – siehe Impressum.</p>
      </section>
      <section>
        <h2>2. Welche Daten wir speichern</h2>
        <p>Wenn du dich bei TesterHero anmeldest, speichern wir:</p>
        <ul>
          <li>Name, E-Mail-Adresse und Lieferadresse</li>
          <li>Telefonnummer und Geburtsjahr, wenn du sie angibst</li>
          <li>deine Pakete, den Versandstatus und deine Bewertungen</li>
          <li>ein Cookie, damit du eingeloggt bleibst</li>
        </ul>
      </section>
      <section>
        <h2>3. Wofür wir die Daten nutzen</h2>
        <ul>
          <li>Um Pakete auszulosen und an deine Adresse zu schicken (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li>Um dir E-Mails zu deinen Paketen zu schicken (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li>Um deine Bewertung an den Hersteller weiterzugeben (Art. 6 Abs. 1 lit. b DSGVO)</li>
        </ul>
      </section>
      <section>
        <h2>4. Wer die Daten bekommt</h2>
        <p>
          Hosting: Vercel Inc. · Datenbank: [Anbieter, z. B. Neon Inc.] · E-Mail-Versand: [Anbieter, z. B. Resend] · Versanddienstleister (DHL, Hermes etc.) zur Zustellung.
          Mit allen Dienstleistern bestehen Auftragsverarbeitungsverträge. [Bitte ergänzen: Drittlandtransfer / Standardvertragsklauseln]
        </p>
      </section>
      <section>
        <h2>5. Wie lange wir die Daten speichern</h2>
        <p>So lange du angemeldet bist. Wenn du dein Konto löschst, löschen wir alle deine Daten sofort.</p>
      </section>
      <section>
        <h2>6. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht,
          eine erteilte Einwilligung jederzeit zu widerrufen. Dein Profil kannst du jederzeit selbst bearbeiten oder löschen. Außerdem kannst du dich bei einer
          Datenschutz-Aufsichtsbehörde beschweren.
        </p>
      </section>
      <section>
        <h2>7. Cookies</h2>
        <p>Wir nutzen nur ein Cookie für den Login. Wir verfolgen nicht, was du auf der Seite machst.</p>
      </section>
    </LegalPage>
  );
}
