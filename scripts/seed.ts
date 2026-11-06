/**
 * Legt Demo-Daten an (Produkte, Tester, Pakete, Bewertungen).
 * Nur für lokale Entwicklung / Vorschau-Umgebungen gedacht:  npm run db:seed
 * Alle Demo-Tester haben das Passwort "tester123".
 */
import { randomBytes, scryptSync } from "node:crypto";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

config({ path: [".env.local", ".env"], quiet: true });

function hash(password: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(password.normalize("NFKC"), salt, 64).toString("hex")}`;
}

const daysFromNow = (d: number) => {
  const date = new Date(Date.now() + d * 86_400_000);
  return date.toISOString().slice(0, 10);
};
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL fehlt");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const existing = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
  if (existing.length && !process.argv.includes("--force")) {
    console.log("ℹ️  Es gibt bereits Daten – Seed übersprungen (mit --force erzwingen).");
    await client.end();
    return;
  }

  const products = await db
    .insert(schema.products)
    .values([
      {
        slug: "milchaufschaeumer-pro",
        title: "Milchaufschäumer Pro",
        brand: "Barista Home",
        category: "Haushalt & Küche",
        shortDescription: "Kabelloser Milchaufschäumer mit 4 Stufen – für cremigen Schaum in nur 60 Sekunden, warm oder kalt.",
        description:
          "Der Milchaufschäumer Pro zaubert in Sekunden feinporigen Milchschaum – ob für Cappuccino, Latte Macchiato oder Kakao.\n\nDank vier Temperaturstufen und antihaftbeschichtetem Innenbehälter ist er im Handumdrehen gereinigt. Funktioniert auch mit Hafer- und Sojadrinks.",
        testInstructions: "• Wie gut gelingt der Schaum mit verschiedenen Milchsorten?\n• Wie einfach ist die Reinigung?\n• Wie laut ist das Gerät?",
        retailPriceCents: 4999,
        slots: 20,
        applicationDeadline: daysFromNow(9),
        status: "active",
      },
      {
        slug: "bluetooth-kopfhoerer-airflow",
        title: "Bluetooth-Kopfhörer AirFlow",
        brand: "Soundwerk",
        category: "Elektronik & Technik",
        shortDescription: "Over-Ear-Kopfhörer mit aktivem Noise Cancelling und 40 Stunden Akkulaufzeit.",
        description:
          "Die AirFlow-Kopfhörer kombinieren starkes Noise Cancelling mit bequemen Memory-Foam-Polstern. Per Schnellladung reichen 10 Minuten für 5 Stunden Musik.",
        testInstructions: "• Wie gut ist der Klang bei unterschiedlicher Musik?\n• Wie wirkt das Noise Cancelling im Alltag?\n• Wie bequem sind die Kopfhörer nach 2 Stunden?",
        retailPriceCents: 8999,
        slots: 12,
        applicationDeadline: daysFromNow(4),
        status: "active",
      },
      {
        slug: "naturkosmetik-gesichtsserum",
        title: "Vitamin-C-Gesichtsserum",
        brand: "Pure Botanics",
        category: "Beauty & Pflege",
        shortDescription: "Leichtes Serum mit 15 % Vitamin C und Hyaluron für einen frischen, ebenmäßigen Teint.",
        description: "Das vegane Serum zieht schnell ein und eignet sich für alle Hauttypen. Ohne Duftstoffe, dermatologisch getestet.",
        retailPriceCents: 2495,
        slots: 30,
        applicationDeadline: daysFromNow(14),
        status: "active",
      },
      {
        slug: "yogamatte-grip-plus",
        title: "Yogamatte Grip+",
        brand: "FlowFit",
        category: "Sport & Outdoor",
        shortDescription: "Rutschfeste Naturkautschuk-Matte mit Ausrichtungslinien – 6 mm dick und gelenkschonend.",
        description: "Die Grip+ bietet auch bei schweißtreibenden Sessions sicheren Halt. Inklusive Tragegurt.",
        retailPriceCents: 3999,
        slots: 10,
        applicationDeadline: daysFromNow(-20),
        status: "closed",
      },
    ])
    .returning();

  const people = [
    ["Lena", "Müller", "Hauptstraße 4", "10115", "Berlin", 1991, ["Haushalt & Küche", "Beauty & Pflege"]],
    ["Jonas", "Schmidt", "Lindenweg 12", "80331", "München", 1986, ["Elektronik & Technik", "Sport & Outdoor"]],
    ["Aylin", "Kaya", "Rosenstraße 8", "50667", "Köln", 1995, ["Beauty & Pflege", "Mode & Accessoires"]],
    ["Markus", "Weber", "Am Markt 1", "20095", "Hamburg", 1979, ["Haushalt & Küche", "Garten & Heimwerken"]],
    ["Sophie", "Becker", "Gartenstraße 22", "04109", "Leipzig", 1998, ["Sport & Outdoor", "Gesundheit & Wellness"]],
    ["David", "Hoffmann", "Bahnhofstraße 7", "70173", "Stuttgart", 1990, ["Elektronik & Technik"]],
    ["Mia", "Schulz", "Kirchplatz 3", "60311", "Frankfurt am Main", 1993, ["Haushalt & Küche", "Baby & Kind"]],
    ["Tim", "Fischer", "Schillerstraße 15", "01067", "Dresden", 1988, ["Elektronik & Technik", "Auto & Fahrrad"]],
  ] as const;

  const passwordHash = hash("tester123");
  const testers = await db
    .insert(schema.testers)
    .values(
      people.map(([firstName, lastName, street, postalCode, city, birthYear], i) => ({
        email: `${firstName}.${lastName}@example.com`.toLowerCase().replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae"),
        passwordHash,
        firstName,
        lastName,
        street,
        postalCode,
        city,
        birthYear,
        emailVerifiedAt: daysAgo(40 - i),
        createdAt: daysAgo(40 - i),
        status: i === 7 ? ("unsubscribed" as const) : ("active" as const),
        unsubscribedAt: i === 7 ? daysAgo(2) : null,
      })),
    )
    .returning();

  const [milk, headphones, serum, yoga] = products;
  const T = testers;
  const apps = await db
    .insert(schema.applications)
    .values([
      { productId: milk.id, testerId: T[6].id, status: "accepted", decidedAt: daysAgo(1) },
      { productId: milk.id, testerId: T[3].id, status: "accepted", decidedAt: daysAgo(1) },
      { productId: headphones.id, testerId: T[1].id, status: "accepted", decidedAt: daysAgo(2) },
      { productId: headphones.id, testerId: T[5].id, status: "shipped", decidedAt: daysAgo(6), shippedAt: daysAgo(3), carrier: "DHL", trackingNumber: "00340434161094042557" },
      { productId: serum.id, testerId: T[2].id, status: "received", decidedAt: daysAgo(8), shippedAt: daysAgo(6), receivedAt: daysAgo(4), carrier: "Hermes" },
      { productId: yoga.id, testerId: T[4].id, status: "reviewed", decidedAt: daysAgo(30), shippedAt: daysAgo(27), receivedAt: daysAgo(25), carrier: "Hermes" },
      { productId: yoga.id, testerId: T[1].id, status: "reviewed", decidedAt: daysAgo(30), shippedAt: daysAgo(27), receivedAt: daysAgo(24), carrier: "Hermes" },
      { productId: yoga.id, testerId: T[3].id, status: "received", decidedAt: daysAgo(30), shippedAt: daysAgo(27), receivedAt: daysAgo(23), carrier: "Hermes" },
    ])
    .returning();

  const reviewed = apps.filter((a) => a.status === "reviewed");
  await db.insert(schema.reviews).values([
    {
      applicationId: reviewed[0].id,
      productId: yoga.id,
      testerId: reviewed[0].testerId,
      rating: 5,
      title: "Endlich rutscht nichts mehr!",
      body: "Ich mache dreimal pro Woche Yoga und hatte bisher immer Probleme mit rutschigen Matten. Die Grip+ hält auch bei Hot Yoga bombenfest. Die Ausrichtungslinien sind super hilfreich für Anfänger.",
      pros: "Grip, Dicke, Ausrichtungslinien",
      cons: "Riecht die ersten Tage etwas nach Gummi",
      wouldRecommend: true,
    },
    {
      applicationId: reviewed[1].id,
      productId: yoga.id,
      testerId: reviewed[1].testerId,
      rating: 4,
      title: "Sehr gute Matte, etwas schwer",
      body: "Die Qualität ist wirklich top und die Matte liegt flach auf dem Boden. Für unterwegs ist sie mir mit knapp 2,5 kg allerdings etwas zu schwer. Zuhause aber eine klare Empfehlung.",
      pros: "Verarbeitung, Dämpfung",
      cons: "Gewicht",
      wouldRecommend: true,
    },
  ]);

  // Adress-Schlüssel wie in der App berechnen
  await client`update testers set address_key = country || '|' || trim(postal_code) || '|' || regexp_replace(regexp_replace(lower(street), 'stra(ss|ß)e', 'str', 'g'), '[^a-z0-9äöüß]', '', 'g')`;
  await client`insert into settings (id) values (1) on conflict do nothing`;

  console.log(`✅ Demo-Daten angelegt: ${products.length} Produkte, ${testers.length} Tester, ${apps.length} Pakete.`);
  console.log("   Demo-Login Tester: lena.mueller@example.com / tester123");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
