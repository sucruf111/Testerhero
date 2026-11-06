# TesterHero

Plattform, über die eine Agentur Produkttester:innen findet und verwaltet. Tester bewerben sich auf Produkte, die Agentur wählt aus, verschickt die Produkte an die hinterlegte Adresse und sammelt **interne** Bewertungen (keine Veröffentlichung auf Amazon). Tester können sich jederzeit mit einem Klick abmelden.

Die gesamte Oberfläche ist auf Deutsch.

## Funktionen

**Für Tester:innen**
- Startseite mit Ablauf, aktuellen Produkttests und FAQ
- Registrierung mit Lieferadresse, Interessen und Einwilligung (Double-Opt-in per E-Mail)
- Produktübersicht mit Kategorie-Filter, freie Plätze, Bewerbungsfrist
- Bewerbung mit einem Klick (optional mit kurzer Motivation)
- „Meine Tests“: Status-Verlauf (Beworben → Ausgewählt → Versendet → Erhalten → Bewertet), Sendungsverfolgung
- Bewertungsformular (Sterne, Text, Pro/Contra, Weiterempfehlung)
- Profil: Adresse ändern, Passwort ändern, E-Mail-Benachrichtigungen, Abmelden, Konto löschen (DSGVO)
- Passwort vergessen / zurücksetzen

**Abmelden („Unsubscribe“)**
- Jede E-Mail enthält einen persönlichen Abmeldelink (ohne Login nutzbar)
- Wahl: nur Produkt-E-Mails abbestellen **oder** komplett abmelden (keine Produkte, keine E-Mails, offene Bewerbungen werden zurückgezogen)
- One-Click-Abmeldung nach RFC 8058 (`List-Unsubscribe`-Header für Gmail, Apple Mail & Co.)
- Abgemeldete Tester werden bei Auswahl, Versand und Benachrichtigungen automatisch ausgeschlossen und können sich selbst reaktivieren

**Für die Agentur (`/admin`)**
- Dashboard mit Kennzahlen (neue Bewerbungen, zu versenden, aktive Tester, Ø-Bewertung)
- Produkte anlegen/bearbeiten (Bild-URL oder Upload über Vercel Blob, Testplätze, Frist, Warenwert, Testhinweise)
- Bewerbungen sichten (Motivation, bisherige Tests des Testers), einzeln oder gesammelt auswählen/ablehnen
- **Versand-Seite** mit allen Lieferadressen, „Adresse kopieren“, Sendungsnummer + Versanddienstleister erfassen
- CSV-Exporte (Excel-kompatibel): Versandliste, Tester, Bewertungen
- Tester per E-Mail über neue Produkte informieren (optional nur passende Interessen)
- Testerverwaltung mit Suche/Filter, interner Notiz, Sperren, Löschen
- Bewertungsübersicht je Produkt (Ø-Sterne, Weiterempfehlungsquote)
- Automatische E-Mails bei Auswahl, Absage und Versand (mit Sendungsnummer)

## Technik

| Bereich | Lösung |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Design | Tailwind CSS 4, Schriften Fraunces + Plus Jakarta Sans (selbst gehostet), Lucide-Icons |
| Datenbank | Postgres (empfohlen: Neon über den Vercel Marketplace) mit Drizzle ORM |
| Auth | Eigene, signierte Session-Cookies (JWT/HS256), Passwörter mit scrypt |
| E-Mail | Resend (ohne API-Key werden E-Mails nur ins Server-Log geschrieben) |
| Bilder | Optional Vercel Blob, sonst Bild-URL |
| Hosting | Vercel |

## Lokal starten

Voraussetzungen: Node.js ≥ 20.9 und eine Postgres-Datenbank (lokal oder z. B. ein Neon-Branch).

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run db:migrate           # Tabellen anlegen
npm run db:seed              # optional: Demo-Daten
npm run dev
```

- Website: http://localhost:3000
- Agentur-Bereich: http://localhost:3000/admin (Zugang aus `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Demo-Tester (nach `db:seed`): `lena.mueller@example.com` / `tester123`

Ohne `RESEND_API_KEY` erscheinen alle E-Mails (inkl. Bestätigungs- und Abmeldelinks) im Terminal.

## Auf Vercel veröffentlichen

1. Repository in Vercel importieren (Framework: Next.js – wird automatisch erkannt).
2. **Storage → Neon Postgres** hinzufügen. Dadurch wird `DATABASE_URL` automatisch gesetzt.
3. Unter **Settings → Environment Variables** eintragen:
   - `AUTH_SECRET` – zufälliger Wert, z. B. `openssl rand -base64 32`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` – Zugang für die Agentur
   - `RESEND_API_KEY`, `EMAIL_FROM` – nach Domain-Verifizierung bei Resend
   - `APP_URL` – z. B. `https://testerhero.app` (für Links in E-Mails)
   - optional: **Storage → Blob** verbinden für Bild-Uploads
4. Deploy. Beim Build laufen die Datenbank-Migrationen automatisch (`vercel-build`).
5. Eigene Domain unter **Settings → Domains** verbinden.

## Datenmodell

- `testers` – Profil, Lieferadresse, Interessen, Status (`active` / `unsubscribed` / `blocked`), Benachrichtigungen
- `products` – Produkttest mit Plätzen, Frist, Status (`draft` / `active` / `closed`)
- `applications` – Bewerbung je Tester & Produkt mit Status (`pending` → `accepted` → `shipped` → `received` → `reviewed`, sowie `rejected` / `withdrawn`) und Versanddaten
- `reviews` – Bewertung je Bewerbung

Schema-Änderungen: `lib/db/schema.ts` anpassen, dann `npm run db:generate` und die neue Migration committen.

## Vor dem Livegang

- Impressum, Datenschutzerklärung und Teilnahmebedingungen (`app/(site)/impressum`, `datenschutz`, `teilnahmebedingungen`) mit den Daten der Agentur ergänzen und rechtlich prüfen lassen.
- Absender-Domain bei Resend verifizieren (SPF/DKIM), damit E-Mails nicht im Spam landen.
- Starkes `ADMIN_PASSWORD` und `AUTH_SECRET` setzen.
