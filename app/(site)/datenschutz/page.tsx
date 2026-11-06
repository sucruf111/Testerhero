import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <section>
        <h2>1. Verantwortliche Stelle</h2>
        <p>[Name der Agentur, Anschrift, E-Mail] – siehe Impressum.</p>
      </section>
      <section>
        <h2>2. Welche Daten wir verarbeiten</h2>
        <p>Wenn du dich bei TesterHero registrierst, verarbeiten wir:</p>
        <ul>
          <li>Name, E-Mail-Adresse und Lieferadresse (Pflichtangaben)</li>
          <li>Telefonnummer und Geburtsjahr (freiwillig)</li>
          <li>deine Interessen, Bewerbungen, Versandstatus und Bewertungen</li>
          <li>technisch notwendige Daten (z. B. Login-Cookie)</li>
        </ul>
      </section>
      <section>
        <h2>3. Zwecke und Rechtsgrundlagen</h2>
        <ul>
          <li>Durchführung der Produkttests inkl. Versand an deine Adresse (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li>E-Mails zu neuen Produkttests nur mit deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) – jederzeit widerrufbar</li>
          <li>Auswertung der Bewertungen für die jeweiligen Hersteller in zusammengefasster Form (Art. 6 Abs. 1 lit. b DSGVO)</li>
        </ul>
      </section>
      <section>
        <h2>4. Empfänger</h2>
        <p>
          Hosting: Vercel Inc. · Datenbank: [Anbieter, z. B. Neon Inc.] · E-Mail-Versand: [Anbieter, z. B. Resend] · Versanddienstleister (DHL, Hermes etc.) zur Zustellung.
          Mit allen Dienstleistern bestehen Auftragsverarbeitungsverträge. [Bitte ergänzen: Drittlandtransfer / Standardvertragsklauseln]
        </p>
      </section>
      <section>
        <h2>5. Speicherdauer</h2>
        <p>Wir speichern deine Daten, solange du registriert bist. Wenn du dein Konto löschst, werden alle personenbezogenen Daten unverzüglich entfernt.</p>
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
        <p>Wir verwenden ausschließlich technisch notwendige Cookies für den Login. Es findet kein Tracking statt.</p>
      </section>
    </LegalPage>
  );
}
