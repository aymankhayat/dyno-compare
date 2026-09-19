// Browser-run tests: open tests.html. Results are also exposed on window.__TESTS__.
import * as U from './units.js';
import { CARS, CAR_BY_ID, SIGNATURES, CHECKED, MODELS_3D, MODEL_FILES } from './data.js';
import { parseState, serializeState, matchSignature, defaultCars } from './state.js';
import { SCALES } from './gauges.js';
import { buildTradeoffs } from './tradeoffs.js';
import { REGIONS, REGION_KEYS, FAMILIES, FACTORS, SOURCES, SPEC_LINKS, COST_CHECKED } from './costdata.js';
import { results as costResults, breakEven, perGallon, carryOver, L_PER_GAL } from './costmodel.js';

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
test('Every real 3D model file is credited with author, license and link', () => {
  for (const c of CARS) ok(MODEL_FILES[c.model3d], `${c.id}: no model file entry for ${c.model3d}`);
  for (const [k, m] of Object.entries(MODEL_FILES)) {
    ok(m.file.startsWith('assets/cars/') && m.file.endsWith('.glb'), `${k}: file path`);
    ok(m.author && m.title && /^CC BY/.test(m.license) && m.url.startsWith('https://sketchfab.com/'), `${k}: credit incomplete`);
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
  eq(JSON.stringify([back.cars, back.units, back.explain]), JSON.stringify([s.cars, s.units, s.explain]));
  eq(back.mode, 'spec', 'spec links stay in Spec Comparison');
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

// --- Cost & Emissions ---
const cost = (over = {}) => ({ region: 'us', fam: 'toyota', mi: 12000, yrs: 8, batt: true, fr: null, fp: null, el: null, gr: null, p: [], i: [], ...over });
const byPt = (R, pt) => R.rows.find((r) => r.v.pt === pt);

test('Scenario: 25,000 mi a year in the UK (high fuel price) clearly favors the EV and hybrid', () => {
  const R = costResults(cost({ region: 'uk', mi: 25000 }));
  const [ice, hyb, ev] = ['ICE', 'Hybrid', 'EV'].map((p) => byPt(R, p));
  ok(ev.tco < ice.tco * 0.85 && hyb.tco < ice.tco * 0.9, `EV ${ev.tco.toFixed(0)}, hybrid ${hyb.tco.toFixed(0)}, gas ${ice.tco.toFixed(0)}`);
  eq(R.cheapest.v.pt, 'EV', 'cheapest');
  eq(R.cleanest.v.pt, 'EV', 'cleanest');
});
test('Scenario: Saudi Arabia (cheap capped fuel, oil and gas grid) does not favor the EV', () => {
  const R = costResults(cost({ region: 'sa' }));
  ok(R.cheapest.v.pt !== 'EV', 'EV should not be cheapest');
  ok(byPt(R, 'Hybrid').lifeKg < byPt(R, 'EV').lifeKg, 'hybrid should beat the EV on lifetime CO2 on a 692 g/kWh grid');
  ok(byPt(R, 'EV').lifeKg < byPt(R, 'ICE').lifeKg, 'EV still beats the gas car');
});
test('Scenario: 5,000 mi a year for 5 years in the US favors the cheaper gas car', () => {
  const R = costResults(cost({ mi: 5000, yrs: 5 }));
  eq(R.cheapest.v.pt, 'ICE', 'cheapest');
  const be = R.costBE.find((b) => b.to.v.pt === 'EV');
  ok(be.miles > 25000, `EV break-even ${be.miles} should be past the 25,000 mi owned`);
});
test('Scenario: UAE preset uses AED and the dirham peg', () => {
  const R = costResults(cost({ region: 'uae' }));
  eq(R.s.region.currency, 'AED');
  near(R.s.prices[0], 23325 * 3.6725, 1, 'converted MSRP');
  near(R.s.regular, 3.69 * L_PER_GAL, 1e-9, 'AED per gallon');
  ok(R.s.premium > R.s.regular, 'Super 98 costs more than Special 95');
});
test('Break-even is where the two cost lines meet', () => {
  near(breakEven(20000, 0.2, 30000, 0.1), 100000, 1e-6);
  eq(breakEven(20000, 0.1, 30000, 0.2), null, 'never');
  eq(breakEven(20000, 0.1, 30000, 0.1), null, 'parallel');
  const R = costResults(cost());
  for (const b of R.costBE.filter((x) => x.miles)) {
    near(b.from.upfront + b.from.perMile * b.miles, b.to.upfront + b.to.perMile * b.miles, 0.01, b.to.v.id);
  }
});
test('EV emissions come from the local grid, never zero', () => {
  for (const k of REGION_KEYS) {
    const ev = byPt(costResults(cost({ region: k })), 'EV');
    near(ev.co2, (25.5044 / 100) * REGIONS[k].grid.v, 1e-9, k);
    ok(ev.co2 > 0 && ev.upfrontKg > 0, `${k}: zero`);
  }
});
test('Gasoline CO2 is 8,887 g per gallon ÷ mpg', () => near(byPt(costResults(cost()), 'ICE').co2, 8887 / 34, 1e-9));
test('Litre prices convert to per-gallon correctly', () => near(perGallon({ v: 1, unit: 'L' }), 3.785411784, 1e-12));
test('Every cost default carries a source or an illustrative label', () => {
  ok(/^\d{4}-\d{2}-\d{2}$/.test(COST_CHECKED), 'COST_CHECKED');
  for (const [k, r] of Object.entries(REGIONS)) {
    for (const key of ['regular', 'premium', 'elec', 'grid', 'fx']) {
      const f = r[key];
      ok(['sourced', 'illustrative'].includes(f.kind), `${k}.${key} kind`);
      if (f.src) ok(SOURCES[f.src]?.url.startsWith('https://'), `${k}.${key} source`);
      else ok(k === 'us' && key === 'fx', `${k}.${key} has no source`);
      ok(f.v > 0, `${k}.${key} value`);
    }
  }
  for (const f of FAMILIES) for (const v of f.variants) {
    ok(SOURCES[v.price.src], `${v.id} price source`);
    ok(v.pt === 'EV' ? v.kwh100.v > 0 && v.batteryKwh > 0 : v.mpg.v > 0, `${v.id} efficiency`);
  }
  for (const f of [FACTORS.gasCo2PerGal, FACTORS.batteryKgPerKwh, ...Object.values(FACTORS.maint)]) ok(SOURCES[f.src], 'factor source');
  ok(REGION_KEYS.some((k) => REGIONS[k].gulf), 'Gulf preset');
});
test('Cost URL state round-trips, and spec links are unchanged', () => {
  const s = parseState('?cars=toyota-gr86,toyota-gr-supra&mode=cost&region=uae&fam=hyundai&mi=20000&yrs=5&batt=0&el=0.4&p=,32000&i=,,5000');
  eq(s.mode, 'cost');
  eq(JSON.stringify([s.cost.region, s.cost.fam, s.cost.mi, s.cost.yrs, s.cost.batt, s.cost.el, s.cost.p, s.cost.i]),
    JSON.stringify(['uae', 'hyundai', 20000, 5, false, 0.4, [null, 32000], [null, null, 5000]]));
  eq(serializeState(s), '?cars=toyota-gr86,toyota-gr-supra&mode=cost&region=uae&fam=hyundai&mi=20000&yrs=5&batt=0&el=0.4&p=,32000&i=,,5000');
  eq(serializeState({ ...s, mode: 'spec' }), '?cars=toyota-gr86,toyota-gr-supra', 'spec URL');
  eq(serializeState(parseState('?cars=toyota-gr86,toyota-gr-supra&mode=cost')), '?cars=toyota-gr86,toyota-gr-supra&mode=cost', 'defaults omitted');
});
test('Spec lineup carries over into Cost & Emissions', () => {
  const co = carryOver(['porsche-911-carrera', 'porsche-911-carrera-gts']);
  eq(co.fam, 'porsche');
  eq(co.variants.join(), '911,911-gts');
  eq(carryOver(['hyundai-ioniq-5-n', 'bmw-m3']).fam, 'hyundai');
  eq(carryOver(['toyota-gr86', 'hyundai-ioniq-5-n']).fam, 'hyundai', 'a direct counterpart wins');
  eq(carryOver(['bmw-m3', 'bmw-m3-competition']), null, 'BMW has no gas/hybrid/EV family');
  eq(parseState('?cars=toyota-gr86,toyota-gr-supra').cost.fam, 'toyota');
  eq(parseState('?run=hybrid-ice').cost.fam, 'porsche');
  for (const id of Object.keys(SPEC_LINKS)) ok(CAR_BY_ID.has(id), `${id} is not a car`);
});

// --- Render ---
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
document.getElementById('summary').textContent = `${passed} passed, ${failed} failed`;
document.getElementById('summary').className = failed ? 'fail' : 'ok';
document.getElementById('results').innerHTML = results.map((r) =>
  `<li class="${r.ok ? 'ok' : 'fail'}">${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` <code>${r.detail}</code>` : ''}</li>`).join('');
window.__TESTS__ = { passed, failed, results };
