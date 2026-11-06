import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Teilnahmebedingungen" };

export default function TeilnahmebedingungenPage() {
  return (
    <LegalPage title="Teilnahmebedingungen">
      <section>
        <h2>1. Teilnahme</h2>
        <p>Teilnehmen können volljährige Personen mit Wohnsitz in Deutschland, Österreich oder der Schweiz. Die Teilnahme ist kostenlos und freiwillig.</p>
      </section>
      <section>
        <h2>2. Bewerbung und Auswahl</h2>
        <p>
          Du kannst dich für ausgeschriebene Produkttests bewerben. Die Auswahl trifft [Name der Agentur] nach eigenem Ermessen. Ein Anspruch auf Teilnahme an
          einem bestimmten Test besteht nicht.
        </p>
      </section>
      <section>
        <h2>3. Testprodukt</h2>
        <p>[Bitte ergänzen: Darf das Produkt nach dem Test behalten werden? Gibt es Ausnahmen/Rücksendungen?]</p>
      </section>
      <section>
        <h2>4. Bewertung</h2>
        <p>
          Ausgewählte Tester:innen verpflichten sich, das Produkt sorgfältig zu testen und innerhalb von ca. zwei Wochen nach Erhalt eine ehrliche Bewertung über
          TesterHero abzugeben. Bewertungen werden nicht öffentlich veröffentlicht und dienen ausschließlich der internen Produktverbesserung.
        </p>
      </section>
      <section>
        <h2>5. Abmeldung</h2>
        <p>Du kannst dich jederzeit über den Link in jeder E-Mail oder in deinem Profil abmelden und dein Konto löschen.</p>
      </section>
      <section>
        <h2>6. Ausschluss</h2>
        <p>Bei Missbrauch, falschen Angaben oder wiederholt fehlenden Bewertungen kann ein Konto gesperrt werden.</p>
      </section>
    </LegalPage>
  );
}
