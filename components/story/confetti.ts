import {
  CircleGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  type Scene,
  Vector3,
} from "three";

/**
 * Konfetti als echte 3D-Teilchen: Papierschnipsel (matt) und Folien-Pailletten (glänzend).
 * Bewegung mit Luftwiderstand und Schwerkraft (geschlossen gelöst, also ohne Aufsummieren
 * von Fehlern), dazu Trudeln und seitliches Flattern beim Fallen.
 */

type Piece = {
  vel: Vector3; // Startgeschwindigkeit
  offset: Vector3; // Startpunkt relativ zur Öffnung der Box
  axis: Vector3; // Drehachse fürs Trudeln
  spin: number; // Drehgeschwindigkeit (rad/s)
  w: number;
  h: number;
  drag: number; // Luftwiderstand
  gravity: number;
  delay: number;
  phase: number;
  flutter: number; // Frequenz des Flatterns
  sway: number; // Weite des Flatterns
  life: number;
};

const PAPER = ["#ff7d5c", "#ffc94d", "#a594f9", "#5fcfa7", "#6cb8f0", "#ffffff", "#ffb2c0"];
const FOIL = ["#e8c46c", "#dfe2ea", "#eea995"];

export type Confetti = {
  /** age: Sekunden seit dem Start, negativ = ausgeblendet */
  update: (age: number, origin: Vector3) => void;
  dispose: () => void;
};

export function createConfetti(scene: Scene, mobile: boolean): Confetti {
  const paperCount = mobile ? 110 : 230;
  const foilCount = mobile ? 34 : 70;

  const paperMat = new MeshStandardMaterial({ side: DoubleSide, roughness: 0.6, metalness: 0, envMapIntensity: 0.7 });
  const foilMat = new MeshStandardMaterial({ side: DoubleSide, roughness: 0.26, metalness: 0.9, envMapIntensity: 1 });
  const paper = new InstancedMesh(new PlaneGeometry(1, 1), paperMat, paperCount);
  const foil = new InstancedMesh(new CircleGeometry(0.5, 14), foilMat, foilCount);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  const make = (mesh: InstancedMesh, count: number, palette: string[], isFoil: boolean) => {
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.count = 0;
    scene.add(mesh);
    const color = new Color();
    const pieces: Piece[] = [];
    for (let i = 0; i < count; i++) {
      // Kegel nach oben, leicht nach vorn (zur Kamera) geneigt
      const theta = Math.random() * Math.PI * 2;
      const up = rand(0.5, 0.97);
      const side = Math.sqrt(1 - up * up);
      const speed = isFoil ? rand(6.5, 10.5) : rand(5.8, 10.2);
      // ein Viertel kommt als zweite, kleinere Welle kurz danach: gibt Tiefe
      const secondWave = Math.random() < 0.25;
      const vel = new Vector3(Math.cos(theta) * side, up, Math.sin(theta) * side * 0.8 + 0.18).multiplyScalar(speed);
      const size = isFoil ? rand(0.07, 0.1) : rand(0.08, 0.12);
      pieces.push({
        vel,
        offset: new Vector3(rand(-0.5, 0.5), 0, rand(-0.5, 0.5)),
        axis: new Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(),
        spin: rand(5, 13) * (Math.random() < 0.5 ? -1 : 1),
        w: size,
        h: isFoil ? size : size * rand(1.5, 2.1),
        // unterschiedlicher Luftwiderstand: leichte Schnipsel schweben länger, so fällt nichts im Gleichschritt
        drag: isFoil ? rand(1.3, 2.0) : rand(1.6, 3.3),
        gravity: isFoil ? rand(4.4, 5.2) : rand(3.1, 4.4),
        delay: secondWave ? rand(0.22, 0.42) : rand(0, 0.1),
        phase: rand(0, Math.PI * 2),
        flutter: rand(2.2, 4.2),
        sway: isFoil ? rand(0.05, 0.12) : rand(0.14, 0.32),
        life: rand(4.4, 5.8),
      });
      mesh.setColorAt(i, color.set(palette[i % palette.length]));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return pieces;
  };

  const paperPieces = make(paper, paperCount, PAPER, false);
  const foilPieces = make(foil, foilCount, FOIL, true);

  const m = new Matrix4();
  const q = new Quaternion();
  const q2 = new Quaternion();
  const pos = new Vector3();
  const scale = new Vector3();
  const flatX = new Vector3(1, 0, 0);

  const place = (mesh: InstancedMesh, pieces: Piece[], age: number, origin: Vector3) => {
    if (age < 0) {
      mesh.count = 0;
      return;
    }
    let visible = 0;
    pieces.forEach((pc, i) => {
      const t = age - pc.delay;
      if (t <= 0 || t > pc.life) {
        m.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, m);
        return;
      }
      visible++;
      const k = pc.drag;
      const e = 1 - Math.exp(-k * t);
      // Weg mit linearem Luftwiderstand: v0·(1−e^(−kt))/k, Schwerkraft g·(t/k − (1−e^(−kt))/k²)
      const fall = pc.gravity * (t / k - e / (k * k));
      const flutter = Math.sin(t * pc.flutter + pc.phase) * pc.sway * e;
      pos.set(
        origin.x + pc.offset.x + (pc.vel.x * e) / k + flutter,
        origin.y + (pc.vel.y * e) / k - fall,
        origin.z + pc.offset.z + (pc.vel.z * e) / k + Math.cos(t * pc.flutter * 0.7 + pc.phase) * pc.sway * 0.5 * e,
      );
      // Trudeln, beim Fallen zusätzlich hin und her kippen wie ein Blatt
      q.setFromAxisAngle(pc.axis, pc.spin * t);
      q2.setFromAxisAngle(flatX, Math.sin(t * pc.flutter + pc.phase) * 0.9 * e);
      q.multiply(q2);
      // kurz vor dem Ende kleiner werden statt hart verschwinden
      const fade = Math.min(1, (pc.life - t) / 0.5, t / 0.06);
      scale.set(pc.w * fade, pc.h * fade, 1);
      m.compose(pos, q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.count = visible > 0 ? pieces.length : 0;
    mesh.instanceMatrix.needsUpdate = true;
  };

  return {
    update: (age, origin) => {
      place(paper, paperPieces, age, origin);
      place(foil, foilPieces, age, origin);
    },
    dispose: () => {
      [paper, foil].forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.dispose();
      });
      paperMat.dispose();
      foilMat.dispose();
    },
  };
}
