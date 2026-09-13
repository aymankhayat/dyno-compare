// Comparison state lives in the URL so any comparison can be linked directly:
//   ?cars=toyota-gr86,toyota-gr-supra&units=metric&explain=off
import { CAR_BY_ID, SIGNATURES, DEFAULT_RUN } from './data.js';

export function defaultCars() {
  return SIGNATURES.find((s) => s.id === DEFAULT_RUN).cars.slice();
}

export function parseState(search) {
  const p = new URLSearchParams(search);
  const run = SIGNATURES.find((s) => s.id === p.get('run'));
  let cars = (p.get('cars') || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => CAR_BY_ID.has(id))
    .slice(0, 3);
  if (cars.length < 2) cars = run ? run.cars.slice() : defaultCars();
  return {
    cars,
    units: p.get('units') === 'metric' ? 'metric' : 'imperial',
    explain: p.get('explain') !== 'off',
  };
}

export function serializeState({ cars, units, explain }) {
  const parts = [`cars=${cars.map(encodeURIComponent).join(',')}`];
  if (units === 'metric') parts.push('units=metric');
  if (!explain) parts.push('explain=off');
  return `?${parts.join('&')}`;
}

export function matchSignature(cars) {
  const key = [...cars].sort().join(',');
  return SIGNATURES.find((s) => [...s.cars].sort().join(',') === key) || null;
}
