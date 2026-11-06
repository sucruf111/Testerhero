import { Mesh, MeshStandardMaterial, type Texture } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Karton-Verpackung als echte 3D-Box: Die Vorderseite ist das Produktfoto (gestochen scharf),
 * Seiten, Deckel und Boden setzen die Randfarben der Vorderseite fort – wie bei einem bedruckten Karton.
 * Für Schachteln ist das deutlich sauberer als ein aus einem einzelnen Foto erzeugtes Modell.
 */
export function createPackageBox(front: Texture, depthRatio: number) {
  const img = front.image as { width: number; height: number };
  const width = img.width / img.height; // Höhe = 1
  const depth = width * depthRatio;
  const geometry = new RoundedBoxGeometry(width, 1, depth, 2, Math.min(width, depth) * 0.035);

  // Reihenfolge der Flächen: rechts, links, oben, unten, vorne, hinten (gleich viele Ecken je Fläche)
  const uv = geometry.attributes.uv;
  const perFace = uv.count / 6;
  const EDGE = 0.012; // schmaler Streifen am Rand der Vorderseite
  for (let face = 0; face < 6; face++) {
    for (let i = face * perFace; i < (face + 1) * perFace; i++) {
      let u = uv.getX(i);
      let v = uv.getY(i);
      if (face === 0) u = 1 - EDGE + EDGE * u;
      else if (face === 1) u = EDGE * u;
      else if (face === 2) v = 1 - EDGE + EDGE * v;
      else if (face === 3) v = EDGE * v;
      uv.setXY(i, u, v);
    }
  }
  uv.needsUpdate = true;

  const material = new MeshStandardMaterial({ map: front, roughness: 0.55, metalness: 0, envMapIntensity: 0.7 });
  return new Mesh(geometry, material);
}
