// Every figure below was read from a manufacturer document on CHECKED.
// Values are stored in the units the maker publishes (US: mph, SAE net hp, lb, lb-ft).
//
// Spec shape: { v, s, rpm?, basis?, tag?, note? }
//   v      the number, or null when it could not be confirmed ("unverified" in the UI)
//   s      index into the car's `sources` array
//   basis  for torque: 'system' (what drives the wheels), 'engine' (engine only), 'motor'
//   tag    short qualifier shown next to the value
//   note   why a value is missing, or a caveat worth reading
//
// zero60.kind is always 'claimed': 0-60 times here are manufacturer claims, not tests.

export const CHECKED = '2026-09-13';

const toyotaSpecs = (slug, year, model) => ({
  label: `Toyota.com, ${year} ${model} full specifications`,
  url: `https://www.toyota.com/${slug}/features/`,
});

const NO_ZERO60 = 'The manufacturer does not publish a 0–60 time for this model, and no instrumented test could be confirmed for this page.';
const NO_TOP = 'The manufacturer does not publish a top speed for this model.';

export const CARS = [
  // ---------- Toyota ----------
  {
    id: 'toyota-prius', make: 'Toyota', model: 'Prius', short: 'Prius', year: 2027,
    trim: 'LE, front-wheel drive', family: 'prius',
    powertrain: 'Hybrid', induction: 'na', drivetrain: 'FWD',
    engine: '2.0L 4-cyl + 2 motor-generators',
    transmission: 'e-CVT (power-split planetary)', transType: 'ecvt',
    hp: { v: 194, s: 0, tag: 'system net' },
    torque: { v: 139, s: 0, basis: 'engine', rpm: '4,400–5,200',
      note: 'Engine only. Toyota does not publish a combined hybrid-system torque figure.' },
    eng: { hp: 150, hpRpm: '6,000', tq: 139, tqRpm: '4,400–5,200' },
    motor: { kw: 83, hp: 111 },
    weight: { v: 3097, s: 0 },
    zero60: { v: 7.2, s: 1, kind: 'claimed' },
    top: { v: null, note: NO_TOP },
    sources: [
      toyotaSpecs('prius', 2027, 'Prius'),
      { label: 'Toyota.com, 2027 Prius overview (0–60 claim: 7.2 s FWD, 7.0 s AWD)', url: 'https://www.toyota.com/prius/' },
    ],
  },
  {
    id: 'toyota-corolla-hybrid', make: 'Toyota', model: 'Corolla Hybrid', short: 'Corolla Hybrid', year: 2027,
    trim: 'LE, front-wheel drive', family: 'corolla',
    powertrain: 'Hybrid', induction: 'na', drivetrain: 'FWD',
    engine: '1.8L 4-cyl + 2 motor-generators',
    transmission: 'e-CVT (power-split planetary)', transType: 'ecvt',
    hp: { v: 138, s: 0, tag: 'system net' },
    torque: { v: 105, s: 0, basis: 'engine',
      note: 'Engine only. Toyota does not publish a combined hybrid-system torque figure.' },
    eng: { hp: 96, hpRpm: null, tq: 105, tqRpm: null },
    weight: { v: null, note: 'Toyota.com leaves the 2027 Corolla curb-weight field blank, and the Toyota pressroom spec sheet blocks automated access, so no figure could be confirmed.' },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [toyotaSpecs('corolla', 2027, 'Corolla and Corolla Hybrid')],
  },
  {
    id: 'toyota-corolla', make: 'Toyota', model: 'Corolla', short: 'Corolla', year: 2027,
    trim: 'LE sedan', family: 'corolla',
    powertrain: 'NA', induction: 'na', drivetrain: 'FWD',
    engine: '2.0L 4-cyl',
    transmission: 'CVT (Dynamic-Shift, with launch gear)', transType: 'cvt',
    hp: { v: 169, s: 0, rpm: '6,600' },
    torque: { v: 151, s: 0, rpm: '4,400', basis: 'system' },
    weight: { v: null, note: 'Toyota.com leaves the 2027 Corolla curb-weight field blank, and the Toyota pressroom spec sheet blocks automated access, so no figure could be confirmed.' },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [toyotaSpecs('corolla', 2027, 'Corolla and Corolla Hybrid')],
  },
  {
    id: 'toyota-camry', make: 'Toyota', model: 'Camry', short: 'Camry', year: 2026,
    trim: 'LE, front-wheel drive', family: 'camry',
    powertrain: 'Hybrid', induction: 'na', drivetrain: 'FWD',
    engine: '2.5L 4-cyl + 2 motor-generators',
    transmission: 'e-CVT (power-split planetary)', transType: 'ecvt',
    hp: { v: 225, s: 0, tag: 'system net' },
    torque: { v: 163, s: 0, basis: 'engine', rpm: '3,600–5,200',
      note: 'Engine only. Toyota does not publish a combined hybrid-system torque figure.' },
    eng: { hp: 184, hpRpm: '6,000', tq: 163, tqRpm: '3,600–5,200' },
    motor: { kw: 100, hp: 134 },
    weight: { v: 3450, s: 0 },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [toyotaSpecs('camry', 2026, 'Camry')],
  },
  {
    id: 'toyota-gr86', make: 'Toyota', model: 'GR86', short: 'GR86', year: 2027,
    trim: 'Base, 6-speed manual', family: 'gr86',
    powertrain: 'NA', induction: 'na', drivetrain: 'RWD',
    engine: '2.4L flat-4',
    transmission: '6-speed manual', transType: 'manual',
    hp: { v: 228, s: 0, rpm: '7,000' },
    torque: { v: 184, s: 0, rpm: '3,700', basis: 'system' },
    weight: { v: 2811, s: 0 },
    zero60: { v: 6.1, s: 0, kind: 'claimed', tag: 'manual',
      note: 'Toyota lists 6.6 s for the 6-speed automatic.' },
    top: { v: 140, s: 0, note: 'Toyota lists 134 mph for the automatic.' },
    sources: [toyotaSpecs('gr86', 2027, 'GR86')],
  },
  {
    id: 'toyota-gr-supra', make: 'Toyota', model: 'GR Supra 3.0', short: 'GR Supra', year: 2026,
    trim: '3.0, 8-speed automatic', family: 'supra',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.0L turbo inline-6',
    transmission: '8-speed automatic', transType: 'auto',
    hp: { v: 382, s: 0, rpm: '5,800–6,500' },
    torque: { v: 368, s: 0, rpm: '1,800–5,000', basis: 'system' },
    weight: { v: 3400, s: 0 },
    zero60: { v: 3.9, s: 0, kind: 'claimed', tag: 'automatic',
      note: 'Toyota lists 4.2 s for the 6-speed manual.' },
    top: { v: 155, s: 0, tag: 'limited' },
    sources: [toyotaSpecs('grsupra', 2026, 'GR Supra')],
  },
  {
    id: 'toyota-gr-corolla', make: 'Toyota', model: 'GR Corolla', short: 'GR Corolla', year: 2026,
    trim: 'Core, 6-speed manual', family: 'gr-corolla',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'AWD',
    awdNote: 'GR-FOUR: front:rear torque split of 60:40 (Normal), 60:40 to 30:70 (Track), 50:50 (Gravel)',
    engine: '1.6L turbo 3-cyl',
    transmission: '6-speed manual (iMT, rev-matching)', transType: 'manual',
    hp: { v: 300, s: 0, rpm: '6,500' },
    torque: { v: 295, s: 0, rpm: '3,250–4,600', basis: 'system' },
    weight: { v: 3296, s: 0 },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: 142.9, s: 0, tag: 'limited' },
    sources: [toyotaSpecs('grcorolla', 2026, 'GR Corolla')],
  },
  {
    id: 'toyota-rav4-phev', make: 'Toyota', model: 'RAV4 Plug-in Hybrid', short: 'RAV4 PHEV', year: 2026,
    trim: 'SE', family: 'rav4',
    powertrain: 'PHEV', induction: 'na', drivetrain: 'AWD',
    engine: '2.5L 4-cyl + front/rear motors (150/40 kW)',
    transmission: 'e-CVT (power-split planetary)', transType: 'ecvt',
    hp: { v: 324, s: 0, tag: 'combined net' },
    torque: { v: null, note: 'Toyota’s sheet lists a 170 lb-ft maximum torque without saying whether it is the engine or a motor, so it is not used here.' },
    weight: { v: 4435, s: 0 },
    zero60: { v: 5.4, s: 1, kind: 'claimed' },
    top: { v: null, note: NO_TOP },
    sources: [
      toyotaSpecs('rav4pluginhybrid', 2026, 'RAV4 Plug-in Hybrid'),
      { label: 'Toyota.com, 2026 RAV4 Plug-in Hybrid overview (0–60 claim)', url: 'https://www.toyota.com/rav4pluginhybrid/' },
    ],
  },
  {
    id: 'toyota-bz', make: 'Toyota', model: 'bZ', short: 'bZ AWD', year: 2027,
    trim: 'XLE, all-wheel drive', family: 'bz',
    powertrain: 'EV', induction: null, drivetrain: 'AWD',
    engine: 'Dual motor, 224/118 hp front/rear, 74.7 kWh',
    transmission: 'Single-speed reduction', transType: 'single',
    hp: { v: 338, s: 0, tag: 'system' },
    torque: { v: null, note: 'Toyota lists motor torque separately (198 lb-ft front, 125 lb-ft rear) and no combined figure.' },
    weight: { v: 4376, s: 0 },
    zero60: { v: 4.9, s: 1, kind: 'claimed',
      note: 'From Toyota’s 2027 bZ press release. The pressroom blocks automated access, so this was read from its search-indexed text.' },
    top: { v: null, note: NO_TOP },
    sources: [
      toyotaSpecs('bz', 2027, 'bZ'),
      { label: 'Toyota Newsroom, “Everyday Electric Confidence Returns for 2027 with Toyota bZ”', url: 'https://pressroom.toyota.com/everyday-electric-confidence-returns-for-2027-with-toyota-bz/' },
    ],
  },

  // ---------- Honda ----------
  {
    id: 'honda-civic-type-r', make: 'Honda', model: 'Civic Type R', short: 'Civic Type R', year: 2026,
    trim: '6-speed manual', family: 'civic-type-r',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'FWD',
    engine: '2.0L turbo 4-cyl, helical limited-slip differential',
    transmission: '6-speed manual (rev-match)', transType: 'manual',
    hp: { v: 315, s: 0, rpm: '6,500' },
    torque: { v: 310, s: 0, rpm: '2,600–4,000', basis: 'system' },
    weight: { v: 3188, s: 0 },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [{ label: 'Honda News, 2026 Civic Type R specifications and features', url: 'https://hondanews.com/en-US/honda-automobiles/releases/release-80046da63cbf9f2582c8895ecb00c4b6-2026-honda-civic-type-r-specifications-features' }],
  },
  {
    id: 'honda-civic-hybrid', make: 'Honda', model: 'Civic Sport Hybrid', short: 'Civic Hybrid', year: 2026,
    trim: 'Sport Hybrid sedan', family: 'civic',
    powertrain: 'Hybrid', induction: 'na', drivetrain: 'FWD',
    engine: '2.0L 4-cyl + generator motor + traction motor',
    transmission: 'Two-motor hybrid, direct drive', transType: 'direct',
    hp: { v: 200, s: 0, tag: 'total system' },
    torque: { v: 232, s: 0, basis: 'motor', rpm: '0–2,000',
      note: 'Traction-motor torque. In Honda’s two-motor system the motor alone drives the wheels in most driving.' },
    eng: { hp: 141, hpRpm: '6,000', tq: 134, tqRpm: '4,500' },
    motor: { hp: 181 },
    weight: { v: 3208, s: 0 },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [{ label: 'Honda News, 2026 Civic Sedan specifications and features', url: 'https://hondanews.com/en-US/honda-automobiles/releases/release-395467bf3b280929feeb74845f0060f5-2026-honda-civic-sedan-specifications-features' }],
  },
  {
    id: 'honda-civic-sport', make: 'Honda', model: 'Civic Sport', short: 'Civic Sport', year: 2026,
    trim: 'Sport sedan', family: 'civic',
    powertrain: 'NA', induction: 'na', drivetrain: 'FWD',
    engine: '2.0L 4-cyl',
    transmission: 'CVT', transType: 'cvt',
    hp: { v: 150, s: 0, rpm: '6,400' },
    torque: { v: 133, s: 0, rpm: '4,000–5,000', basis: 'system' },
    weight: { v: 2926, s: 0 },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [{ label: 'Honda News, 2026 Civic Sedan specifications and features', url: 'https://hondanews.com/en-US/honda-automobiles/releases/release-395467bf3b280929feeb74845f0060f5-2026-honda-civic-sedan-specifications-features' }],
  },

  // ---------- Mazda ----------
  {
    id: 'mazda-mx5', make: 'Mazda', model: 'MX-5 Miata', short: 'MX-5', year: 2026,
    trim: 'Soft top, 6-speed manual', family: 'mx5',
    powertrain: 'NA', induction: 'na', drivetrain: 'RWD',
    engine: '2.0L 4-cyl',
    transmission: '6-speed manual', transType: 'manual',
    hp: { v: 181, s: 0 },
    torque: { v: 151, s: 0, basis: 'system' },
    weight: { v: 2366, s: 0 },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [{ label: 'MazdaUSA.com, 2026 MX-5 Miata', url: 'https://www.mazdausa.com/vehicles/mx-5-miata' }],
  },

  // ---------- Ford ----------
  {
    id: 'ford-mustang-gt', make: 'Ford', model: 'Mustang GT Fastback', short: 'Mustang GT', year: 2026,
    trim: 'GT Fastback, 6-speed manual', family: 'mustang',
    powertrain: 'NA', induction: 'na', drivetrain: 'RWD',
    engine: '5.0L V8',
    transmission: '6-speed manual (rev-matching)', transType: 'manual',
    hp: { v: 480, s: 0, note: '486 hp with the optional active-valve exhaust.' },
    torque: { v: 415, s: 0, basis: 'system', note: '418 lb-ft with the optional active-valve exhaust.' },
    weight: { v: 3731, s: 1,
      note: 'From Ford’s 2026 Mustang technical specifications. The PDF is encrypted, so it was read from its search-indexed text.' },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [
      { label: 'Ford.com, 2026 Mustang GT Fastback', url: 'https://www.ford.com/cars/mustang/models/gt-fastback/' },
      { label: 'Ford Media, 2026 Mustang technical specifications (PDF)', url: 'https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2026/specs/2026_Mustang_Technical_Specs.pdf' },
    ],
  },
  {
    id: 'ford-mustang-ecoboost', make: 'Ford', model: 'Mustang EcoBoost Fastback', short: 'Mustang EcoBoost', year: 2026,
    trim: 'EcoBoost Fastback, 10-speed automatic', family: 'mustang',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '2.3L turbo 4-cyl',
    transmission: '10-speed automatic', transType: 'auto',
    hp: { v: 315, s: 0 },
    torque: { v: 350, s: 0, basis: 'system' },
    weight: { v: 3573, s: 1,
      note: 'From Ford’s 2026 Mustang technical specifications. The PDF is encrypted, so it was read from its search-indexed text.' },
    zero60: { v: null, note: NO_ZERO60 },
    top: { v: null, note: NO_TOP },
    sources: [
      { label: 'Ford.com, 2026 Mustang EcoBoost Fastback', url: 'https://www.ford.com/cars/mustang/models/ecoboost-fastback/' },
      { label: 'Ford Media, 2026 Mustang technical specifications (PDF)', url: 'https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2026/specs/2026_Mustang_Technical_Specs.pdf' },
    ],
  },

  // ---------- BMW ----------
  {
    id: 'bmw-m3-competition', make: 'BMW', model: 'M3 Competition', short: 'M3 Comp', year: 2025,
    trim: 'Competition sedan, rear-wheel drive', family: 'm3',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'RWD',
    engine: '3.0L twin-turbo inline-6',
    transmission: '8-speed automatic', transType: 'auto',
    hp: { v: 503, s: 0, rpm: '6,250' },
    torque: { v: 479, s: 0, rpm: '2,750–5,500', basis: 'system' },
    weight: { v: 3891, s: 0 },
    zero60: { v: 3.8, s: 0, kind: 'claimed' },
    top: { v: 155, s: 0, tag: 'limited', note: '180 mph with the M Driver’s Package.' },
    sources: [{ label: 'BMW Group PressClub USA, “The new 2025 BMW M3”', url: 'https://www.press.bmwgroup.com/usa/article/detail/T0442408EN_US/the-new-2025-bmw-m3?language=en_US' }],
  },
  {
    id: 'bmw-m3-competition-xdrive', make: 'BMW', model: 'M3 Competition M xDrive', short: 'M3 Comp xDrive', year: 2025,
    trim: 'Competition sedan, M xDrive', family: 'm3',
    powertrain: 'Turbo', induction: 'turbo', drivetrain: 'AWD',
    awdNote: 'M xDrive: rear-biased, with 4WD, 4WD Sport and 2WD modes',
    engine: '3.0L twin-turbo inline-6',
    transmission: '8-speed automatic', transType: 'auto',
    hp: { v: 523, s: 0, rpm: '6,250' },
    torque: { v: 479, s: 0, rpm: '2,750–5,730', basis: 'system' },
    weight: { v: 3990, s: 0 },
    zero60: { v: 3.4, s: 0, kind: 'claimed' },
    top: { v: 155, s: 0, tag: 'limited', note: '180 mph with the M Driver’s Package.' },
    sources: [{ label: 'BMW Group PressClub USA, “The new 2025 BMW M3”', url: 'https://www.press.bmwgroup.com/usa/article/detail/T0442408EN_US/the-new-2025-bmw-m3?language=en_US' }],
  },

  // ---------- Hyundai ----------
  {
    id: 'hyundai-ioniq-5-n', make: 'Hyundai', model: 'IONIQ 5 N', short: 'IONIQ 5 N', year: 2026,
    trim: 'Dual motor, all-wheel drive', family: 'ioniq5n',
    powertrain: 'EV', induction: null, drivetrain: 'AWD',
    engine: 'Dual motor, 84 kWh, 697 V',
    transmission: 'Single-speed reduction (simulated shifts available)', transType: 'single',
    hp: { v: 641, s: 0, tag: 'N Grin Boost', note: '601 hp normally; N Grin Boost raises it to 641 hp for 10 seconds.' },
    torque: { v: 568, s: 0, basis: 'system', tag: 'N Grin Boost', note: '545 lb-ft normally.' },
    weight: { v: 4861, s: 0 },
    zero60: { v: 3.25, s: 1, kind: 'claimed', tag: 'N Grin Boost' },
    top: { v: null, note: 'Hyundai USA’s current spec page does not list a top speed.' },
    sources: [
      { label: 'HyundaiUSA.com, 2026 IONIQ 5 N features and specs', url: 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n/compare-specs' },
      { label: 'HyundaiUSA.com, 2026 IONIQ 5 N overview (0–60 claim)', url: 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n' },
    ],
  },
];

export const CAR_BY_ID = new Map(CARS.map((c) => [c.id, c]));

export const MAKES = [...new Set(CARS.map((c) => c.make))];

// Signature runs: each isolates one engineering trade-off. `covers` lists the
// generic trade-off sections the hand-written essay replaces.
export const SIGNATURES = [
  {
    id: 'hybrid-ice',
    title: 'Hybrid vs gas',
    hook: 'Toyota’s power-split hybrid, Honda’s two-motor hybrid, and the gas Civic both hybrids are measured against.',
    cars: ['toyota-prius', 'honda-civic-hybrid', 'honda-civic-sport'],
    covers: ['electrified', 'transmission', 'aspiration'],
  },
  {
    id: 'turbo-na',
    title: 'Turbo vs naturally aspirated',
    hook: 'Two rear-drive Toyotas: a flat torque plateau from 1,800 rpm against an engine that has to rev.',
    cars: ['toyota-gr86', 'toyota-gr-supra'],
    covers: ['aspiration', 'transmission'],
  },
  {
    id: 'awd-rwd',
    title: 'AWD vs RWD',
    hook: 'Same M3, same engine and gearbox. The only real variable is which wheels get the torque.',
    cars: ['bmw-m3-competition', 'bmw-m3-competition-xdrive'],
    covers: ['drivetrain'],
  },
];

export const DEFAULT_RUN = 'hybrid-ice';
