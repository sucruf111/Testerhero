/**
 * Beispielprodukte für die Startseite: echte Produkte aus dem Sortiment, als 3D-Modelle
 * (aus Produktfotos erzeugt, optimiert in /public/models). Bewusst ohne Markennamen im Text,
 * die Verpackung sorgt für den Wiedererkennungswert.
 */
export type ExampleProduct = {
  id: string;
  name: string;
  price: string;
  /** Drehung (Radiant), damit die Vorderseite der Verpackung zur Kamera zeigt */
  yaw?: number;
  /** Höhe im Rad im Vergleich zu den anderen (1 = Standard) */
  size?: number;
  /** Kartons bauen wir selbst: Vorderseite = Produktfoto, Tiefe im Verhältnis zur Breite */
  box?: { depth: number };
};

export const EXAMPLE_PRODUCTS: ExampleProduct[] = [
  { id: "gleitgel", name: "Gleitgel, 100 ml", price: "12,74 €", size: 0.92 },
  { id: "massagegel", name: "Massage-Gel, 200 ml", price: "9,99 €" },
  { id: "wasserenthaerter", name: "Wasserenthärter-Tabs", price: "7,79 €", box: { depth: 0.38 } },
  { id: "maschinenreiniger", name: "Waschmaschinen-Reiniger", price: "2,35 €", box: { depth: 0.34 } },
  { id: "rohrreiniger", name: "Rohrreiniger, 3 × 1 l", price: "11,25 €", size: 1.08 },
  { id: "wespenspray", name: "Wespen-Spray", price: "12,56 €", yaw: 1.67, size: 1.04 },
  { id: "schaedlingsspray", name: "Schädlingsspray für Pflanzen", price: "8,49 €", size: 1.08 },
  { id: "parfum", name: "Eau de Parfum, 75 ml", price: "16,95 €", size: 0.82 },
  { id: "proteinpulver", name: "Proteinpulver, 500 g", price: "16,69 €", size: 1.04 },
  { id: "diaetshake", name: "Diät-Shake, 2er-Pack", price: "15,50 €" },
  { id: "rasensamen", name: "Rasensamen, 1 kg", price: "17,95 €", size: 1.04 },
  { id: "kollagen", name: "Kollagen-Pulver", price: "23,71 €", size: 0.95 },
  { id: "vitamin-b12", name: "Vitamin-B12-Spray", price: "12,97 €", yaw: 1.3, size: 0.82 },
  { id: "elektrolyte", name: "Elektrolyt-Drink", price: "24,57 €", box: { depth: 0.5 } },
  { id: "pickleball", name: "Pickleball-Schläger", price: "49,29 €", size: 1.18 },
  { id: "schlagschnur", name: "Schlagschnur mit Kreide", price: "24,99 €", size: 0.9 },
];

export const modelUrl = (p: ExampleProduct) => `/models/${p.id}.glb`;
export const boxTextureUrl = (p: ExampleProduct) => `/models/boxes/${p.id}.webp`;

/** Zufällige Auswahl ohne Wiederholung */
export function pickRandomProducts(count: number): ExampleProduct[] {
  const list = [...EXAMPLE_PRODUCTS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}
