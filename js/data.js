// Every figure below was read from a manufacturer document on CHECKED. The lineup
// only includes cars whose makers publish every figure the site shows, so nothing
// is estimated and nothing is blank.
//
// Values are stored in the units the maker publishes (US: mph, SAE net hp, lb, lb-ft).
// Spec shape: { v, s, rpm?, basis?, tag?, note? }
//   v      the number
//   s      index into the car's `sources` array
//   basis  for torque: 'system' (what drives the wheels) or 'engine' (engine only)
//   tag    short qualifier shown next to the value
//   note   a caveat worth reading
// zero60.kind is always 'claimed': 0-60 times are manufacturer claims, not tests.

export const CHECKED = '2026-09-13';

// Body shapes the 3D showroom can build (js/carmodels.js).
export const BODY_STYLES = ['sedan', 'liftback', 'coupe', 'fastback', 'hatch', 'suv', 'crossover', 'roadster'];

const toyotaSpecs = (slug, year, model) => ({
  label: `Toyota.com, ${year} ${model} full specifications`,
  url: `https://www.toyota.com/${slug}/features/`,
});
const bmwPress = { label: 'BMW Group PressClub USA, “The new 2025 BMW M3”', url: 'https://www.press.bmwgroup.com/usa/article/detail/T0442408EN_US/the-new-2025-bmw-m3?language=en_US' };
const MDP = '180 mph with the M Driver’s Package.';

export const CARS = [
  // ---------- Toyota GR ----------
  {
    id: 'toyota-gr86', make: 'Toyota', model: 'GR86', short: 'GR86', year: 2027,
    trim: 'Base, 6-speed manual', family: 'gr86', style: 'coupe',
    powertrain: 'NA', induction: 'na', drivetrain: 'RWD',
    engine: '2.4L flat-4',
    transmission: '6-speed manual', transType: 'manual',
    hp: { v: 228, s: 0, rpm: '7,000' },
    torque: { v: 184, s: 0, rpm: '3,700', basis: 'system' },
    weight: { v: 2811, s: 0 },
    zero60: { v: 6.1, s: 0, kind: 'claimed', tag: 'manual', note: 'Toyota lists 6.6 s for the 6-speed automatic.' },
    top: { v: 140, s: 0, note: 'Toyota lists 134 mph for the automatic.' },
    sources: [toyotaSpecs('gr86', 2027, 'GR86')],
  },
  {
    id: 'toyota-gr-supra', make: 'Toyota', model: 'GR Supra 3.0', short: 'GR Supra', year: 2026,
    trim: '3.0, 8-speed automatic', family: 'supra', style: 'coupe',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.0L turbo inline-6',
    transmission: '8-speed automatic', transType: 'auto',
    hp: { v: 382, s: 0, rpm: '5,800–6,500' },
    torque: { v: 368, s: 0, rpm: '1,800–5,000', basis: 'system' },
    weight: { v: 3400, s: 0 },
    zero60: { v: 3.9, s: 0, kind: 'claimed', tag: 'automatic', note: 'Toyota lists 4.2 s for the 6-speed manual.' },
    top: { v: 155, s: 0, tag: 'limited' },
    sources: [toyotaSpecs('grsupra', 2026, 'GR Supra')],
  },
  {
    id: 'toyota-gr-corolla', make: 'Toyota', model: 'GR Corolla', short: 'GR Corolla', year: 2026,
    trim: 'Core, 6-speed manual', family: 'gr-corolla', style: 'hatch',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'AWD',
    awdNote: 'GR-FOUR: front:rear torque split of 60:40 (Normal), 60:40 to 30:70 (Track), 50:50 (Gravel)',
    engine: '1.6L turbo 3-cyl',
    transmission: '6-speed manual (iMT, rev-matching)', transType: 'manual',
    hp: { v: 300, s: 0, rpm: '6,500' },
    torque: { v: 295, s: 0, rpm: '3,250–4,600', basis: 'system' },
    weight: { v: 3296, s: 0 },
    zero60: { v: 4.9, s: 1, kind: 'claimed', note: 'Toyota’s claim for the manual (and the automatic), as quoted by Edmunds. Toyota.com does not list a 0–60 time.' },
    top: { v: 142.9, s: 0, tag: 'limited' },
    sources: [
      toyotaSpecs('grcorolla', 2026, 'GR Corolla'),
      { label: 'Edmunds, 2025 Toyota GR Corolla Automatic First Drive (quotes Toyota’s 4.9 s claim)', url: 'https://www.edmunds.com/car-news/2025-toyota-gr-corolla-automatic-first-drive-review.html' },
    ],
  },

  // ---------- BMW M ----------
  {
    id: 'bmw-m3', make: 'BMW', model: 'M3', short: 'M3', year: 2025,
    trim: 'Sedan, 6-speed manual', family: 'm3', style: 'sedan',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.0L twin-turbo inline-6',
    transmission: '6-speed manual', transType: 'manual',
    hp: { v: 473, s: 0, rpm: '6,250' },
    torque: { v: 406, s: 0, rpm: '2,650–6,130', basis: 'system' },
    weight: { v: 3840, s: 0 },
    zero60: { v: 4.1, s: 0, kind: 'claimed' },
    top: { v: 155, s: 0, tag: 'limited', note: MDP },
    sources: [bmwPress],
  },
  {
    id: 'bmw-m3-competition', make: 'BMW', model: 'M3 Competition', short: 'M3 Comp', year: 2025,
    trim: 'Competition sedan, rear-wheel drive', family: 'm3', style: 'sedan',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.0L twin-turbo inline-6',
    transmission: '8-speed automatic', transType: 'auto',
    hp: { v: 503, s: 0, rpm: '6,250' },
    torque: { v: 479, s: 0, rpm: '2,750–5,500', basis: 'system' },
    weight: { v: 3891, s: 0 },
    zero60: { v: 3.8, s: 0, kind: 'claimed' },
    top: { v: 155, s: 0, tag: 'limited', note: MDP },
    sources: [bmwPress],
  },
  {
    id: 'bmw-m3-competition-xdrive', make: 'BMW', model: 'M3 Competition M xDrive', short: 'M3 Comp xDrive', year: 2025,
    trim: 'Competition sedan, M xDrive', family: 'm3', style: 'sedan',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'AWD',
    awdNote: 'M xDrive: rear-biased, with 4WD, 4WD Sport and 2WD modes',
    engine: '3.0L twin-turbo inline-6',
    transmission: '8-speed automatic', transType: 'auto',
    hp: { v: 523, s: 0, rpm: '6,250' },
    torque: { v: 479, s: 0, rpm: '2,750–5,730', basis: 'system' },
    weight: { v: 3990, s: 0 },
    zero60: { v: 3.4, s: 0, kind: 'claimed' },
    top: { v: 155, s: 0, tag: 'limited', note: MDP },
    sources: [bmwPress],
  },

  // ---------- Porsche ----------
  {
    id: 'porsche-911-carrera', make: 'Porsche', model: '911 Carrera', short: '911 Carrera', year: 2027,
    trim: 'Coupe, 8-speed PDK', family: '911', style: 'fastback',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.0L twin-turbo flat-6',
    transmission: '8-speed PDK (dual-clutch)', transType: 'dct',
    hp: { v: 388, s: 0 },
    torque: { v: 331, s: 0, basis: 'system' },
    weight: { v: 3342, s: 0 },
    zero60: { v: 3.9, s: 0, kind: 'claimed', note: 'Porsche quotes 3.7 s with the optional Sport Chrono Package.' },
    top: { v: 183, s: 0, tag: 'top track speed' },
    sources: [
      { label: 'Porsche USA, 911 Carrera model page and technical data', url: 'https://www.porsche.com/usa/models/911/carrera-models/911-carrera/' },
      { label: 'Porsche Newsroom USA, “The 2025 Porsche 911 models”', url: 'https://newsroom.porsche.com/en_US/2024/products/porsche-new-911-world-premiere-hybrid-36337.html' },
    ],
  },
  {
    id: 'porsche-911-carrera-gts', make: 'Porsche', model: '911 Carrera GTS T-Hybrid', short: '911 GTS T-Hybrid', year: 2027,
    trim: 'Coupe, 8-speed PDK', family: '911', style: 'fastback',
    powertrain: 'Hybrid', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.6L flat-6 with electric turbocharger, plus a motor in the PDK',
    transmission: '8-speed PDK with integrated electric motor', transType: 'dct',
    hp: { v: 532, s: 0, tag: 'combined', note: 'The engine alone makes 478 hp.' },
    torque: { v: 449, s: 0, basis: 'system', tag: 'combined', note: 'The engine alone makes 420 lb-ft.' },
    eng: { hp: 478, tq: 420 },
    motor: { kw: 40, tq: 110 },
    eturboKw: 11,
    battery: { kwh: 1.9, volts: 400 },
    weight: { v: 3536, s: 0 },
    zero60: { v: 2.9, s: 0, kind: 'claimed', tag: 'Sport Chrono Package' },
    top: { v: 194, s: 0, tag: 'top track speed' },
    sources: [
      { label: 'Porsche USA, 911 Carrera GTS model page and technical data', url: 'https://www.porsche.com/usa/models/911/carrera-models/911-carrera-gts/' },
      { label: 'Porsche Newsroom USA, “The 2025 Porsche 911 models” (T-Hybrid system details)', url: 'https://newsroom.porsche.com/en_US/2024/products/porsche-new-911-world-premiere-hybrid-36337.html' },
    ],
  },

  // ---------- Hyundai N ----------
  {
    id: 'hyundai-ioniq-5-n', make: 'Hyundai', model: 'IONIQ 5 N', short: 'IONIQ 5 N', year: 2026,
    trim: 'Dual motor, all-wheel drive', family: 'ioniq5n', style: 'crossover',
    powertrain: 'EV', induction: null, drivetrain: 'AWD',
    engine: 'Dual motor, 84 kWh, 697 V',
    transmission: 'Single-speed reduction (simulated shifts available)', transType: 'single',
    hp: { v: 641, s: 0, tag: 'N Grin Boost', note: '601 hp normally; N Grin Boost raises it to 641 hp for 10 seconds.' },
    torque: { v: 568, s: 0, basis: 'system', tag: 'N Grin Boost', note: '545 lb-ft normally.' },
    weight: { v: 4861, s: 0 },
    zero60: { v: 3.25, s: 1, kind: 'claimed', tag: 'N Grin Boost' },
    top: { v: 162, s: 2, tag: 'limited', note: 'From Hyundai’s launch press release; the current spec page does not list top speed.' },
    sources: [
      { label: 'HyundaiUSA.com, 2026 IONIQ 5 N features and specs', url: 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n/compare-specs' },
      { label: 'HyundaiUSA.com, 2026 IONIQ 5 N overview (0–60 claim)', url: 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n' },
      { label: 'Hyundai Newsroom, IONIQ 5 N debut release (top speed)', url: 'https://www.hyundainews.com/en-us/releases/3996' },
    ],
  },
];

export const CAR_BY_ID = new Map(CARS.map((c) => [c.id, c]));

export const MAKES = [...new Set(CARS.map((c) => c.make))];

// Signature runs: each isolates one engineering trade-off. `covers` lists the
// generic trade-off sections the hand-written essay replaces; `word` is the
// display wordmark behind the showroom.
export const SIGNATURES = [
  {
    id: 'hybrid-ice',
    title: 'Hybrid vs gas',
    word: 'Hybrid',
    hook: 'Same 911, two answers to turbo lag: a twin-turbo flat-six against Porsche’s electrically spooled T-Hybrid.',
    cars: ['porsche-911-carrera', 'porsche-911-carrera-gts'],
    covers: ['electrified'],
  },
  {
    id: 'turbo-na',
    title: 'Turbo vs naturally aspirated',
    word: 'Boost',
    hook: 'Two rear-drive Toyotas: a flat torque plateau from 1,800 rpm against an engine that has to rev.',
    cars: ['toyota-gr86', 'toyota-gr-supra'],
    covers: ['aspiration', 'transmission'],
  },
  {
    id: 'awd-rwd',
    title: 'AWD vs RWD',
    word: 'Traction',
    hook: 'Same M3, same engine and gearbox. The only real variable is which wheels get the torque.',
    cars: ['bmw-m3-competition', 'bmw-m3-competition-xdrive'],
    covers: ['drivetrain'],
  },
];

export const DEFAULT_RUN = 'hybrid-ice';
