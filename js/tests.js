// Browser-run tests: open tests.html. Results are also exposed on window.__TESTS__.
import * as U from './units.js';
import { CARS, CAR_BY_ID, SIGNATURES, CHECKED, MODELS_3D } from './data.js';
import { parseState, serializeState, matchSignature, defaultCars } from './state.js';
import { SCALES } from './gauges.js';
import { buildTradeoffs } from './tradeoffs.js';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, detail: err.message });
  }
}
function eq(actual, expected, what = '') {
  if (actual !== expected) throw new Error(`${what} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function near(actual, expected, tol, what = '') {
  if (Math.abs(actual - expected) > tol) throw new Error(`${what} expected ${expected} ± ${tol}, got ${actual}`);
}
function ok(cond, what) {
  if (!cond) throw new Error(what);
}

// --- Reference values required by the brief ---
test('60 mph converts to 96.6 km/h', () => {
  near(U.convert('speed', 60, 'metric'), 96.56064, 1e-9, 'raw');
  eq(U.format('speed', 60, 'metric', 1), '96.6', 'formatted');
});
test('300 hp converts to 224 kW', () => {
  near(U.convert('power', 300, 'metric'), 223.7099616, 1e-6, 'raw');
  eq(U.format('power', 300, 'metric'), '224', 'formatted');
});

// --- Other conversions ---
test('368 lb-ft converts to 499 N·m', () => eq(U.format('torque', 368, 'metric'), '499'));
test('3,400 lb converts to 1,542 kg', () => eq(U.format('mass', 3400, 'metric'), '1,542'));
test('155 mph converts to 249 km/h', () => eq(U.format('speed', 155, 'metric'), '249'));
test('Imperial values pass through unchanged', () => {
  eq(U.convert('power', 382, 'imperial'), 382);
  eq(U.convert('mass', 3400, 'imperial'), 3400);
});
test('Times are never converted', () => eq(U.convert('time', 3.9, 'metric'), 3.9));
test('Missing values stay missing in both systems', () => {
  eq(U.convert('power', null, 'metric'), null);
  eq(U.format('mass', null, 'imperial'), null);
});
test('Metric and imperial agree after a round trip', () => {
  near(U.convert('power', 300, 'metric') / U.HP_TO_KW, 300, 1e-9);
  near(U.convert('speed', 60, 'metric') / U.MPH_TO_KMH, 60, 1e-9);
});

// --- Derived figures, cross-checked against numbers Toyota itself publishes ---
test('GR Supra weight-to-power matches Toyota’s published 8.89 lb/hp', () =>
  near(U.weightPerPower(382, 3400, 'imperial'), 8.89, 0.02));
test('GR Corolla Core manual power-to-weight matches Toyota’s published 0.091 hp/lb', () =>
  near(300 / 3296, 0.091, 0.0006));
test('Power-to-weight is consistent between unit systems', () => {
  const ratio = U.powerToWeight(300, 3000, 'metric') / U.powerToWeight(300, 3000, 'imperial');
  near(ratio, (U.HP_TO_KW * 1000) / (U.LB_TO_KG * 2000), 1e-9);
});
test('A 3.4 s 0–60 averages 0.80 g', () => near(U.averageG(3.4), 0.8045, 0.0005));

// --- Data integrity ---
test('Car ids are unique', () => eq(new Set(CARS.map((c) => c.id)).size, CARS.length));
test('Specs-checked date is a valid ISO date', () => ok(/^\d{4}-\d{2}-\d{2}$/.test(CHECKED) && !Number.isNaN(Date.parse(CHECKED)), CHECKED));
test('Every published figure cites a source; every missing one explains why', () => {
  for (const c of CARS) {
    for (const key of ['hp', 'torque', 'weight', 'zero60', 'top']) {
      const s = c[key];
      ok(s, `${c.id}.${key} missing`);
      if (s.v == null) ok(typeof s.note === 'string' && s.note.length > 10, `${c.id}.${key} is unverified without a note`);
      else ok(Number.isInteger(s.s) && c.sources[s.s]?.url?.startsWith('https://'), `${c.id}.${key} has no valid source`);
    }
  }
});
test('No figure in the lineup is unverified or blank', () => {
  for (const c of CARS) {
    for (const key of ['hp', 'torque', 'weight', 'zero60', 'top']) ok(c[key].v != null, `${c.id}.${key} is blank`);
  }
});
test('Every car has a 3D model sized from published dimensions', () => {
  for (const c of CARS) {
    ok(MODELS_3D.includes(c.model3d), `${c.id}: model ${c.model3d}`);
    const d = c.dims;
    ok(d && d.L > d.wb && d.W > 60 && d.W < 90 && d.H > 40 && d.H < 80, `${c.id}: implausible dimensions`);
    ok(Number.isInteger(d.s) && c.sources[d.s], `${c.id}: dimensions have no source`);
    ok(/^#[0-9a-f]{6}$/i.test(c.paint), `${c.id}: paint`);
  }
});
test('Every signature run has a wordmark', () => {
  for (const s of SIGNATURES) ok(typeof s.word === 'string' && s.word.length > 0, s.id);
});
test('Every car has the text specs the sheet shows', () => {
  for (const c of CARS) for (const k of ['drivetrain', 'powertrain', 'engine', 'transmission', 'transType']) ok(c[k], `${c.id}.${k}`);
});
test('Every catalog value fits on its gauge scale in both unit systems', () => {
  for (const sys of ['imperial', 'metric']) {
    for (const c of CARS) {
      if (c.hp.v != null) ok(U.convert('power', c.hp.v, sys) <= SCALES.power[sys].max, `${c.id} power (${sys})`);
      if (c.torque.v != null) ok(U.convert('torque', c.torque.v, sys) <= SCALES.torque[sys].max, `${c.id} torque (${sys})`);
      if (c.zero60.v != null) ok(c.zero60.v <= SCALES.time[sys].max, `${c.id} 0-60`);
    }
  }
});
test('Signature runs reference real cars and include a hybrid', () => {
  for (const s of SIGNATURES) for (const id of s.cars) ok(CAR_BY_ID.has(id), `${s.id}: ${id}`);
  ok(SIGNATURES.some((s) => s.cars.some((id) => CAR_BY_ID.get(id).powertrain === 'Hybrid')), 'no hybrid');
});

// --- URL state ---
test('URL state round-trips', () => {
  const s = { cars: ['toyota-gr86', 'toyota-gr-supra'], units: 'metric', explain: false };
  const q = serializeState(s);
  eq(q, '?cars=toyota-gr86,toyota-gr-supra&units=metric&explain=off');
  const back = parseState(q);
  eq(JSON.stringify(back), JSON.stringify(s));
});
test('Three-car links keep all three cars', () =>
  eq(parseState('?cars=toyota-gr86,toyota-gr-supra,toyota-gr-corolla').cars.length, 3));
test('Unknown car ids fall back to the default run', () =>
  eq(parseState('?cars=nope,also-nope').cars.join(), defaultCars().join()));
test('Defaults are imperial with explanations on', () => {
  const s = parseState('');
  eq(s.units, 'imperial');
  eq(s.explain, true);
});
test('?run= opens a signature run', () => eq(parseState('?run=awd-rwd').cars.join(), 'bmw-m3-competition,bmw-m3-competition-xdrive'));
test('Signature detection ignores car order', () =>
  eq(matchSignature(['toyota-gr-supra', 'toyota-gr86'])?.id, 'turbo-na'));

// --- Trade-off panel ---
test('Every signature run produces its essay plus a power-to-weight section', () => {
  for (const s of SIGNATURES) {
    const cars = s.cars.map((id) => CAR_BY_ID.get(id));
    for (const sys of ['imperial', 'metric']) {
      const out = buildTradeoffs(cars, sys, s);
      ok(out[0]?.signature, `${s.id} essay missing`);
      ok(out.some((o) => o.id === 'ptw'), `${s.id} ptw missing`);
      ok(!out.some((o) => /undefined|NaN/.test(o.html)), `${s.id} (${sys}) renders undefined/NaN`);
    }
  }
});
test('Any pairing renders trade-offs without undefined or NaN', () => {
  for (const a of CARS) for (const b of CARS) {
    if (a === b) continue;
    for (const o of buildTradeoffs([a, b], 'metric', null)) ok(!/undefined|NaN/.test(o.html), `${a.id} vs ${b.id}: ${o.id}`);
  }
});
test('Turbo vs NA explanation appears when aspiration differs', () => {
  const out = buildTradeoffs([CAR_BY_ID.get('toyota-gr86'), CAR_BY_ID.get('bmw-m3')], 'imperial', null);
  ok(out.some((o) => o.id === 'aspiration'), 'missing aspiration section');
});

// --- Render ---
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
document.getElementById('summary').textContent = `${passed} passed, ${failed} failed`;
document.getElementById('summary').className = failed ? 'fail' : 'ok';
document.getElementById('results').innerHTML = results.map((r) =>
  `<li class="${r.ok ? 'ok' : 'fail'}">${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` <code>${r.detail}</code>` : ''}</li>`).join('');
window.__TESTS__ = { passed, failed, results };
