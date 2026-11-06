/* Eigene Shader für die TesterHero-Szene. Alle Farben sind bereits sRGB-Werte. */

const SIMPLEX = /* glsl */ `
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

/** Bildschirmfüllender, lebendiger Farbverlauf in Markenfarben */
export const backgroundShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.999, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uWarm;
    uniform float uShift;
    varying vec2 vUv;
    ${SIMPLEX}
    void main() {
      vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.045;
      float n1 = snoise(p * 1.1 + vec2(t, -t * 0.7) + vec2(0.0, uShift * 0.6));
      float n2 = snoise(p * 1.9 - vec2(t * 0.6, t * 0.9) + n1 * 0.45);
      float n3 = snoise(p * 0.7 + vec2(-t * 0.4, t * 0.3) - vec2(uShift * 0.4, 0.0));

      vec3 cream = vec3(0.955, 0.918, 0.880);
      vec3 coral = vec3(0.965, 0.770, 0.700);
      vec3 sun   = vec3(0.970, 0.865, 0.660);
      vec3 lilac = vec3(0.835, 0.815, 0.945);

      vec3 col = cream;
      col = mix(col, coral, smoothstep(0.05, 0.95, n1 * 0.5 + 0.5) * 0.6);
      col = mix(col, lilac, smoothstep(0.35, 1.0, n2 * 0.5 + 0.5) * 0.55);
      col = mix(col, sun,   smoothstep(0.45, 1.0, n3 * 0.5 + 0.5) * 0.5);

      // warmes Leuchten beim Auspacken
      float d = length(p - vec2(0.0, 0.08));
      col = mix(col, vec3(1.0, 0.95, 0.86), uWarm * smoothstep(0.95, 0.0, d) * 0.6);

      col *= 1.0 - 0.12 * length(p);
      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      col += (grain - 0.5) * 0.022;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/** Lichtkegel, der aus der geöffneten Box strahlt */
export const beamShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    varying float vFacing;
    void main() {
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      vFacing = abs(dot(n, normalize(-mv.xyz)));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    uniform float uOpacity;
    uniform float uTime;
    varying vec2 vUv;
    varying float vFacing;
    void main() {
      float fade = pow(1.0 - vUv.y, 1.4);
      float edge = pow(vFacing, 1.6);
      float rays = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 1.5) * sin(vUv.x * 17.0 - uTime);
      vec3 col = mix(vec3(1.0, 0.9, 0.66), vec3(1.0, 0.97, 0.93), vUv.y);
      gl_FragColor = vec4(col, fade * edge * rays * uOpacity * 0.38);
    }
  `,
};

/** Weicher Schatten unter der Box */
export const shadowShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float d = length(vUv - 0.5) * 2.0;
      float a = smoothstep(1.0, 0.0, d);
      gl_FragColor = vec4(0.16, 0.12, 0.2, a * a * uOpacity);
    }
  `,
};

/** Straße mit Mittelstreifen für den Versand-Schritt */
export const roadShader = {
  vertex: shadowShader.vertex,
  fragment: /* glsl */ `
    uniform float uOpacity;
    uniform float uOffset;
    varying vec2 vUv;
    void main() {
      float edgeFade = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
      float band = smoothstep(0.42, 0.47, vUv.y) * smoothstep(0.58, 0.53, vUv.y);
      float dash = step(0.5, fract(vUv.x * 9.0 + uOffset));
      float road = smoothstep(0.08, 0.16, vUv.y) * smoothstep(0.92, 0.84, vUv.y);
      vec3 col = mix(vec3(0.17, 0.16, 0.26), vec3(1.0), band * dash);
      float a = (road * 0.10 + band * dash * 0.75) * edgeFade * uOpacity;
      gl_FragColor = vec4(col, a);
    }
  `,
};
