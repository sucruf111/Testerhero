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
};

export const EXAMPLE_PRODUCTS: ExampleProduct[] = [
  { id: "gleitgel", name: "Gleitgel, 100 ml", price: "12,74 €" },
  { id: "massagegel", name: "Massage-Gel, 200 ml", price: "9,99 €" },
  { id: "wasserenthaerter", name: "Wasserenthärter-Tabs", price: "7,79 €" },
  { id: "maschinenreiniger", name: "Waschmaschinen-Reiniger", price: "2,35 €" },
  { id: "rohrreiniger", name: "Rohrreiniger, 3 × 1 l", price: "11,25 €" },
  { id: "wespenspray", name: "Wespen-Spray", price: "12,56 €", yaw: 1.8 },
  { id: "schaedlingsspray", name: "Schädlingsspray für Pflanzen", price: "8,49 €" },
  { id: "parfum", name: "Eau de Parfum, 75 ml", price: "16,95 €" },
  { id: "proteinpulver", name: "Proteinpulver, 500 g", price: "16,69 €" },
  { id: "diaetshake", name: "Diät-Shake, 2er-Pack", price: "15,50 €" },
  { id: "rasensamen", name: "Rasensamen, 1 kg", price: "17,95 €" },
  { id: "kollagen", name: "Kollagen-Pulver", price: "23,71 €" },
  { id: "vitamin-b12", name: "Vitamin-B12-Spray", price: "12,97 €", yaw: 1.45 },
  { id: "elektrolyte", name: "Elektrolyt-Drink", price: "24,57 €" },
  { id: "pickleball", name: "Pickleball-Schläger", price: "49,29 €" },
  { id: "schlagschnur", name: "Schlagschnur mit Kreide", price: "24,99 €" },
];

export const modelUrl = (p: ExampleProduct) => `/models/${p.id}.glb`;

/** Zufällige Auswahl ohne Wiederholung */
export function pickRandomProducts(count: number): ExampleProduct[] {
  const list = [...EXAMPLE_PRODUCTS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}
