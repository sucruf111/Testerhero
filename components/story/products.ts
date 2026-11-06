/**
 * Beispielprodukte für die Startseite: echte 3D-Modelle (glTF), optimiert in /public/models.
 * Quellen: Poly Haven (CC0), Khronos glTF Sample Assets (CC0) und ein Sneaker von Shopify (CC BY 4.0).
 * Es sind Beispiele, keine echten Angebote.
 */
export type ExampleProduct = {
  id: string;
  name: string;
  price: string;
};

export const EXAMPLE_PRODUCTS: ExampleProduct[] = [
  { id: "sneaker", name: "Sneaker", price: "44,99 €" },
  { id: "wecker", name: "Wecker", price: "19,99 €" },
  { id: "badeente", name: "Badeente", price: "6,99 €" },
  { id: "sukkulente", name: "Sukkulente im Topf", price: "14,99 €" },
  { id: "ukulele", name: "Ukulele", price: "39,99 €" },
  { id: "thermoskanne", name: "Thermoskanne", price: "19,99 €" },
  { id: "trinkflasche", name: "Trinkflasche", price: "17,99 €" },
  { id: "teetasse", name: "Teetasse", price: "12,99 €" },
  { id: "vase", name: "Keramikvase", price: "19,99 €" },
  { id: "fernglas", name: "Fernglas", price: "34,99 €" },
  { id: "kissen", name: "Dekokissen", price: "24,99 €" },
  { id: "korb", name: "Aufbewahrungskorb", price: "22,99 €" },
  { id: "radio", name: "Retro-Radio", price: "49,99 €" },
  { id: "giesskanne", name: "Gießkanne", price: "16,99 €" },
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
