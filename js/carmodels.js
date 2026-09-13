// Stylized 3D cars built in code from a side profile per body style.
// Deliberately generic (not any maker's design) and not to scale between models.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Pull an extruded slab into a car-like volume: scale each vertex's width (z)
// by fn(x, y), then weld and smooth the normals.
function sculpt(geo, fn) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) * fn(pos.getX(i), pos.getY(i)));
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  const merged = mergeVertices(geo, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

// Units are meters. x runs nose (0) to tail (L); fractions are of L.
const STYLES = {
  sedan:     { L: 4.75, W: 1.84, wb: 2.78, r: 0.33, clear: 0.14, nose: 0.62, belt: 0.88, tailTop: 0.92, roof: 1.43, cowl: 0.34, wsTop: 0.47, roofEnd: 0.64, glassEnd: 0.80, roofDrop: 0.03, fo: 0.95 },
  liftback:  { L: 4.60, W: 1.78, wb: 2.75, r: 0.33, clear: 0.14, nose: 0.58, belt: 0.84, tailTop: 0.93, roof: 1.42, cowl: 0.29, wsTop: 0.49, roofEnd: 0.55, glassEnd: 0.93, roofDrop: 0.05, fo: 0.92 },
  coupe:     { L: 4.35, W: 1.83, wb: 2.55, r: 0.34, clear: 0.12, nose: 0.56, belt: 0.80, tailTop: 0.85, roof: 1.29, cowl: 0.38, wsTop: 0.52, roofEnd: 0.60, glassEnd: 0.86, roofDrop: 0.04, fo: 0.85 },
  fastback:  { L: 4.80, W: 1.92, wb: 2.72, r: 0.35, clear: 0.13, nose: 0.66, belt: 0.88, tailTop: 0.94, roof: 1.38, cowl: 0.40, wsTop: 0.54, roofEnd: 0.62, glassEnd: 0.88, roofDrop: 0.04, fo: 0.90 },
  hatch:     { L: 4.45, W: 1.85, wb: 2.64, r: 0.34, clear: 0.13, nose: 0.64, belt: 0.90, tailTop: 1.00, roof: 1.45, cowl: 0.31, wsTop: 0.44, roofEnd: 0.82, glassEnd: 0.95, roofDrop: 0.07, fo: 0.88 },
  suv:       { L: 4.62, W: 1.86, wb: 2.69, r: 0.37, clear: 0.20, nose: 0.82, belt: 1.05, tailTop: 1.10, roof: 1.68, cowl: 0.30, wsTop: 0.42, roofEnd: 0.86, glassEnd: 0.95, roofDrop: 0.04, fo: 0.92 },
  crossover: { L: 4.72, W: 1.94, wb: 3.00, r: 0.37, clear: 0.16, nose: 0.72, belt: 0.98, tailTop: 1.03, roof: 1.59, cowl: 0.29, wsTop: 0.42, roofEnd: 0.88, glassEnd: 0.97, roofDrop: 0.05, fo: 0.80 },
  roadster:  { L: 3.92, W: 1.73, wb: 2.31, r: 0.31, clear: 0.12, nose: 0.55, belt: 0.80, tailTop: 0.83, roof: 1.12, cowl: 0.40, wsTop: 0.50, roofEnd: 0.50, glassEnd: 0.53, roofDrop: 0, fo: 0.80, open: true },
};

export const BODY_STYLES = Object.keys(STYLES);

function lowerShape(p) {
  const { L, wb, r, clear, nose, belt, tailTop, fo } = p;
  const fx = fo;
  const rx = fo + wb;
  const R = r + 0.06;
  const cy = r;
  const d = Math.asin(Math.min(0.99, (cy - clear) / R));
  const ax = R * Math.cos(d);

  const s = new THREE.Shape();
  s.moveTo(0.14, clear + 0.05);
  s.quadraticCurveTo(0.0, clear + 0.08, 0.02, nose * 0.6);          // front bumper
  s.quadraticCurveTo(0.04, nose + 0.01, 0.34, nose + 0.03);          // nose
  s.lineTo(p.cowl * L, belt);                                         // hood
  s.lineTo(L - 0.26, tailTop);                                        // beltline / deck
  s.quadraticCurveTo(L + 0.02, tailTop - 0.01, L, tailTop - 0.28);    // tail
  s.quadraticCurveTo(L - 0.01, clear + 0.07, L - 0.16, clear + 0.04);
  s.lineTo(rx + ax, clear);
  s.absarc(rx, cy, R, -d, Math.PI + d, false);                        // rear arch
  s.lineTo(fx + ax, clear);
  s.absarc(fx, cy, R, -d, Math.PI + d, false);                        // front arch
  s.closePath();
  return s;
}

// Height of the beltline/deck line at x, so the cabin sits on it.
function beltAt(p, x) {
  const x0 = p.cowl * p.L;
  const x1 = p.L - 0.26;
  const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
  return p.belt + (p.tailTop - p.belt) * t;
}

function cabinShape(p) {
  const { L, roof } = p;
  const x0 = p.cowl * L;
  const xw = p.wsTop * L;
  const xr = p.roofEnd * L;
  const xg = Math.min(p.glassEnd * L, L - 0.24);
  const s = new THREE.Shape();
  if (p.open) {
    // Roadster: a raked windscreen and a low rear deck fairing.
    s.moveTo(x0, p.belt - 0.03);
    s.lineTo(xw, roof);
    s.lineTo(xw + 0.07, roof - 0.02);
    s.lineTo(x0 + 0.34, beltAt(p, x0 + 0.34) - 0.03);
    s.closePath();
    return s;
  }
  s.moveTo(x0, p.belt - 0.03);
  s.quadraticCurveTo(xw - (xw - x0) * 0.25, roof - 0.03, xw, roof);   // windshield
  s.quadraticCurveTo((xw + xr) / 2, roof + 0.02, xr, roof - p.roofDrop);
  s.quadraticCurveTo(xg - (xg - xr) * 0.3, roof - 0.08, xg, beltAt(p, xg) - 0.03);   // rear glass
  s.closePath();
  return s;
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

export function buildCar(style, { paint = '#9fd3c7', accent = '#6cf0c2' } = {}) {
  const p = STYLES[style] ?? STYLES.sedan;
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: paint, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x080b10, metalness: 0.3, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0c0e11, metalness: 0.4, roughness: 0.6 });

  const bl = 0.07;
  const lowerGeo = new THREE.ExtrudeGeometry(lowerShape(p), {
    depth: p.W - bl * 2, bevelEnabled: true, bevelThickness: bl, bevelSize: 0.055, bevelSegments: 5, curveSegments: 28,
  });
  lowerGeo.translate(-p.L / 2, 0, -(p.W - bl * 2) / 2);
  const half = p.L / 2;
  const lower = sculpt(lowerGeo, (x, y) => {
    const ends = smooth(0.55, 1.0, Math.abs(x) / half);           // narrow nose and tail in plan
    const shoulder = smooth(p.belt - 0.32, p.belt + 0.04, y);      // tumblehome above the shoulder line
    const sill = smooth(p.clear + 0.16, p.clear - 0.02, y);        // tuck under at the rockers
    return (1 - 0.15 * ends) * (1 - 0.09 * shoulder) * (1 - 0.06 * sill);
  });
  body.add(new THREE.Mesh(lower, paintMat));

  const cw = p.W * (style === 'suv' || style === 'crossover' ? 0.86 : 0.8);
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape(p), {
    depth: cw - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.07, bevelSegments: 5, curveSegments: 28,
  });
  cabinGeo.translate(-p.L / 2, 0, -(cw - 0.12) / 2);
  const cabin = sculpt(cabinGeo, (x, y) => {
    const up = smooth(p.belt - 0.05, p.roof, y);                    // roof narrower than the beltline
    const ends = smooth(0.2, 0.9, Math.abs(x) / half);
    return (1 - 0.26 * up) * (1 - 0.1 * ends);
  });
  body.add(new THREE.Mesh(cabin, glassMat));

  // Light signatures: a full-width bar at each end.
  const lightFront = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdff6ff, emissiveIntensity: 3 });
  const lightRear = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2a3a, emissiveIntensity: 3 });
  const fBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, p.W * 0.82), lightFront);
  fBar.position.set(-p.L / 2 + 0.16, p.nose - 0.02, 0);
  const rBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, p.W * 0.86), lightRear);
  rBar.position.set(p.L / 2 + 0.035, p.tailTop - 0.13, 0);
  body.add(fBar, rBar);

  // Side sill in dark trim
  const sill = new THREE.Mesh(new THREE.BoxGeometry(p.wb - p.r * 2.2, 0.07, p.W + 0.02), trimMat);
  sill.position.set(-p.L / 2 + p.fo + p.wb / 2, p.clear + 0.05, 0);
  body.add(sill);

  // Wheels
  const wheels = [];
  const tw = 0.24;
  const tireGeo = new THREE.CylinderGeometry(p.r, p.r, tw, 48).rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(p.r * 0.68, p.r * 0.68, tw + 0.012, 48).rotateX(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(p.r * 1.25, 0.045, 0.025);
  const ringGeo = new THREE.TorusGeometry(p.r * 0.7, 0.009, 8, 64);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x6d747b, metalness: 0.9, roughness: 0.25 });
  const ringMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.2 });
  for (const x of [p.fo, p.fo + p.wb]) {
    for (const side of [-1, 1]) {
      const w = new THREE.Group();
      w.add(new THREE.Mesh(tireGeo, tireMat));
      w.add(new THREE.Mesh(rimGeo, rimMat));
      for (let k = 0; k < 5; k++) {
        const sp = new THREE.Mesh(spokeGeo, rimMat);
        sp.rotation.z = (k * Math.PI) / 5;
        sp.position.z = side * (tw / 2 + 0.004);
        w.add(sp);
      }
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = side * (tw / 2 + 0.012);
      w.add(ring);
      w.position.set(-p.L / 2 + x, p.r, side * (p.W / 2 - tw / 2 + 0.03));
      group.add(w);
      wheels.push(w);
    }
  }

  // Soft contact shadow and a colored underglow in the car's slot color.
  shadowTex ??= radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)');
  glowTex ??= radialTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(p.L * 1.25, p.W * 1.9),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(p.L * 1.6, p.W * 2.6),
    new THREE.MeshBasicMaterial({ map: glowTex, color: accent, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.003;
  group.add(glow, shadow);

  const X = (f) => -p.L / 2 + f;
  const anchors = {
    powertrain: new THREE.Vector3(X(p.cowl * p.L * 0.55), p.belt + 0.02, 0),
    transmission: new THREE.Vector3(X(p.cowl * p.L + 0.05), p.clear + 0.28, p.W / 2),
    drivetrain: new THREE.Vector3(X(p.fo + p.wb), p.r + 0.02, p.W / 2 + 0.05),
    weight: new THREE.Vector3(X(p.fo + p.wb / 2), p.clear + 0.12, p.W / 2 + 0.02),
    cabin: new THREE.Vector3(X(((p.wsTop + p.roofEnd) / 2) * p.L), p.roof + 0.02, 0),
    label: new THREE.Vector3(0, p.roof + 0.55, 0),
  };

  return {
    group,
    wheels,
    radius: p.r,
    dims: { L: p.L, W: p.W, H: p.roof },
    anchors,
    setPaint(hex) { paintMat.color.set(hex); },
    setAccent(hex) {
      ringMat.color.set(hex); ringMat.emissive.set(hex);
      glow.material.color.set(hex);
    },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      [paintMat, glassMat, trimMat, lightFront, lightRear, tireMat, rimMat, ringMat, shadow.material, glow.material].forEach((m) => m.dispose());
    },
  };
}
