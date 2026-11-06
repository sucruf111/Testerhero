# TesterHero

Plattform für eine Agentur, die neue Produkte von echten Menschen testen lassen will. Das Prinzip ist eine **Überraschungsbox**:

1. Tester melden sich kostenlos an und hinterlegen ihre Lieferadresse.
2. Die Agentur legt ein Produkt an und stellt es auf „Aktiv“. Das System lost die Plätze sofort per Zufall unter allen berechtigten Testern aus.
3. Die Agentur verschickt die Pakete (mit Sendungsnummer). Was drin ist, sieht der Tester erst, wenn er das Paket im Konto als „ausgepackt“ markiert.
4. Der Tester schreibt eine Bewertung. Die bleibt intern, es gibt keine Veröffentlichung auf Amazon. Das Produkt darf er behalten.

Die gesamte Oberfläche ist auf Deutsch.

## Regeln der Auslosung

- Ausgelost wird nur, wer aktiv ist und seine E-Mail-Adresse bestätigt hat.
- Niemand bekommt dasselbe Produkt zweimal, auch nicht nach einer Stornierung.
- Pro Haushalt (gleiche Adresse, Schreibweise wie „Str.“ und „Straße“ wird erkannt) geht jedes Produkt nur an eine Person.
- Höchstens X Pakete in Y Tagen und höchstens Z offene (noch nicht bewertete) Pakete pro Person. Die Werte stellt die Agentur unter **Einstellungen** ein (Standard: 3 in 30 Tagen, 2 offen).
- Freie Plätze werden automatisch nachverteilt: bei neuen Anmeldungen, nach Bewertungen, Abmeldungen und Stornierungen, außerdem einmal täglich per Vercel Cron. Die Agentur kann jederzeit auch „Jetzt verteilen“ klicken.
- Die Verteilung läuft unter einer Datenbank-Sperre. Auch bei gleichzeitigen Aufrufen wird nie mehr vergeben, als Plätze da sind.

## Funktionen

**Für Tester**
- Startseite mit Ablauf, Regeln und Fragen
- Anmeldung mit Lieferadresse und Bestätigung per E-Mail
- „Meine Pakete“: Überraschungspaket mit Status, Sendungsverfolgung, „Paket ist da, auspacken“, danach Bewertung
- Paket ablehnen, solange es noch nicht verschickt ist (der Platz wird neu ausgelost)
- Profil: Adresse und Passwort ändern, abmelden, Konto löschen
- Abmelden über den Link in jeder E-Mail (ohne Login) und per One-Click im E-Mail-Programm (RFC 8058)

**Für die Agentur (`/admin`)**
- Übersicht: zu versenden, beim Tester, aktive Tester, Bewertungen, freie Plätze
- Produkte anlegen (Bild-URL oder Upload über Vercel Blob), aktivieren, beenden
- Pro Produkt: wer es bekommen hat, Versand mit Sendungsnummer, stornieren (einzeln oder mehrere)
- Versand-Seite mit allen Adressen, „Adresse kopieren“ und CSV-Versandliste
- Tester suchen, sperren, löschen, interne Notizen
- Bewertungen je Produkt mit Durchschnitt und CSV-Export
- Einstellungen für die Limits

**Automatische E-Mails** (über Resend): Bestätigungslink, ausgelost (ohne Produktnamen), versendet mit Sendungsnummer, storniert, Passwort zurücksetzen.

## Technik

| Bereich | Lösung |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Design | Tailwind CSS 4, Schriften Bricolage Grotesque + Plus Jakarta Sans (selbst gehostet), Lucide-Icons |
| Datenbank | Postgres (empfohlen: Neon über den Vercel Marketplace) mit Drizzle ORM |
| Login | Eigene, signierte Session-Cookies (JWT/HS256), Passwörter mit scrypt |
| E-Mail | Resend (ohne API-Key werden E-Mails nur ins Server-Log geschrieben) |
| Zeitplan | Vercel Cron, täglich `/api/cron/verteilen` (siehe `vercel.json`) |
| Hosting | Vercel |

## Lokal starten

Voraussetzungen: Node.js ≥ 20.9 und eine Postgres-Datenbank.

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run db:migrate           # Tabellen anlegen
npm run db:seed              # optional: Demo-Daten
npm run dev
```

- Website: http://localhost:3000
- Agentur: http://localhost:3000/admin (Zugang aus `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Demo-Tester nach `db:seed`: `lena.mueller@example.com` / `tester123`

Ohne `RESEND_API_KEY` erscheinen alle E-Mails mit ihren Links im Terminal.

## Auf Vercel

1. Repository in Vercel importieren (Next.js wird erkannt), Produktions-Branch `main`.
2. **Storage → Neon Postgres** hinzufügen. Damit wird `DATABASE_URL` gesetzt.
3. Unter **Settings → Environment Variables**:
   - `AUTH_SECRET`: zufälliger Wert, z. B. `openssl rand -base64 32`
   - `CRON_SECRET`: zufälliger Wert, schützt den täglichen Verteil-Job
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Zugang für die Agentur
   - `RESEND_API_KEY`, `EMAIL_FROM`: nachdem die Absender-Domain bei Resend bestätigt ist
   - `APP_URL`: z. B. `https://testerhero.app`
   - optional **Storage → Blob** für Bild-Uploads
4. Neu deployen. Die Datenbank-Tabellen werden beim Build automatisch angelegt (`vercel-build`).
5. Eigene Domain unter **Settings → Domains** verbinden.

## Datenmodell

- `testers`: Profil, Lieferadresse, Adress-Schlüssel (für die Haushalts-Regel), Status (`active`, `unsubscribed`, `blocked`)
- `products`: Produkt mit Anzahl Paketen, „Verteilen bis“, Status (`draft`, `active`, `closed`)
- `applications`: ein Paket pro Tester und Produkt: `accepted` (ausgelost) → `shipped` → `received` (ausgepackt) → `reviewed`, dazu `rejected` (storniert) und `withdrawn` (abgelehnt oder abgemeldet)
- `reviews`: Bewertung je Paket
- `settings`: Limits für die Auslosung

Schema ändern: `lib/db/schema.ts` anpassen, `npm run db:generate` ausführen und die neue Migration committen.

## Vor dem Start

- Impressum, Datenschutz und Teilnahmebedingungen (`app/(site)/…`) mit den Daten der Agentur ergänzen und rechtlich prüfen lassen.
- Absender-Domain bei Resend bestätigen (SPF/DKIM), damit E-Mails nicht im Spam landen.
- Sichere Werte für `ADMIN_PASSWORD`, `AUTH_SECRET` und `CRON_SECRET` setzen.
