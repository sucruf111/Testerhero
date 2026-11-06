import {
  AdditiveBlending,
  BufferAttribute,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  MathUtils,
  type Material,
  Mesh,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl, type ExampleProduct } from "./products";
import { backgroundShader, beamShader, confettiShader, roadShader, shadowShader } from "./shaders";

export type FrameInfo = {
  progress: number;
  /** Produkt, das beim Auslosen gerade vorne steht */
  frontIndex: number;
  /** Wo das Preisschild hingehört (CSS-Pixel): erst unter dem vorderen Platz, dann unter dem Gewinner */
  anchor: { x: number; y: number };
};

export type StoryEngine = {
  setProgress: (p: number) => void;
  /** Platz der Box im Einstieg (Bildschirmkoordinaten -1…1, Breite als Anteil davon) */
  setHeroAnchor: (x: number, y: number, w: number) => void;
  setPointer: (x: number, y: number) => void;
  setActive: (active: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

type Options = {
  canvas: HTMLCanvasElement;
  products: ExampleProduct[];
  winnerIndex: number;
  mobile: boolean;
  onFrame: (info: FrameInfo) => void;
  onReady: () => void;
};

/* ───────────── Hilfsfunktionen für die Zeitachse ───────────── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0 → 1 zwischen a und b */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Stern wie im Logo */
function starShape(outer = 0.5, inner = 0.22) {
  const s = new Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function createStory(opts: Options): StoryEngine {
  const { canvas, products, winnerIndex, mobile } = opts;

  /* ───────────── Renderer ───────────── */
  const maxDpr = mobile ? 1.5 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const renderer = new WebGLRenderer({
    canvas,
    antialias: dpr < 1.5,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  let disposed = false;
  const camera = new PerspectiveCamera(35, 1, 0.1, 60);

  // Umgebungslicht für schöne Reflexionen, einmalig berechnet
  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmrem.dispose();

  // weiches Führungslicht von oben rechts, damit die Produkte Form bekommen
  const keyLight = new DirectionalLight("#fff6ec", 1.1);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  const materials: MeshStandardMaterial[] = [];
  const mat = (color: string, o: { rough?: number; metal?: number; emissive?: string; glow?: number } = {}) => {
    const m = new MeshStandardMaterial({
      color: new Color(color),
      roughness: o.rough ?? 0.45,
      metalness: o.metal ?? 0,
      emissive: o.emissive ? new Color(o.emissive) : new Color(0x000000),
      emissiveIntensity: o.glow ?? 0,
      envMapIntensity: 0.9,
    });
    materials.push(m);
    return m;
  };

  /* ───────────── Hintergrund (eigener Shader) ───────────── */
  const bgMat = new ShaderMaterial({
    vertexShader: backgroundShader.vertex,
    fragmentShader: backgroundShader.fragment,
    uniforms: { uTime: { value: 0 }, uRes: { value: [1, 1] }, uWarm: { value: 0 }, uShift: { value: 0 } },
    depthWrite: false,
    depthTest: false,
  });
  const bg = new Mesh(new PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false;
  bg.renderOrder = -10;
  scene.add(bg);

  /* ───────────── Die Box ───────────── */
  const coral = mat("#ff5a36", { rough: 0.32 });
  const coralDark = mat("#f0471f", { rough: 0.32 });
  const ribbon = mat("#fff7f1", { rough: 0.45 });

  const box = new Group();
  scene.add(box);

  const body = new Mesh(new RoundedBoxGeometry(1.5, 1.1, 1.5, 5, 0.09), coral);
  box.add(body);
  const ribbonA = new Mesh(new RoundedBoxGeometry(1.53, 1.12, 0.24, 2, 0.02), ribbon);
  const ribbonB = new Mesh(new RoundedBoxGeometry(0.24, 1.12, 1.53, 2, 0.02), ribbon);
  box.add(ribbonA, ribbonB);

  // leuchtende Öffnung, sichtbar wenn der Deckel ab ist
  const glowMat = new MeshStandardMaterial({ color: "#ffd66b", emissive: new Color("#ffcf5a"), emissiveIntensity: 0, roughness: 1 });
  materials.push(glowMat);
  const opening = new Mesh(new PlaneGeometry(1.32, 1.32), glowMat);
  opening.rotation.x = -Math.PI / 2;
  opening.position.y = 0.552;
  box.add(opening);

  const lid = new Group();
  const lidBody = new Mesh(new RoundedBoxGeometry(1.64, 0.32, 1.64, 5, 0.08), coralDark);
  const lidRibbonA = new Mesh(new RoundedBoxGeometry(1.67, 0.34, 0.24, 2, 0.02), ribbon);
  const lidRibbonB = new Mesh(new RoundedBoxGeometry(0.24, 0.34, 1.67, 2, 0.02), ribbon);
  const bow = new Mesh(
    new ExtrudeGeometry(starShape(0.42, 0.19), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3 }),
    mat("#ffffff", { rough: 0.25, emissive: "#ffe2a3", glow: 0.12 }),
  );
  bow.geometry.center();
  bow.position.y = 0.52;
  lid.add(lidBody, lidRibbonA, lidRibbonB, bow);
  const lidClosedY = 0.69;
  lid.position.y = lidClosedY;
  box.add(lid);

  /* ───────────── Schatten, Straße, Lichtkegel ───────────── */
  const shadowMat = new ShaderMaterial({
    vertexShader: shadowShader.vertex,
    fragmentShader: shadowShader.fragment,
    uniforms: { uOpacity: { value: 0.35 } },
    transparent: true,
    depthWrite: false,
  });
  const shadow = new Mesh(new PlaneGeometry(2.8, 2.8), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const roadMat = new ShaderMaterial({
    vertexShader: roadShader.vertex,
    fragmentShader: roadShader.fragment,
    uniforms: { uOpacity: { value: 0 }, uOffset: { value: 0 } },
    transparent: true,
    depthWrite: false,
  });
  const road = new Mesh(new PlaneGeometry(14, 2.2), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.renderOrder = -1;
  scene.add(road);

  const beamMat = new ShaderMaterial({
    vertexShader: beamShader.vertex,
    fragmentShader: beamShader.fragment,
    uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const beam = new Mesh(new CylinderGeometry(1.5, 0.6, 3.6, 48, 1, true), beamMat);
  beam.visible = false;
  scene.add(beam);

  /* ───────────── Konfetti ───────────── */
  const confettiCount = mobile ? 70 : 160;
  const cGeo = new BufferGeometry();
  const palette = ["#ff5a36", "#ffc23d", "#8b7cf6", "#4fd1a5", "#5cb8f7", "#ffffff"].map((c) => new Color(c));
  const aDir = new Float32Array(confettiCount * 3);
  const aColor = new Float32Array(confettiCount * 3);
  const aSpeed = new Float32Array(confettiCount);
  const aSize = new Float32Array(confettiCount);
  const aSeed = new Float32Array(confettiCount);
  for (let i = 0; i < confettiCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const up = 0.55 + Math.random() * 0.45;
    const spread = Math.sqrt(1 - up * up);
    aDir.set([Math.cos(theta) * spread, up, Math.sin(theta) * spread], i * 3);
    const c = palette[i % palette.length];
    // Shader gibt Farben direkt aus: sRGB-Werte verwenden
    const s = c.clone().convertLinearToSRGB();
    aColor.set([s.r, s.g, s.b], i * 3);
    aSpeed[i] = 1.6 + Math.random() * 2.4;
    aSize[i] = 5 + Math.random() * 5;
    aSeed[i] = Math.random();
  }
  cGeo.setAttribute("position", new BufferAttribute(new Float32Array(confettiCount * 3), 3));
  cGeo.setAttribute("aDir", new BufferAttribute(aDir, 3));
  cGeo.setAttribute("aColor", new BufferAttribute(aColor, 3));
  cGeo.setAttribute("aSpeed", new BufferAttribute(aSpeed, 1));
  cGeo.setAttribute("aSize", new BufferAttribute(aSize, 1));
  cGeo.setAttribute("aSeed", new BufferAttribute(aSeed, 1));
  const confettiMat = new ShaderMaterial({
    vertexShader: confettiShader.vertex,
    fragmentShader: confettiShader.fragment,
    uniforms: {
      uBurst: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uOrigin: { value: new Vector3(0, 0.6, 0) },
    },
    transparent: true,
    depthWrite: false,
  });
  const confetti = new Points(cGeo, confettiMat);
  confetti.frustumCulled = false;
  scene.add(confetti);

  /* ───────────── Produkte im Glücksrad (echte 3D-Modelle) ───────────── */
  const ring = new Group();
  scene.add(ring);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const loadedMaterials = new Set<Material>();
  const items = products.map((p) => {
    const holder = new Group();
    const obj = new Group(); // dreht sich, enthält das Modell, sobald es geladen ist
    holder.add(obj);
    ring.add(holder);
    loader
      .loadAsync(modelUrl(p))
      .then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        // auf Größe 1 bringen und mittig ausrichten
        const bounds = new Box3().setFromObject(model);
        const size = bounds.getSize(new Vector3());
        const center = bounds.getCenter(new Vector3());
        const scale = 1 / Math.max(size.x, size.y, size.z);
        model.position.copy(center).multiplyScalar(-scale);
        model.scale.setScalar(scale);
        // Vorderseite nach vorn drehen (um die eigene Mitte)
        const front = new Group();
        front.rotation.y = p.yaw ?? 0;
        front.add(model);
        model.traverse((o) => {
          const m = (o as Mesh).material as MeshStandardMaterial | undefined;
          if (!m) return;
          loadedMaterials.add(m);
          // spiegelndes Glas würde das Ziffernblatt verdecken
          if (/glass/i.test(m.name)) {
            m.metalness = 0;
            m.roughness = 0.05;
            m.transparent = true;
            m.opacity = 0.18;
            m.depthWrite = false;
          }
        });
        obj.add(front);
      })
      .catch((error) => console.warn("Modell nicht geladen:", p.id, error));
    return { holder, obj };
  });
  const n = items.length;
  const ringRadius = mobile ? 1.85 : 2.5;
  const itemScale = mobile ? 1.0 : 1.02;
  const turns = 3;
  const spinFinal = -(winnerIndex * (Math.PI * 2)) / n - turns * Math.PI * 2;
  const winner = items[winnerIndex];
  // fester Punkt vorne im Rad: dort steht das Preisschild, während das Rad dreht
  const frontSlot = new Group();
  frontSlot.position.set(0, 0, ringRadius);
  ring.add(frontSlot);

  // Ring-Transformation ist fest: Weltpunkte einmal in Ring-Koordinaten umrechnen
  const RING_Y = 0.25;
  const RING_TILT = 0.16;
  const toRing = (x: number, y: number, z: number) =>
    new Vector3(x, y - RING_Y, z).applyAxisAngle(new Vector3(1, 0, 0), -RING_TILT);
  const PATH = {
    front: new Vector3(0, 0.15, ringRadius * 0.9),
    above: toRing(0, 1.75, 0),
    inside: toRing(0, 0.1, 0),
    top: toRing(0, 2.1, 0.25),
  };

  /* ───────────── Sterne (Bewerten) ───────────── */
  const starGeo = new ExtrudeGeometry(starShape(0.5, 0.22), {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  starGeo.center();
  const starOn = mat("#ffc23d", { rough: 0.25, metal: 0.1, emissive: "#ffb000", glow: 0.25 });
  const starOff = mat("#d4cbef", { rough: 0.45 });
  const stars = Array.from({ length: 5 }, (_, i) => {
    const m = new Mesh(starGeo, starOff);
    m.visible = false;
    scene.add(m);
    return {
      mesh: m,
      from: new Vector3((Math.random() - 0.5) * 8, 5 + Math.random() * 2, (Math.random() - 0.5) * 2),
      index: i,
    };
  });

  /* ───────────── Zustand ───────────── */
  const timer = new Timer();
  let target = 0;
  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let px = 0;
  let py = 0;
  let width = 1;
  let height = 1;
  let active = false;
  let raf = 0;
  let readySent = false;
  let slowFrames = 0;
  let frames = 0;
  const tmp = new Vector3();
  const lookAt = new Vector3();
  let heroAnchor: { x: number; y: number; w: number } | null = null;
  const heroPos = new Vector3(1.9, -0.05, 0);
  let heroScale = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uRes.value = [width, height];
    placeHero();
  }

  /** Box im Einstieg genau dorthin setzen, wo im Layout ihr Platz ist */
  function placeHero() {
    const portrait = camera.aspect < 0.9;
    if (!heroAnchor) {
      heroPos.set(portrait ? 0 : Math.min(1.9, 1.15 * camera.aspect), portrait ? -1.25 : -0.05, 0);
      heroScale = 1;
      return;
    }
    const f0 = portrait ? -0.3 : 0.25;
    camera.position.set(0, f0 + 0.5, cameraDistance());
    camera.lookAt(0, f0, 0);
    camera.updateMatrixWorld();
    const onPlane = (nx: number, ny: number) => {
      const dir = new Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      return camera.position.clone().addScaledVector(dir, -camera.position.z / dir.z);
    };
    const { x, y, w } = heroAnchor;
    const worldWidth = onPlane(x - w / 2, y).distanceTo(onPlane(x + w / 2, y));
    heroScale = MathUtils.clamp(worldWidth / 2.4, 0.55, 1.15);
    // Ursprung der Box liegt in ihrer Mitte, Deckel und Stern ragen nach oben
    heroPos.copy(onPlane(x, y));
    heroPos.y -= 0.3 * heroScale;
  }

  /** Kameraabstand so wählen, dass das Glücksrad auch im Hochformat passt */
  function cameraDistance() {
    const halfTan = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const needHalfWidth = ringRadius + (mobile ? 0.62 : 0.9);
    const byWidth = needHalfWidth / (halfTan * camera.aspect);
    return Math.max(mobile ? 10.5 : 9.5, byWidth);
  }

  function update(p: number, t: number) {
    const aspect = camera.aspect;
    const portrait = aspect < 0.9;

    /* Phase 0: Hero ─ Box schwebt neben dem Text */
    const heroOut = easeInOut(seg(p, 0.02, 0.13));
    const sizeNow = MathUtils.lerp(heroScale, 1, heroOut);

    /* Phase 1: Auslosen (0.13 – 0.38) */
    const ringIn = easeBack(seg(p, 0.13, 0.2));
    const spinT = easeOut(seg(p, 0.15, 0.34));
    const spin = spinFinal * spinT + (1 - ringIn) * 0.6;
    const pick = easeInOut(seg(p, 0.33, 0.39));

    /* Phase 2: Unterwegs (0.38 – 0.58) */
    const lidUp1 = easeOut(seg(p, 0.38, 0.42));
    const drop = easeInOut(seg(p, 0.4, 0.46));
    const lidDown = easeOut(seg(p, 0.45, 0.49));
    const travel = seg(p, 0.48, 0.58);
    const roadIn = seg(p, 0.46, 0.5) * (1 - seg(p, 0.57, 0.61));

    /* Phase 3: Auspacken (0.58 – 0.82) */
    const lidOff = easeOut(seg(p, 0.6, 0.68));
    const beamIn = seg(p, 0.6, 0.66) * (1 - seg(p, 0.92, 0.99));
    const rise = easeOut(seg(p, 0.63, 0.73));
    const burst = seg(p, 0.61, 0.8);

    /* Phase 4: Bewerten (0.82 – 1) */
    const rate = seg(p, 0.82, 1);

    // ── Box ──
    const idleYaw = t * 0.25;
    const unbox = easeInOut(seg(p, 0.56, 0.64));
    const storyYaw = -0.55 + Math.sin(travel * Math.PI) * 0.45 + Math.sin(t * 0.35) * 0.1 * unbox;
    const yaw = MathUtils.lerp(0.5 + Math.sin(idleYaw) * 0.6, storyYaw, heroOut) + px * 0.35;
    const hop = Math.abs(Math.sin(travel * Math.PI * 3)) * 0.45 * (travel > 0 && travel < 1 ? 1 : 0);
    const squash = 1 - Math.max(0, 0.12 - hop) * (travel > 0 && travel < 1 ? 1.2 : 0);
    box.position.set(
      MathUtils.lerp(heroPos.x, 0, heroOut),
      MathUtils.lerp(heroPos.y, 0, heroOut) + Math.sin(t * 1.3) * 0.06 * (1 - travel * (1 - travel) * 4) + hop,
      0,
    );
    // Stern-Schleife bleibt der Kamera zugewandt, sonst sieht man sie manchmal nur von der Kante
    bow.rotation.y = -yaw * 0.9;
    box.rotation.set(
      MathUtils.lerp(-0.12, 0.2, unbox) + py * 0.15 + Math.sin(travel * Math.PI * 6) * 0.06,
      yaw,
      Math.sin(travel * Math.PI * 3) * 0.08,
    );
    box.scale.set(sizeNow / Math.sqrt(squash), sizeNow * squash, sizeNow / Math.sqrt(squash));

    // ── Deckel: kurz auf zum Einlegen, dann ganz ab beim Auspacken ──
    const lift = lidUp1 * (1 - lidDown) * 0.85;
    const fling = seg(p, 0.6, 0.71);
    lid.visible = fling < 1;
    lid.position.set(
      -Math.pow(fling, 1.6) * 7,
      lidClosedY + lift + Math.sin(fling * Math.PI * 0.75) * 2.4,
      -fling * 0.8,
    );
    lid.rotation.set(-lift * 0.5 - fling * 1.2, fling * 2.5, fling * 1.6);
    glowMat.emissiveIntensity = Math.max(lift, lidOff) * 2.2;

    // ── Schatten und Straße ──
    shadow.position.set(box.position.x, MathUtils.lerp(heroPos.y - 0.62 * heroScale, -0.62, heroOut), 0);
    const shadowScale = 1 - hop * 0.6;
    shadow.scale.setScalar(shadowScale * sizeNow);
    shadowMat.uniforms.uOpacity.value = 0.38 * shadowScale;
    road.position.set(0, -0.63, 0);
    roadMat.uniforms.uOpacity.value = roadIn;
    roadMat.uniforms.uOffset.value = travel * 7;

    // ── Lichtkegel und Konfetti ──
    beam.visible = beamIn > 0.001;
    beam.position.set(box.position.x, box.position.y + 2.35, 0);
    beamMat.uniforms.uOpacity.value = beamIn;
    beamMat.uniforms.uTime.value = t;
    confettiMat.uniforms.uBurst.value = burst;
    confettiMat.uniforms.uTime.value = t;
    (confettiMat.uniforms.uOrigin.value as Vector3).set(box.position.x, box.position.y + 0.7, 0);
    bgMat.uniforms.uWarm.value = beamIn;
    bgMat.uniforms.uShift.value = p;

    // ── Glücksrad ──
    ring.position.set(0, RING_Y, 0);
    ring.rotation.x = RING_TILT;
    let frontIndex = 0;
    let best = Infinity;
    items.forEach((it, i) => {
      const angle = (i / n) * Math.PI * 2 + spin;
      const isWinner = i === winnerIndex;
      // Abstand zur Vorderseite (Winkel 0)
      const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
      if (Math.abs(wrapped) < best) {
        best = Math.abs(wrapped);
        frontIndex = i;
      }
      let s = itemScale * ringIn;
      const pos = tmp.set(Math.sin(angle) * ringRadius, 0, Math.cos(angle) * ringRadius);

      if (!isWinner) {
        s *= 1 - pick;
        it.holder.position.copy(pos);
      } else {
        // Gewinner: nach vorne, dann über die Box, hinein, später wieder heraus.
        // Alle Punkte liegen in Ring-Koordinaten (der Ring ist leicht gekippt).
        const p1 = pos.clone().lerp(PATH.front, pick);
        let place = p1;
        if (drop > 0) {
          const firstHalf = Math.min(1, drop * 2);
          const secondHalf = Math.max(0, drop * 2 - 1);
          place = PATH.front.clone().lerp(PATH.above, firstHalf).lerp(PATH.inside, secondHalf);
        }
        if (rise > 0) place = PATH.inside.clone().lerp(PATH.top, rise);
        it.holder.position.copy(place);
        const shrink = drop > 0 && rise === 0 ? 1 - Math.max(0, drop * 2 - 1) * 0.85 : 1;
        s = itemScale * Math.max(ringIn, pick) * (1 + pick * 0.35) * shrink;
        if (rise > 0) s = itemScale * (0.3 + rise * 1.3);
        // sichtbar nur bis in die Box hinein und wieder ab dem Auspacken
        it.holder.visible = !(drop >= 1 && rise === 0);
      }
      it.holder.scale.setScalar(Math.max(0.0001, s));
      // Die Vorderseite der Verpackung zeigt zur Kamera, die Produkte schwingen nur leicht:
      // so bleibt das Etikett lesbar und man erkennt das Produkt sofort
      const revealed = isWinner && rise > 0;
      it.obj.rotation.y = -0.25 + Math.sin(t * (revealed ? 0.6 : 0.7) + i * 1.3) * (revealed ? 0.35 : 0.45);
      it.obj.rotation.x = 0.06 + Math.sin(t * 0.8 + i) * 0.05;
    });

    // ── Sterne ──
    const halfTan = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const camDist = camera.position.distanceTo(lookAt);
    const halfWidth = halfTan * camDist * aspect;
    const arc = Math.min(1.5, halfWidth * 0.62);
    stars.forEach((st) => {
      const local = seg(rate, st.index * 0.1, 0.45 + st.index * 0.1);
      const fill = seg(rate, 0.5 + st.index * 0.07, 0.58 + st.index * 0.07);
      st.mesh.visible = local > 0;
      const xNorm = (st.index - 2) / 2;
      const targetPos = new Vector3(xNorm * arc, 3.4 - Math.abs(xNorm) * 0.25, 0.4);
      st.mesh.position.copy(st.from).lerp(targetPos, easeOut(local));
      st.mesh.rotation.set(0, (1 - easeOut(local)) * 6 + Math.sin(t * 2 + st.index) * 0.15, 0);
      const pop = fill > 0 ? 1 + Math.sin(fill * Math.PI) * 0.35 : 1;
      st.mesh.scale.setScalar(0.42 * easeBack(local) * pop);
      st.mesh.material = fill > 0.01 ? starOn : starOff;
    });

    // ── Kamera ──
    const dist = cameraDistance();
    // im Hochformat ist die letzte Textkarte höher: Szene dann etwas kleiner und weiter oben zeigen
    const rateFit = portrait ? easeInOut(seg(p, 0.8, 0.9)) : 0;
    const focusY = MathUtils.lerp(MathUtils.lerp(portrait ? -0.3 : 0.25, 1.15, easeInOut(seg(p, 0.58, 0.85))), 0.45, rateFit);
    // beim Auspacken ist das Rad weg: im Hochformat näher ran, damit das Produkt groß zu sehen ist
    const zoom = MathUtils.lerp(dist, dist * (portrait ? MathUtils.lerp(0.74, 0.96, rateFit) : 1.1), easeInOut(seg(p, 0.56, 0.7)));
    camera.position.set(px * 0.4, focusY + 0.5 + roadIn * dist * 0.12 + py * 0.25, zoom);
    lookAt.set(0, focusY, 0);
    camera.lookAt(lookAt);

    return { frontIndex };
  }

  function frame(now?: number) {
    raf = requestAnimationFrame(frame);
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    // weich zur Scroll-Position gleiten
    progress += (target - progress) * Math.min(1, dt * 7);
    if (Math.abs(target - progress) < 0.0003) progress = target;
    px += (pointerX - px) * Math.min(1, dt * 3);
    py += (pointerY - py) * Math.min(1, dt * 3);
    bgMat.uniforms.uTime.value = t;

    const { frontIndex } = update(progress, t);
    renderer.render(scene, camera);

    // Preisschild: beim Drehen unter dem vorderen Platz, danach unter dem Gewinner
    const atFront = progress < 0.33;
    (atFront ? frontSlot : winner.holder).getWorldPosition(tmp);
    tmp.y -= (atFront ? itemScale : winner.holder.scale.x) * 0.62;
    tmp.project(camera);
    opts.onFrame({
      progress,
      frontIndex,
      anchor: { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height },
    });

    if (!readySent) {
      readySent = true;
      opts.onReady();
    }

    // Qualität automatisch senken, wenn das Gerät nicht hinterherkommt
    frames++;
    if (dt > 1 / 40) slowFrames++;
    if (frames === 90) {
      if (slowFrames > 45 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.35);
        renderer.setPixelRatio(dpr);
        confettiMat.uniforms.uPixelRatio.value = dpr;
        resize();
      }
      frames = 0;
      slowFrames = 0;
    }
  }

  resize();

  return {
    setProgress: (p) => {
      target = clamp01(p);
    },
    setHeroAnchor: (x, y, w) => {
      heroAnchor = { x, y, w };
      placeHero();
    },
    setPointer: (x, y) => {
      pointerX = x;
      pointerY = y;
    },
    setActive: (next) => {
      if (next === active) return;
      active = next;
      if (active) {
        timer.reset();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    },
    resize,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      loadedMaterials.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v && typeof v === "object" && "isTexture" in v) (v as { dispose: () => void }).dispose();
        });
        m.dispose();
      });
      timer.dispose();
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose?.();
      });
      materials.forEach((m) => m.dispose());
      [bgMat, shadowMat, roadMat, beamMat, confettiMat].forEach((m) => m.dispose());
      envTexture.dispose();
      renderer.dispose();
    },
  };
}
