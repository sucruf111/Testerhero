import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/lib/claims";

export const metadata: Metadata = { title: "Teilnahmebedingungen" };

export default async function TeilnahmebedingungenPage() {
  const settings = await getSettings();
  return (
    <LegalPage title="Teilnahmebedingungen">
      <section>
        <h2>1. Wer mitmachen kann</h2>
        <p>
          Mitmachen kann jede Person ab 18 Jahren mit einer Lieferadresse in Deutschland, Österreich oder der Schweiz. Die Teilnahme ist
          kostenlos. Pro Person ist nur ein Konto erlaubt.
        </p>
      </section>
      <section>
        <h2>2. Wie die Pakete verteilt werden</h2>
        <p>
          Wenn es ein neues Produkt gibt, losen wir per Zufall aus, wer es bekommt. Mitlosen kann, wer angemeldet ist und seine E-Mail-Adresse
          bestätigt hat. Einen Anspruch auf ein Paket gibt es nicht.
        </p>
        <ul>
          <li>
            Pro Person gibt es höchstens {settings.maxClaimsPerWindow} Pakete in {settings.claimWindowDays} Tagen.
          </li>
          <li>Wer {settings.maxOpenTests === 1 ? "ein Paket" : `${settings.maxOpenTests} Pakete`} noch nicht bewertet hat, wird erst danach wieder ausgelost.</li>
          <li>Niemand bekommt dasselbe Produkt zweimal. Das gilt auch für Personen mit derselben Adresse.</li>
        </ul>
      </section>
      <section>
        <h2>3. Das Produkt</h2>
        <p>Das Produkt im Paket darfst du nach dem Test behalten. Der Versand ist für dich kostenlos.</p>
      </section>
      <section>
        <h2>4. Deine Bewertung</h2>
        <p>
          Wenn du ein Paket bekommst, testest du das Produkt und schreibst innerhalb von etwa zwei Wochen nach Erhalt eine ehrliche Bewertung
          hier auf der Seite. Die Bewertung wird nicht veröffentlicht. Sie geht nur an den Hersteller.
        </p>
      </section>
      <section>
        <h2>5. Abmelden</h2>
        <p>Du kannst dich jederzeit über den Link in unseren E-Mails oder in deinem Konto abmelden und dein Konto löschen.</p>
      </section>
      <section>
        <h2>6. Sperrung</h2>
        <p>Wer falsche Angaben macht, mehrere Konten anlegt oder wiederholt nicht bewertet, kann gesperrt werden.</p>
      </section>
    </LegalPage>
  );
}
