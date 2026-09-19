// Cost & Emissions data. Every value carries a source key and a kind:
//   'sourced'      read from the cited document on COST_CHECKED
//   'illustrative' a stated assumption the user should adjust
// US vehicle prices are manufacturer MSRPs in USD; other regions convert them
// at the cited exchange rate, which is labeled illustrative because local
// prices differ.

export const COST_CHECKED = '2026-09-19';

export const SOURCES = {
  epa: { label: 'U.S. EPA / DOE, fueleconomy.gov vehicle records (2026 models)', url: 'https://www.fueleconomy.gov/feg/findacar.shtml' },
  toyotaCorolla: { label: 'Toyota.com, 2027 Corolla and Corolla Hybrid specifications (Base MSRP)', url: 'https://www.toyota.com/corolla/features/' },
  toyotaBz: { label: 'Toyota.com, 2027 bZ specifications (Base MSRP, battery capacity)', url: 'https://www.toyota.com/bz/features/' },
  hyundaiTucson: { label: 'HyundaiUSA.com, 2026 Tucson and Tucson Hybrid pricing', url: 'https://www.hyundaiusa.com/us/en/vehicles/tucson/compare-specs' },
  hyundaiIoniq5: { label: 'HyundaiUSA.com, 2027 IONIQ 5 pricing and battery capacity', url: 'https://www.hyundaiusa.com/us/en/vehicles/ioniq-5/compare-specs' },
  porsche911: { label: 'Porsche USA, 911 Carrera models and pricing', url: 'https://www.porsche.com/usa/models/911/carrera-models/911-carrera-gts/' },
  porscheTaycan: { label: 'Porsche USA, Taycan pricing and battery capacity', url: 'https://www.porsche.com/usa/models/taycan/taycan-models/taycan/' },
  eiaGas: { label: 'EIA Gasoline and Diesel Fuel Update, week of Sep 14, 2026', url: 'https://www.eia.gov/petroleum/gasdiesel/' },
  eiaGrade: { label: 'EIA weekly U.S. retail gasoline prices by grade, week of Sep 14, 2026', url: 'https://www.eia.gov/dnav/pet/pet_pri_gnd_dcus_nus_w.htm' },
  eiaElec: { label: 'EIA Electric Power Monthly, Table 5.6.A, residential, June 2026', url: 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a' },
  desnz: { label: 'DESNZ weekly road fuel prices, week of 14 Sep 2026 (ULSP)', url: 'https://www.gov.uk/government/statistics/weekly-road-fuel-prices' },
  ofgem: { label: 'Ofgem energy price cap, 1 Oct to 31 Dec 2026 (direct debit, no VAT in this period)', url: 'https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-october-and-31-december-2026' },
  uaeFuel: { label: 'UAE Fuel Price Committee, September 2026 retail prices (as reported by Khaleej Times)', url: 'https://www.khaleejtimes.com/business/energy/uae-petrol-diesel-prices-september-2026-announced' },
  dewa: { label: 'DEWA slab tariff and September 2026 fuel surcharge (Dubai)', url: 'https://www.dewa.gov.ae/en/consumer/billing/slab-tariff' },
  saFuel: { label: 'Saudi Aramco retail gasoline prices, capped since July 2021 (as reported by GlobalPetrolPrices)', url: 'https://www.globalpetrolprices.com/Saudi-Arabia/gasoline_prices/' },
  sera: { label: 'Saudi Electricity Regulatory Authority, residential consumption tariff', url: 'https://www.sera.gov.sa/en/consumer/electric-tariff/electric-tariff-categories/consumption-tariff' },
  ember: { label: 'Ember, via Our World in Data: lifecycle carbon intensity of electricity', url: 'https://ourworldindata.org/grapher/carbon-intensity-electricity' },
  epaCo2: { label: 'U.S. EPA: 8,887 g CO2 per gallon of gasoline burned (tailpipe)', url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle' },
  anl: { label: 'Argonne National Laboratory (2021), Comprehensive Total Cost of Ownership Quantification', url: 'https://www.anl.gov/argonne-scientific-publications/pub/167399' },
  icct: { label: 'ICCT (2021), A global comparison of the life-cycle GHG emissions of combustion engine and electric passenger cars', url: 'https://theicct.org/sites/default/files/publications/Global-LCA-passenger-cars-jul2021_0.pdf' },
  ecb: { label: 'ECB euro reference rates, 18 Sep 2026 (USD 1.1460, GBP 0.85880 per EUR)', url: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html' },
  pegAed: { label: 'Central Bank of the UAE: dirham pegged at AED 3.6725 per USD', url: 'https://www.centralbank.ae/en/' },
  pegSar: { label: 'Saudi Central Bank (SAMA): riyal pegged at SAR 3.75 per USD', url: 'https://www.sama.gov.sa/en-US/' },
};

// Region presets. Fuel prices are stored as published: per US gallon ('gal') or per litre ('L'),
// in local currency. Electricity per kWh in local currency. Grid intensity in g CO2e per kWh.
export const REGIONS = {
  us: {
    name: 'United States', short: 'US', currency: 'USD',
    fx: { v: 1, src: null, kind: 'sourced', note: 'Prices are US MSRPs in USD.' },
    regular: { v: 4.319, unit: 'gal', src: 'eiaGas', kind: 'sourced', note: 'U.S. average regular, all formulations.' },
    premium: { v: 5.316, unit: 'gal', src: 'eiaGrade', kind: 'sourced', note: 'U.S. average premium, all formulations.' },
    elec: { v: 0.1834, src: 'eiaElec', kind: 'sourced', note: 'U.S. average residential price, 18.34 ¢/kWh. Public DC fast charging usually costs more.' },
    grid: { v: 384.4, year: 2025, src: 'ember', kind: 'sourced' },
  },
  uk: {
    name: 'United Kingdom', short: 'UK', currency: 'GBP',
    fx: { v: 0.85880 / 1.1460, src: 'ecb', kind: 'illustrative', note: 'US MSRP converted at the ECB cross rate. UK list prices differ; edit them.' },
    regular: { v: 1.6814, unit: 'L', src: 'desnz', kind: 'sourced', note: 'UK average unleaded, 168.14 p/L including duty and VAT.' },
    premium: { v: 1.6814, unit: 'L', src: 'desnz', kind: 'illustrative', note: 'DESNZ publishes standard unleaded only, so premium-fuel cars use the unleaded price and are slightly understated.' },
    elec: { v: 0.2632, src: 'ofgem', kind: 'sourced', note: 'Ofgem cap average unit rate, 26.32 p/kWh. Standing charge excluded because you pay it with or without an EV.' },
    grid: { v: 217.41, year: 2025, src: 'ember', kind: 'sourced' },
  },
  uae: {
    name: 'United Arab Emirates (Dubai)', short: 'UAE', currency: 'AED', gulf: true,
    fx: { v: 3.6725, src: 'pegAed', kind: 'illustrative', note: 'US MSRP converted at the fixed peg. Gulf list prices differ; edit them.' },
    regular: { v: 3.69, unit: 'L', src: 'uaeFuel', kind: 'sourced', note: 'Special 95, AED 3.69/L (September 2026).' },
    premium: { v: 3.80, unit: 'L', src: 'uaeFuel', kind: 'sourced', note: 'Super 98, AED 3.80/L (September 2026).' },
    elec: { v: (0.230 + 0.060) * 1.05, src: 'dewa', kind: 'sourced', note: 'DEWA first slab (AED 0.230) plus September 2026 fuel surcharge (AED 0.060) plus 5% VAT. Home charging can push a household into higher slabs (up to AED 0.380).' },
    grid: { v: 467.51, year: 2024, src: 'ember', kind: 'sourced' },
  },
  sa: {
    name: 'Saudi Arabia', short: 'KSA', currency: 'SAR', gulf: true,
    fx: { v: 3.75, src: 'pegSar', kind: 'illustrative', note: 'US MSRP converted at the fixed peg. Saudi list prices differ; edit them.' },
    regular: { v: 2.18, unit: 'L', src: 'saFuel', kind: 'sourced', note: 'Gasoline 91, SAR 2.18/L, capped since July 2021.' },
    premium: { v: 2.33, unit: 'L', src: 'saFuel', kind: 'sourced', note: 'Gasoline 95, SAR 2.33/L, capped since July 2021.' },
    elec: { v: 0.18 * 1.15, src: 'sera', kind: 'sourced', note: 'Residential tier up to 6,000 kWh/month (SAR 0.18) plus 15% VAT.' },
    grid: { v: 691.95, year: 2024, src: 'ember', kind: 'sourced' },
  },
};

export const REGION_KEYS = Object.keys(REGIONS);

export const FACTORS = {
  gasCo2PerGal: { v: 8887, src: 'epaCo2', kind: 'sourced', note: 'Tailpipe CO2 only. The grid figures are lifecycle, so this comparison slightly favors gasoline; EV advantages shown are conservative.' },
  batteryKgPerKwh: { v: 60, src: 'icct', kind: 'sourced', note: 'Battery production for cells made in Europe or the US. Hybrid packs (about 1 kWh) and the rest of the car are left out because they are similar across powertrains.' },
  // Maintenance in USD per mile.
  maint: {
    ICE: { v: 0.101, src: 'anl', kind: 'sourced', note: 'Scheduled maintenance, conventional car.' },
    Hybrid: { v: 0.101, src: 'anl', kind: 'illustrative', note: 'Argonne reports hybrids save on brake wear but this page uses the conventional-car figure, which is conservative.' },
    EV: { v: 0.061, src: 'anl', kind: 'sourced', note: 'Scheduled maintenance, battery-electric car.' },
  },
  annualMiles: { v: 12000, kind: 'illustrative', note: 'Default only. Set your own mileage.' },
  years: { v: 8, kind: 'illustrative', note: 'Default only. Set your own ownership period.' },
};

// Families of comparable cars sold with different powertrains. `mpg` and `kwh100`
// are EPA combined figures (city/highway kept for the explainers).
export const FAMILIES = [
  {
    id: 'toyota', name: 'Toyota Corolla line', make: 'Toyota',
    variants: [
      { id: 'corolla', label: 'Corolla LE', year: 2027, pt: 'ICE', fuel: 'regular', mpg: { v: 34, city: 31, hwy: 38 }, price: { v: 23325, src: 'toyotaCorolla' } },
      { id: 'corolla-hybrid', label: 'Corolla Hybrid LE', year: 2027, pt: 'Hybrid', fuel: 'regular', mpg: { v: 50, city: 53, hwy: 46 }, price: { v: 25175, src: 'toyotaCorolla' } },
      { id: 'bz', label: 'bZ XLE FWD', year: 2027, pt: 'EV', kwh100: { v: 25.5044, city: 143, hwy: 119 }, batteryKwh: 74.7, rangeMi: 314, price: { v: 37980, src: 'toyotaBz' } },
    ],
  },
  {
    id: 'hyundai', name: 'Hyundai compact SUVs', make: 'Hyundai',
    variants: [
      { id: 'tucson', label: 'Tucson SE', year: 2026, pt: 'ICE', fuel: 'regular', mpg: { v: 28, city: 25, hwy: 33 }, price: { v: 29700, src: 'hyundaiTucson' } },
      { id: 'tucson-hybrid', label: 'Tucson Hybrid Blue', year: 2026, pt: 'Hybrid', fuel: 'regular', mpg: { v: 38, city: 38, hwy: 38 }, price: { v: 31300, src: 'hyundaiTucson' } },
      { id: 'ioniq5', label: 'IONIQ 5 SE Standard Range', year: 2027, pt: 'EV', kwh100: { v: 29.0, city: 131, hwy: 100 }, batteryKwh: 63, rangeMi: 245, price: { v: 35250, src: 'hyundaiIoniq5' } },
    ],
  },
  {
    id: 'porsche', name: 'Porsche sports cars', make: 'Porsche',
    variants: [
      { id: '911', label: '911 Carrera', year: 2027, pt: 'ICE', fuel: 'premium', mpg: { v: 21, city: 18, hwy: 25 }, price: { v: 135500, src: 'porsche911' } },
      { id: '911-gts', label: '911 Carrera GTS T-Hybrid', year: 2027, pt: 'Hybrid', fuel: 'premium', mpg: { v: 20, city: 17, hwy: 24 }, price: { v: 181000, src: 'porsche911' } },
      { id: 'taycan', label: 'Taycan', year: 2027, pt: 'EV', kwh100: { v: 37.0713, city: 94, hwy: 88 }, batteryKwh: 89, rangeMi: 274, price: { v: 111900, src: 'porscheTaycan' } },
    ],
  },
];

export const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

// How cars in Spec Comparison map onto a family (and, where it exists, the exact variant).
export const SPEC_LINKS = {
  'porsche-911-carrera': { fam: 'porsche', variant: '911', note: 'same car' },
  'porsche-911-carrera-gts': { fam: 'porsche', variant: '911-gts', note: 'same car' },
  'hyundai-ioniq-5-n': { fam: 'hyundai', variant: 'ioniq5', note: 'the standard IONIQ 5 on the same platform' },
  'toyota-gr-corolla': { fam: 'toyota', variant: 'corolla', note: 'the everyday Corolla line' },
  'toyota-gr86': { fam: 'toyota', note: 'no gas/hybrid/EV versions exist, so the Toyota family uses the Corolla line' },
  'toyota-gr-supra': { fam: 'toyota', note: 'no gas/hybrid/EV versions exist, so the Toyota family uses the Corolla line' },
};
