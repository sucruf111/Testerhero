import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          [Name der Agentur]
          <br />
          [Straße Hausnummer]
          <br />
          [PLZ Ort]
        </p>
        <p>
          Vertreten durch: [Geschäftsführer:in]
          <br />
          Handelsregister: [Registergericht, HRB-Nummer]
          <br />
          USt-IdNr.: [DE…]
        </p>
      </section>
      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: [Telefonnummer]
          <br />
          E-Mail: [kontakt@…]
        </p>
      </section>
      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <p>[Name, Anschrift]</p>
      </section>
      <section>
        <h2>Verbraucherstreitbeilegung</h2>
        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </section>
    </LegalPage>
  );
}
