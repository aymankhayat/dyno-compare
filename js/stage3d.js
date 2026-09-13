// The 3D showroom: cars on a dark studio floor, drag to orbit, spec hotspots
// pinned to each model, paint changes, and a drive-in when the lineup changes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildCar } from './carmodels.js';

const SPACING = 2.7;
// Aim above the cars so they sit in the lower half of the stage, under the wordmark.
const TARGET_Y = 1.15;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => 1 - (1 - t) ** 3;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

export function createStage({ canvas, overlay, onHotspot, onFocus }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const bg = new THREE.Color('#07090c');
  scene.fog = new THREE.Fog(bg, 11, 26);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(-6.4, 2.3, 6.2);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.48;
  controls.autoRotate = !reduceMotion();
  controls.autoRotateSpeed = 0.55;
  const TARGET = new THREE.Vector3(0, TARGET_Y, 0);
  controls.target.copy(TARGET);
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  // Studio: glossy floor, faint grid, key light and two colored rims.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 96),
    new THREE.MeshStandardMaterial({ color: 0x0b0e12, metalness: 0.75, roughness: 0.34 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const grid = new THREE.GridHelper(40, 80, 0x1f3a3a, 0x121c22);
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  grid.position.y = 0.002;
  scene.add(grid);

  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-3, 7, 4);
  const rimA = new THREE.PointLight(0x6cf0c2, 14, 12);
  rimA.position.set(4, 2.2, -4);
  const rimB = new THREE.PointLight(0x5ab8ff, 10, 12);
  rimB.position.set(-5, 1.5, -3);
  scene.add(key, rimA, rimB, new THREE.HemisphereLight(0x8fb6c9, 0x050607, 0.35));

  let cars = [];        // { car, entry, x, from, delay }
  let focused = 0;
  let targetTween = null;
  let driveStart = 0;
  let hotspotEls = [];
  let labelEls = [];

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 48 : camera.aspect < 1.3 ? 36 : 30;
    camera.updateProjectionMatrix();
    if (cars.length) fitCamera();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function slotZ(i, n) { return (i - (n - 1) / 2) * SPACING; }

  function buildOverlay() {
    overlay.querySelectorAll('.hs, .car-tag').forEach((el) => el.remove());
    labelEls = cars.map(({ entry }, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `car-tag t${i}`;
      el.innerHTML = `<span class="dot"></span>${entry.name}`;
      el.addEventListener('click', () => focus(i));
      overlay.appendChild(el);
      return el;
    });
    hotspotEls = [];
    cars.forEach(({ entry }, i) => {
      entry.hotspots.forEach((h) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hs';
        el.dataset.car = i;
        el.setAttribute('aria-label', `${entry.name}: ${h.label}`);
        el.innerHTML = `<span class="hs-dot"></span><span class="hs-label">${h.label}</span>`;
        el.addEventListener('click', () => onHotspot?.(i, h, el));
        overlay.appendChild(el);
        hotspotEls.push({ el, car: i, key: h.anchor });
      });
    });
  }

  function setCars(entries, { animate = true } = {}) {
    cars.forEach(({ car }) => { scene.remove(car.group); car.dispose(); });
    const n = entries.length;
    cars = entries.map((entry, i) => {
      const car = buildCar(entry.style, { paint: entry.paint, accent: entry.accent });
      const z = slotZ(i, n);
      car.group.position.set(0, 0, z);
      scene.add(car.group);
      return { car, entry, z, from: animate && !reduceMotion() ? 16 + i * 3 : 0 };
    });
    driveStart = performance.now();
    focused = Math.min(focused, n - 1);
    buildOverlay();
    fitCamera(n);
    focus(-1);
  }

  // Pull the camera back far enough to fit the whole lineup, more on tall screens.
  // Fit the lineup's width into the horizontal field of view, and keep the fog
  // beyond the cars at any distance (tall phone screens need the camera far back).
  function fitCamera(n = cars.length || 2) {
    const vf = (camera.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * (camera.aspect || 1.6));
    const halfWidth = n === 3 ? 4.6 : n === 2 ? 3.6 : 2.9;
    const dist = Math.max(n === 3 ? 13.5 : n === 2 ? 11.5 : 9.5, halfWidth / Math.tan(hf / 2));
    controls.maxDistance = dist * 1.6;
    controls.minDistance = Math.min(4.5, dist * 0.5);
    scene.fog.near = dist * 0.9;
    scene.fog.far = dist * 2.4;
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(TARGET).addScaledVector(dir, dist);
  }

  function tweenTarget(to) {
    targetTween = { from: controls.target.clone(), to, t0: performance.now(), dur: reduceMotion() ? 1 : 700 };
  }

  function focus(i) {
    focused = i;
    labelEls.forEach((el, k) => el.classList.toggle('on', k === i));
    tweenTarget(new THREE.Vector3(0, TARGET_Y, i < 0 ? 0 : cars[i].z));
    onFocus?.(i);
  }

  function setPaint(i, hex) { cars[i]?.car.setPaint(hex); }

  const v = new THREE.Vector3();
  function place(el, world, carGroup) {
    v.copy(world).add(carGroup.position).project(camera);
    const behind = v.z > 1;
    const x = (v.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-v.y * 0.5 + 0.5) * canvas.clientHeight;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    el.hidden = behind;
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;

    // Drive-in: each car rolls in from behind, wheels turning with distance.
    cars.forEach((c, i) => {
      if (!c.from) return;
      const t = Math.min(1, Math.max(0, (now - driveStart - i * 180) / 1400));
      const x = c.from * (1 - ease(t));
      const dx = c.car.group.position.x - x;
      c.car.group.position.x = x;
      c.car.wheels.forEach((w) => { w.rotation.z += dx / c.car.radius; });
      if (t >= 1) c.from = 0;
    });

    if (targetTween) {
      const t = Math.min(1, (now - targetTween.t0) / targetTween.dur);
      controls.target.lerpVectors(targetTween.from, targetTween.to, ease(t));
      if (t >= 1) targetTween = null;
    }
    controls.update(dt);
    renderer.render(scene, camera);

    cars.forEach((c, i) => place(labelEls[i], c.car.anchors.label, c.car.group));
    hotspotEls.forEach((h) => {
      const show = h.car === focused;
      h.el.classList.toggle('live', show);
      if (show) place(h.el, cars[h.car].car.anchors[h.key], cars[h.car].car.group);
    });
  }
  resize();
  requestAnimationFrame(frame);

  return {
    setCars,
    focus,
    setPaint,
    get focused() { return focused; },
    resetView() { controls.autoRotate = !reduceMotion(); focus(-1); },
  };
}
