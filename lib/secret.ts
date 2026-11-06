/**
 * Signatur-Schlüssel für Sessions & Links.
 * Bewusst ohne "server-only", damit auch proxy.ts ihn nutzen kann –
 * darf aber niemals in Client-Komponenten importiert werden.
 */
const DEV_SECRET = "dev-only-secret-do-not-use-in-production-000000";

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET fehlt oder ist zu kurz (mind. 32 Zeichen).");
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(secret);
}
