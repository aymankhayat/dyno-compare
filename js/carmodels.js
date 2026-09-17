// Hand-modeled cars, built in code. Each silhouette is traced by hand as (x, y)
// fractions of the car's overall length and height; the real length, width,
// height and wheelbase come from the manufacturer (js/data.js), so the cars are
// to scale with one another. They are close approximations, not official models.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const IN = 0.0254;
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const bump = (v, c, w) => Math.exp(-(((v - c) / w) ** 2));

// top:        silhouette from the front bumper, over the roof, to the rear bumper
// frontShare: share of the total overhang (length minus wheelbase) ahead of the front axle
// cowl/wsTop: windshield base and top; roofEnd/glassEnd: rear glass top and bottom
// dlo:        side-window span; belt: beltline height; roof: roof width vs. body
// ends/hipF/hipR: plan-view taper at the bumpers and fender bulges front/rear
export const MODELS = {
  gr86: {
    top: [[0.02, 0.25], [0.004, 0.33], [0, 0.39], [0.02, 0.46], [0.07, 0.51], [0.16, 0.55], [0.26, 0.59], [0.355, 0.635], [0.49, 0.955], [0.56, 1], [0.65, 0.975], [0.79, 0.79], [0.87, 0.745], [0.955, 0.752], [0.995, 0.70], [1, 0.47], [0.992, 0.30]],
    frontShare: 0.43, r: 0.318, clear: 5.1, cowl: 0.355, wsTop: 0.49, roofEnd: 0.66, glassEnd: 0.79, dlo: [0.385, 0.765], belt: 0.655,
    roof: 0.64, ends: 0.28, hipF: 0.035, hipR: 0.05, spokes: 10, caliper: '#b3121c', lights: 'gr86',
  },
  supra: {
    top: [[0.022, 0.24], [0.006, 0.31], [0, 0.37], [0.025, 0.44], [0.08, 0.50], [0.18, 0.545], [0.30, 0.59], [0.425, 0.65], [0.55, 0.96], [0.615, 1], [0.70, 0.965], [0.82, 0.79], [0.905, 0.75], [0.965, 0.756], [0.997, 0.69], [1, 0.46], [0.992, 0.28]],
    frontShare: 0.47, r: 0.333, clear: 4.7, cowl: 0.425, wsTop: 0.55, roofEnd: 0.70, glassEnd: 0.82, dlo: [0.455, 0.775], belt: 0.665,
    roof: 0.6, ends: 0.32, hipF: 0.03, hipR: 0.075, spokes: 5, caliper: '#b3121c', lights: 'supra',
  },
  grcorolla: {
    top: [[0.02, 0.24], [0.004, 0.32], [0, 0.40], [0.03, 0.47], [0.10, 0.51], [0.22, 0.545], [0.30, 0.575], [0.455, 0.945], [0.54, 1], [0.80, 0.975], [0.875, 0.965], [0.935, 0.76], [0.975, 0.64], [1, 0.52], [1, 0.37], [0.992, 0.26]],
    frontShare: 0.55, r: 0.323, clear: 5.3, cowl: 0.30, wsTop: 0.455, roofEnd: 0.84, glassEnd: 0.935, dlo: [0.325, 0.85], belt: 0.6,
    roof: 0.72, ends: 0.2, hipF: 0.065, hipR: 0.075, spokes: 15, caliper: '#b3121c', lights: 'grcorolla', wing: true, exhausts: 3,
  },
  m3: {
    top: [[0.018, 0.25], [0.004, 0.33], [0, 0.41], [0.025, 0.48], [0.12, 0.53], [0.26, 0.575], [0.32, 0.60], [0.46, 0.955], [0.545, 1], [0.655, 0.975], [0.80, 0.725], [0.925, 0.705], [0.99, 0.68], [1, 0.46], [0.992, 0.28]],
    frontShare: 0.43, r: 0.343, clear: 4.7, cowl: 0.32, wsTop: 0.46, roofEnd: 0.66, glassEnd: 0.80, dlo: [0.345, 0.79], belt: 0.62,
    roof: 0.72, ends: 0.2, hipF: 0.045, hipR: 0.05, spokes: 5, caliper: '#1f4fb4', lights: 'm3', kidneys: true,
  },
  p911: {
    top: [[0.02, 0.23], [0.004, 0.30], [0, 0.36], [0.03, 0.43], [0.10, 0.50], [0.20, 0.575], [0.32, 0.625], [0.46, 0.965], [0.52, 1], [0.62, 0.955], [0.74, 0.84], [0.86, 0.715], [0.94, 0.655], [0.985, 0.64], [1, 0.56], [1, 0.40], [0.992, 0.27]],
    frontShare: 0.45, r: 0.345, clear: 4.4, cowl: 0.32, wsTop: 0.46, roofEnd: 0.60, glassEnd: 0.80, dlo: [0.345, 0.70], belt: 0.64,
    roof: 0.6, ends: 0.3, hipF: 0.03, hipR: 0.095, spokes: 5, caliper: '#15181b', lights: 'p911', rearEngine: true,
  },
  ioniq5n: {
    top: [[0.016, 0.22], [0.004, 0.30], [0, 0.38], [0.02, 0.47], [0.08, 0.52], [0.20, 0.565], [0.27, 0.595], [0.42, 0.95], [0.49, 1], [0.90, 0.985], [0.96, 0.975], [0.985, 0.72], [1, 0.55], [1, 0.35], [0.992, 0.22]],
    frontShare: 0.45, r: 0.363, clear: 5.2, cowl: 0.27, wsTop: 0.42, roofEnd: 0.93, glassEnd: 0.978, dlo: [0.29, 0.90], belt: 0.6,
    roof: 0.8, ends: 0.14, hipF: 0.03, hipR: 0.035, spokes: 12, caliper: '#c0161f', lights: 'ioniq', electric: true,
  },
};

export const MODEL_KEYS = Object.keys(MODELS);

// Weld and smooth an extruded slab after its width has been reshaped.
function sculpt(geo, fn) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) * fn(pos.getX(i), pos.getY(i)));
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  const merged = mergeVertices(geo, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

// A grid surface from a (u, v) -> [x, y, z] function, used for glass that
// follows the body's curvature.
function ribbon(nu, nv, fn) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) pos.push(...fn(i / nu, j / nv));
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + nv + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let shadowTex;
let glowTex;

export function buildCar(key, { dims, paint = '#9fd3c7', accent = '#6cf0c2' } = {}) {
  const m = MODELS[key] ?? MODELS.m3;
  const L = dims.L * IN;
  const W = dims.W * IN;
  const H = dims.H * IN;
  const wb = dims.wb * IN;
  const clear = (dims.clear ?? m.clear) * IN;
  const r = m.r;
  const half = L / 2;
  const hw = W / 2;
  const beltY = m.belt * H;
  const fxA = (L - wb) * m.frontShare;       // axle positions, 0..L from the nose
  const rxA = fxA + wb;
  const Fx = fxA - half;                       // same, centered on the car
  const Rx = rxA - half;

  // Silhouette samples (0..L) and lookups along them.
  const samples = new THREE.SplineCurve(m.top.map(([x, y]) => new THREE.Vector2(x * L, y * H))).getSpacedPoints(240);
  const n = samples.length - 1;
  const crossX = (y, from, to) => {
    for (let i = from + 1; i <= to; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
    }
    return null;
  };
  const upper = samples.filter((p) => p.y > 0.5 * H);
  const topAt = (x) => {
    for (let i = 1; i < upper.length; i++) {
      const a = upper[i - 1];
      const b = upper[i];
      if ((a.x - x) * (b.x - x) <= 0 && Math.abs(b.x - a.x) > 1e-6) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
    return 0.6 * H;
  };
  const frontAt = (y) => (crossX(y, 0, Math.floor(n * 0.35)) ?? 0) - half;
  const rearAt = (y) => (crossX(y, Math.floor(n * 0.6), n) ?? L) - half;

  // Width profile: plan-view taper, greenhouse tumblehome, fender bulges, sill tuck.
  const hipMax = Math.max(m.hipF, m.hipR);
  const f = (x, y) => {
    const ends = smooth(0.42, 1, Math.abs(x) / half);
    const green = smooth(beltY - 0.02, H, y);
    const shoulder = smooth(beltY - 0.28, beltY, y);
    const sill = smooth(clear + 0.16, clear - 0.02, y);
    const hips = 1 + (m.hipF * bump(x, Fx, 0.55) + m.hipR * bump(x, Rx, 0.6)) * bump(y, r + 0.14, 0.28);
    return ((1 - m.ends * ends) * (1 - (1 - m.roof) * green) * (1 - 0.05 * shoulder) * (1 - 0.1 * sill) * hips) / (1 + hipMax);
  };
  const zAt = (x, y) => hw * f(x, y);

  // ---- Body: one extrusion of the full silhouette with wheel arches cut in ----
  const R = Math.min(r + 0.045, topAt(fxA) - r - 0.06, topAt(rxA) - r - 0.06);
  const d = Math.asin(Math.min(0.99, (r - clear) / R));
  const ax = R * Math.cos(d);
  const shape = new THREE.Shape();
  shape.moveTo(samples[0].x, samples[0].y);
  for (let i = 1; i <= n; i++) shape.lineTo(samples[i].x, samples[i].y);
  shape.lineTo(L - 0.14, clear + 0.03);
  shape.lineTo(rxA + ax, clear);
  shape.absarc(rxA, r, R, -d, Math.PI + d, false);
  shape.lineTo(fxA + ax, clear);
  shape.absarc(fxA, r, R, -d, Math.PI + d, false);
  shape.lineTo(0.14, clear + 0.03);
  shape.closePath();

  const bl = 0.06;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: W - bl * 2, bevelEnabled: true, bevelThickness: bl, bevelSize: 0.045, bevelSegments: 5, curveSegments: 24,
  });
  bodyGeo.translate(-half, 0, -(W - bl * 2) / 2);

  const mats = [];
  const mat = (o) => { mats.push(o); return o; };
  const paintMat = mat(new THREE.MeshPhysicalMaterial({ color: paint, metalness: 0.5, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04 }));
  const glassMat = mat(new THREE.MeshPhysicalMaterial({
    color: 0x05080c, metalness: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  const blackMat = mat(new THREE.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.3, roughness: 0.5 }));
  const chromeMat = mat(new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 1, roughness: 0.2 }));
  const frontLight = mat(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe6f6ff, emissiveIntensity: 2.8 }));
  const rearLight = mat(new THREE.MeshStandardMaterial({ color: 0x2a0000, emissive: 0xff2436, emissiveIntensity: 3 }));

  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  body.add(new THREE.Mesh(sculpt(bodyGeo, f), paintMat));

  // ---- Glass that follows the body ----
  const glass = (geo) => body.add(new THREE.Mesh(geo, glassMat));
  for (const side of [-1, 1]) {
    const xa = m.dlo[0] * L;
    const xb = m.dlo[1] * L;
    glass(ribbon(28, 5, (u, v) => {
      const x = xa + (xb - xa) * u;
      const yBot = beltY + 0.015;
      const yTop = Math.max(yBot + 0.015, topAt(x) - 0.065);
      const y = yBot + (yTop - yBot) * v;
      return [x - half, y, side * (zAt(x - half, y) + 0.005)];
    }));
  }
  const acrossTop = (x0, x1) => glass(ribbon(18, 12, (u, v) => {
    const x = x0 + (x1 - x0) * u;
    const y = topAt(x) + 0.006;
    return [x - half, y, (v * 2 - 1) * zAt(x - half, y) * 0.9];
  }));
  acrossTop(m.cowl * L + 0.04, m.wsTop * L);       // windshield
  acrossTop(m.roofEnd * L, m.glassEnd * L);         // rear glass

  // ---- Mirrors ----
  const mirrorGeo = new THREE.BoxGeometry(0.13, 0.075, 0.11);
  for (const side of [-1, 1]) {
    const x = m.cowl * L + 0.12 - half;
    const y = beltY + 0.045;
    const mir = new THREE.Mesh(mirrorGeo, paintMat);
    mir.position.set(x, y, side * (zAt(x, y) + 0.06));
    body.add(mir);
  }

  // ---- Lights and signature details ----
  const box = (w, h, dz, material, x, y, z, ry = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dz), material);
    b.position.set(x, y, z);
    b.rotation.y = ry;
    body.add(b);
    return b;
  };
  const corner = (y, frac) => zAt(frontAt(y), y) * frac;
  const rcorner = (y, frac) => zAt(rearAt(y), y) * frac;

  switch (m.lights) {
    case 'gr86':
      for (const s of [-1, 1]) {
        box(0.05, 0.05, 0.3, frontLight, frontAt(0.47 * H) + 0.05, 0.47 * H, s * corner(0.47 * H, 0.6), s * 0.35);
        box(0.05, 0.05, 0.28, rearLight, rearAt(0.66 * H) - 0.03, 0.66 * H, s * rcorner(0.66 * H, 0.62), -s * 0.3);
        box(0.05, 0.16, 0.05, rearLight, rearAt(0.6 * H) - 0.04, 0.6 * H, s * rcorner(0.6 * H, 0.84));
      }
      break;
    case 'supra':
      for (const s of [-1, 1]) {
        box(0.05, 0.035, 0.34, frontLight, frontAt(0.5 * H) + 0.07, 0.5 * H, s * corner(0.5 * H, 0.58), s * 0.45);
        box(0.05, 0.06, 0.08, frontLight, frontAt(0.36 * H) + 0.03, 0.36 * H, s * corner(0.36 * H, 0.74));
        box(0.04, 0.03, 0.36, rearLight, rearAt(0.7 * H) - 0.03, 0.7 * H, s * rcorner(0.7 * H, 0.6), -s * 0.4);
      }
      break;
    case 'grcorolla':
      for (const s of [-1, 1]) {
        box(0.05, 0.04, 0.34, frontLight, frontAt(0.47 * H) + 0.05, 0.47 * H, s * corner(0.47 * H, 0.62), s * 0.35);
        box(0.05, 0.05, 0.34, rearLight, rearAt(0.6 * H) - 0.03, 0.6 * H, s * rcorner(0.6 * H, 0.64), -s * 0.25);
      }
      break;
    case 'm3':
      for (const s of [-1, 1]) {
        box(0.05, 0.045, 0.3, frontLight, frontAt(0.47 * H) + 0.05, 0.47 * H, s * corner(0.47 * H, 0.62), s * 0.3);
        box(0.05, 0.05, 0.3, rearLight, rearAt(0.64 * H) - 0.03, 0.64 * H, s * rcorner(0.64 * H, 0.64), -s * 0.3);
        box(0.05, 0.14, 0.05, rearLight, rearAt(0.58 * H) - 0.04, 0.58 * H, s * rcorner(0.58 * H, 0.86));
      }
      break;
    case 'p911': {
      // Round headlights on the front fenders, facing forward and up.
      const disc = new THREE.CylinderGeometry(0.095, 0.095, 0.04, 36).rotateZ(Math.PI / 2 - 0.5);
      const ring = new THREE.TorusGeometry(0.098, 0.012, 8, 36).rotateY(Math.PI / 2).rotateZ(-0.5);
      for (const s of [-1, 1]) {
        const x = -half + 0.26;
        const y = topAt(0.26) - 0.03;
        const lamp = new THREE.Mesh(disc, frontLight);
        lamp.position.set(x, y, s * zAt(x, y) * 0.64);
        const rim = new THREE.Mesh(ring, chromeMat);
        rim.position.copy(lamp.position);
        body.add(lamp, rim);
      }
      const y = 0.62 * H;
      box(0.03, 0.03, 2 * rcorner(y, 0.9), rearLight, rearAt(y) - 0.01, y, 0);   // full-width light bar
      break;
    }
    case 'ioniq': {
      // Parametric-pixel lamps: small squares in a grid.
      const px = new THREE.BoxGeometry(0.02, 0.034, 0.034);
      const front = [];
      const rear = [];
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
          const y = 0.47 * H + j * 0.045;
          front.push([frontAt(y) + 0.01, y, s * (corner(y, 0.46) + i * 0.045)]);
        }
      }
      const cols = Math.floor((rcorner(0.64 * H, 0.86) * 2) / 0.05);
      for (let i = 0; i <= cols; i++) for (let j = 0; j < 2; j++) {
        const y = 0.62 * H + j * 0.045;
        rear.push([rearAt(y) - 0.01, y, -rcorner(0.64 * H, 0.86) + i * 0.05]);
      }
      for (const [list, material] of [[front, frontLight], [rear, rearLight]]) {
        const inst = new THREE.InstancedMesh(px, material, list.length);
        const o = new THREE.Object3D();
        list.forEach(([x, y, z], k) => { o.position.set(x, y, z); o.updateMatrix(); inst.setMatrixAt(k, o.matrix); });
        body.add(inst);
      }
      break;
    }
    default:
      break;
  }

  if (m.kidneys) {
    // BMW's tall twin kidney grille.
    const y = 0.4 * H;
    for (const s of [-1, 1]) {
      const k = box(0.04, 0.26, 0.19, blackMat, frontAt(y) + 0.012, y, s * 0.115);
      k.rotation.z = 0.12;
      box(0.045, 0.27, 0.012, chromeMat, frontAt(y) + 0.01, y, s * 0.21);
      box(0.045, 0.27, 0.012, chromeMat, frontAt(y) + 0.01, y, s * 0.02);
    }
  }
  if (m.wing) {
    const x = m.roofEnd * L - half + 0.05;
    const y = topAt(m.roofEnd * L) + 0.035;
    box(0.3, 0.025, 2 * zAt(x, y) * 0.95, blackMat, x, y, 0);
  }
  if (m.exhausts) {
    const tip = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 20).rotateZ(Math.PI / 2);
    [-0.26, 0, 0.26].forEach((z) => {
      const e = new THREE.Mesh(tip, chromeMat);
      e.position.set(rearAt(clear + 0.13) + 0.02, clear + 0.13, z);
      body.add(e);
    });
  }
  // Lower grille / intake band on the front bumper for every car.
  box(0.03, 0.08, 2 * corner(0.3 * H, 0.62), blackMat, frontAt(0.3 * H) + 0.012, 0.3 * H, 0);

  // ---- Wheels with per-model spokes and brake calipers ----
  const wheels = [];
  const tw = 0.26;
  const tireGeo = new THREE.CylinderGeometry(r, r, tw, 48).rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(r * 0.7, r * 0.7, tw + 0.012, 48).rotateX(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(r * 1.3, m.spokes > 8 ? 0.028 : 0.05, 0.028);
  const ringGeo = new THREE.TorusGeometry(r * 0.72, 0.009, 8, 64);
  const hubGeo = new THREE.CylinderGeometry(r * 0.16, r * 0.16, tw + 0.03, 24).rotateX(Math.PI / 2);
  const caliperGeo = new THREE.BoxGeometry(0.15, 0.1, 0.06);
  const tireMat = mat(new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 }));
  const rimMat = mat(new THREE.MeshStandardMaterial({ color: 0x5f666d, metalness: 0.9, roughness: 0.28 }));
  const ringMat = mat(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2 }));
  const caliperMat = mat(new THREE.MeshStandardMaterial({ color: m.caliper, roughness: 0.4 }));
  for (const x of [Fx, Rx]) {
    for (const side of [-1, 1]) {
      const spin = new THREE.Group();
      spin.add(new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(rimGeo, blackMat), new THREE.Mesh(hubGeo, rimMat));
      for (let k = 0; k < m.spokes; k++) {
        const sp = new THREE.Mesh(spokeGeo, rimMat);
        sp.rotation.z = (k * Math.PI) / m.spokes;
        sp.position.z = side * (tw / 2 + 0.004);
        spin.add(sp);
      }
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = side * (tw / 2 + 0.012);
      spin.add(ring);
      const hold = new THREE.Group();                 // calipers don't spin
      const cal = new THREE.Mesh(caliperGeo, caliperMat);
      cal.position.set(0.12, 0.1, side * (tw / 2 - 0.05));
      hold.add(spin, cal);
      hold.position.set(x, r, side * (hw - tw / 2 - 0.02));
      group.add(hold);
      wheels.push(spin);
    }
  }

  // ---- Contact shadow and slot-colored underglow ----
  shadowTex ??= radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)');
  glowTex ??= radialTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.25, W * 1.9), mat(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  const glowMat = mat(new THREE.MeshBasicMaterial({ map: glowTex, color: accent, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.6, W * 2.6), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.003;
  group.add(glow, shadow);

  const ptX = m.rearEngine ? 0.9 * L : m.cowl * L * 0.55;
  const anchors = {
    powertrain: m.electric
      ? new THREE.Vector3(0, clear + 0.14, hw + 0.03)
      : new THREE.Vector3(ptX - half, topAt(ptX) + 0.02, 0),
    transmission: new THREE.Vector3((m.rearEngine ? Rx - 0.35 : m.cowl * L - half + 0.1), clear + 0.3, hw),
    drivetrain: new THREE.Vector3(Rx, r + 0.02, hw + 0.05),
    weight: new THREE.Vector3(m.electric ? Fx + 0.6 : 0, clear + 0.14, hw + 0.02),
    cabin: new THREE.Vector3(((m.wsTop + m.roofEnd) / 2) * L - half, H + 0.02, 0),
    label: new THREE.Vector3(0, H + 0.55, 0),
  };

  return {
    group,
    wheels,
    radius: r,
    dims: { L, W, H },
    anchors,
    setPaint(hex) { paintMat.color.set(hex); },
    setAccent(hex) {
      ringMat.color.set(hex);
      ringMat.emissive.set(hex);
      glowMat.color.set(hex);
    },
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      mats.forEach((x) => x.dispose());
    },
  };
}

// Contact shadow and slot-colored underglow for any car group (used by real GLB models).
export function groundEffects(group, L, W, accent) {
  shadowTex ??= radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)');
  glowTex ??= radialTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: accent, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.25, W * 1.9), shadowMat);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.6, W * 2.6), glowMat);
  shadow.rotation.x = glow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  glow.position.y = 0.003;
  group.add(glow, shadow);
  return {
    setAccent(hex) { glowMat.color.set(hex); },
    dispose() {
      shadow.geometry.dispose();
      glow.geometry.dispose();
      shadowMat.dispose();
      glowMat.dispose();
    },
  };
}
