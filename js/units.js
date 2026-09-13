// Unit conversion. All car data is stored in US units (mph, SAE net hp, lb, lb-ft)
// exactly as the manufacturers publish it; metric is derived here and nowhere else.

export const MPH_TO_KMH = 1.609344;        // exact, international mile
export const HP_TO_KW = 0.745699872;       // mechanical (SAE) horsepower
export const LB_TO_KG = 0.45359237;        // exact, international pound
export const LBFT_TO_NM = 1.3558179483;
export const MPH60_IN_MS = 60 * MPH_TO_KMH / 3.6;   // 26.8224 m/s
export const G = 9.80665;

export const UNITS = {
  imperial: { speed: 'mph', power: 'hp', mass: 'lb', torque: 'lb-ft', time: 's' },
  metric: { speed: 'km/h', power: 'kW', mass: 'kg', torque: 'N·m', time: 's' },
};

// Decimal places shown for each kind of value.
const DIGITS = {
  imperial: { speed: 0, power: 0, mass: 0, torque: 0, time: 1 },
  metric: { speed: 0, power: 0, mass: 0, torque: 0, time: 1 },
};

export function convert(kind, value, system) {
  if (value == null || Number.isNaN(value)) return null;
  if (system === 'imperial' || kind === 'time') return value;
  switch (kind) {
    case 'speed': return value * MPH_TO_KMH;
    case 'power': return value * HP_TO_KW;
    case 'mass': return value * LB_TO_KG;
    case 'torque': return value * LBFT_TO_NM;
    default: throw new Error(`Unknown unit kind: ${kind}`);
  }
}

export function round(value, digits) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

// Formats a stored (imperial) value for display in the chosen system.
export function format(kind, value, system, digits) {
  const v = convert(kind, value, system);
  if (v == null) return null;
  const d = digits ?? DIGITS[system][kind];
  return round(v, d).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function unit(kind, system) {
  return UNITS[system][kind];
}

// Power-to-weight, higher is better: hp per US ton (2,000 lb) or kW per tonne.
export function powerToWeight(hp, lb, system) {
  if (hp == null || lb == null) return null;
  return system === 'metric'
    ? (hp * HP_TO_KW) / (lb * LB_TO_KG / 1000)
    : hp / (lb / 2000);
}

// Weight carried by each unit of power, lower is better: lb/hp or kg/kW.
export function weightPerPower(hp, lb, system) {
  if (hp == null || lb == null) return null;
  return system === 'metric' ? (lb * LB_TO_KG) / (hp * HP_TO_KW) : lb / hp;
}

// Average acceleration over a 0-60 mph run, in g.
export function averageG(zeroToSixty) {
  if (zeroToSixty == null) return null;
  return MPH60_IN_MS / zeroToSixty / G;
}
