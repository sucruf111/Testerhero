/**
 * Vereinheitlichte Adresse, um denselben Haushalt zu erkennen
 * („Hauptstraße 4“ = „Hauptstr. 4“ = „hauptstrasse 4“).
 * Muss zur SQL-Variante in drizzle/0001_claims.sql passen.
 */
export function addressKey(street: string, postalCode: string, country: string) {
  const s = street
    .toLowerCase()
    .replace(/stra(ss|ß)e/g, "str")
    .replace(/[^a-z0-9äöüß]/g, "");
  return `${country}|${postalCode.trim()}|${s}`;
}
