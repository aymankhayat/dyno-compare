// Comparison state lives in the URL so any comparison can be linked directly:
//   ?cars=toyota-gr86,toyota-gr-supra&units=metric&explain=off
// Cost & Emissions mode adds its own parameters, written only when they differ from the defaults:
//   &mode=cost&region=uk&fam=toyota&mi=25000&yrs=6&batt=0&fr=7.5&fp=&el=0.3&gr=200&p=,,36000&i=,,5000
import { CAR_BY_ID, SIGNATURES, DEFAULT_RUN } from './data.js';
import { REGIONS, FAMILY_BY_ID, FACTORS } from './costdata.js';
import { carryOver } from './costmodel.js';

export function defaultCars() {
  return SIGNATURES.find((s) => s.id === DEFAULT_RUN).cars.slice();
}

const clampInt = (v, lo, hi, d) => {
  const n = Math.round(Number(v));
  return v != null && v !== '' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const pos = (v) => {
  const n = Number(v);
  return v != null && v !== '' && Number.isFinite(n) && n >= 0 ? n : null;
};
const list = (v) => (v ? v.split(',').slice(0, 3).map(pos) : []);

export function parseState(search) {
  const p = new URLSearchParams(search);
  const run = SIGNATURES.find((s) => s.id === p.get('run'));
  let cars = (p.get('cars') || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => CAR_BY_ID.has(id))
    .slice(0, 3);
  if (cars.length < 2) cars = run ? run.cars.slice() : defaultCars();
  const famParam = FAMILY_BY_ID.has(p.get('fam')) ? p.get('fam') : null;
  return {
    cars,
    units: p.get('units') === 'metric' ? 'metric' : 'imperial',
    explain: p.get('explain') !== 'off',
    mode: p.get('mode') === 'cost' ? 'cost' : 'spec',
    cost: {
      region: REGIONS[p.get('region')] ? p.get('region') : 'us',
      // Without an explicit family, follow the cars chosen in Spec Comparison.
      fam: famParam ?? carryOver(cars)?.fam ?? 'toyota',
      famLocked: famParam != null,
      mi: clampInt(p.get('mi'), 1000, 60000, FACTORS.annualMiles.v),
      yrs: clampInt(p.get('yrs'), 1, 20, FACTORS.years.v),
      batt: p.get('batt') !== '0',
      fr: pos(p.get('fr')),
      fp: pos(p.get('fp')),
      el: pos(p.get('el')),
      gr: pos(p.get('gr')),
      p: list(p.get('p')),
      i: list(p.get('i')),
    },
  };
}

const r4 = (n) => String(Math.round(n * 1e4) / 1e4);
const listOut = (a) => (a && a.some((v) => v != null) ? a.map((v) => (v == null ? '' : r4(v))).join(',').replace(/,+$/, '') : null);

export function serializeState({ cars, units, explain, mode, cost }) {
  const parts = [`cars=${cars.map(encodeURIComponent).join(',')}`];
  if (units === 'metric') parts.push('units=metric');
  if (!explain) parts.push('explain=off');
  if (mode === 'cost' && cost) {
    parts.push('mode=cost');
    if (cost.region !== 'us') parts.push(`region=${cost.region}`);
    if (cost.famLocked) parts.push(`fam=${cost.fam}`);
    if (cost.mi !== FACTORS.annualMiles.v) parts.push(`mi=${cost.mi}`);
    if (cost.yrs !== FACTORS.years.v) parts.push(`yrs=${cost.yrs}`);
    if (cost.batt === false) parts.push('batt=0');
    for (const k of ['fr', 'fp', 'el', 'gr']) if (cost[k] != null) parts.push(`${k}=${r4(cost[k])}`);
    for (const k of ['p', 'i']) { const v = listOut(cost[k]); if (v) parts.push(`${k}=${v}`); }
  }
  return `?${parts.join('&')}`;
}

export function matchSignature(cars) {
  const key = [...cars].sort().join(',');
  return SIGNATURES.find((s) => [...s.cars].sort().join(',') === key) || null;
}
