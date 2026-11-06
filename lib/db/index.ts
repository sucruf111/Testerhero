import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __testerheroDb?: DB };

function createDb(): DB {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL ist nicht gesetzt. Bitte eine Postgres-Datenbank verbinden (siehe README).",
    );
  }
  const client = postgres(url, {
    // Serverless-freundlich: wenige Verbindungen pro Instanz
    max: process.env.NODE_ENV === "production" ? 3 : 10,
    idle_timeout: 20,
    // Neon/pgBouncer (Pooler-URL) unterstützt keine Prepared Statements
    prepare: !/pooler|pgbouncer=true/.test(url),
  });
  return drizzle(client, { schema });
}

/** Lazy, damit `next build` auch ohne Datenbank funktioniert. */
export function getDb(): DB {
  if (!globalForDb.__testerheroDb) {
    globalForDb.__testerheroDb = createDb();
  }
  return globalForDb.__testerheroDb;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
