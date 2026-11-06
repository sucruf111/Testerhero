/**
 * Führt ausstehende Datenbank-Migrationen aus.
 * Läuft automatisch bei jedem Vercel-Build (siehe "vercel-build" in package.json).
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  // Für Migrationen bevorzugt die direkte (ungepoolte) Verbindung nutzen, falls vorhanden (Neon)
  const url =
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;
  if (!url) {
    console.warn("⚠️  DATABASE_URL ist nicht gesetzt – Migrationen werden übersprungen.");
    return;
  }
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("✅ Datenbank ist auf dem neuesten Stand.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("❌ Migration fehlgeschlagen:", error);
  process.exit(1);
});
