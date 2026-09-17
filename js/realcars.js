// Real 3D car models (GLB files credited in js/data.js MODEL_FILES).
// Each file is normalized in code: turned so its length runs along x with the
// nose at -x, scaled to the maker's published length, centered and set on the floor.
// If a file is missing or fails to load, the stage keeps the built-in shape.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { MODELS, groundEffects } from './carmodels.js';
import { MODEL_FILES } from './data.js';

const IN = 0.0254;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();   // file -> Promise<gltf scene template>

function loadTemplate(file) {
  if (!cache.has(file)) {
    cache.set(file, loader.loadAsync(file).then((g) => g.scene).catch((err) => {
      cache.delete(file);
      throw err;
    }));
  }
  return cache.get(file);
}

export async function loadRealCar(key, { dims, accent = '#6cf0c2' }) {
  const cfg = MODEL_FILES[key];
  if (!cfg) return null;
  let template;
  try {
    template = await loadTemplate(cfg.file);
  } catch {
    return null;
  }

  const root = template.clone(true);
  const pivot = new THREE.Group();
  pivot.add(root);

  // Length along x, nose toward -x. `yaw` corrects files authored facing another way.
  root.rotation.y = THREE.MathUtils.degToRad(cfg.yaw ?? 0);
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) {
    root.rotation.y += Math.PI / 2;
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
  }

  const L = dims.L * IN;
  const s = L / size.x;
  pivot.scale.setScalar(s);
  pivot.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(pivot);
  const center = box.getCenter(new THREE.Vector3());
  pivot.position.set(-center.x, -box.min.y, -center.z);
  pivot.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(pivot);
  size = box.getSize(new THREE.Vector3());

  const group = new THREE.Group();
  group.add(pivot);
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });

  const W = size.z;
  const H = size.y;
  const hw = W / 2;
  const fx = groundEffects(group, L, W, accent);

  const m = MODELS[key] ?? {};
  const wb = dims.wb * IN;
  const frontAxle = box.min.x + (L - wb) * (m.frontShare ?? 0.45);
  const rearAxle = frontAxle + wb;
  const anchors = {
    powertrain: m.electric
      ? new THREE.Vector3(0, 0.25, hw + 0.03)
      : new THREE.Vector3(m.rearEngine ? box.max.x - 0.45 : box.min.x + 0.55, H * (m.rearEngine ? 0.72 : 0.64), 0),
    transmission: new THREE.Vector3(m.rearEngine ? rearAxle - 0.45 : box.min.x + 1.3, 0.42, hw),
    drivetrain: new THREE.Vector3(rearAxle, 0.36, hw + 0.05),
    weight: new THREE.Vector3(m.electric ? frontAxle + 0.6 : 0, 0.22, hw + 0.02),
    cabin: new THREE.Vector3(0, H + 0.02, 0),
    label: new THREE.Vector3(0, H + 0.55, 0),
  };

  return {
    group,
    wheels: [],
    radius: 0.33,
    dims: { L, W, H },
    anchors,
    real: true,
    setPaint() {},
    setAccent: fx.setAccent,
    dispose() {
      // Geometry and textures are shared with the cached template; only the ground effects are ours.
      fx.dispose();
    },
  };
}
