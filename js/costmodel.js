// Total cost of ownership and lifetime CO2, as pure functions (tested in js/tests.js).
// Internally everything is per US mile and per US gallon, in the region's currency.
import { REGIONS, FACTORS, FAMILY_BY_ID, FAMILIES, SPEC_LINKS } from './costdata.js';

export const L_PER_GAL = 3.785411784;
export const KM_PER_MI = 1.609344;

// Fuel price per US gallon in local currency.
export function perGallon(price) {
  return price.unit === 'L' ? price.v * L_PER_GAL : price.v;
}

// Resolved inputs for one scenario: region defaults with any user overrides applied.
export function scenario(cost) {
  const r = REGIONS[cost.region] ?? REGIONS.us;
  const fam = FAMILY_BY_ID.get(cost.fam) ?? FAMILIES[0];
  const fx = r.fx.v;
  return {
    region: r,
    fam,
    fx,
    regular: cost.fr ?? perGallon(r.regular),     // per gallon, local
    premium: cost.fp ?? perGallon(r.premium),
    elec: cost.el ?? r.elec.v,                     // per kWh, local
    grid: cost.gr ?? r.grid.v,                     // g CO2e per kWh
    miles: cost.mi * cost.yrs,
    annual: cost.mi,
    years: cost.yrs,
    includeBattery: cost.batt !== false,
    prices: fam.variants.map((v, i) => cost.p?.[i] ?? Math.round(v.price.v * fx)),
    incentives: fam.variants.map((v, i) => cost.i?.[i] ?? 0),
    maint: {
      ICE: FACTORS.maint.ICE.v * fx,
      Hybrid: FACTORS.maint.Hybrid.v * fx,
      EV: FACTORS.maint.EV.v * fx,
    },
  };
}

// Per-mile running costs and emissions for one variant.
export function rates(v, s) {
  const isEV = v.pt === 'EV';
  const energy = isEV ? (v.kwh100.v / 100) * s.elec : (v.fuel === 'premium' ? s.premium : s.regular) / v.mpg.v;
  const co2 = isEV ? (v.kwh100.v / 100) * s.grid : FACTORS.gasCo2PerGal.v / v.mpg.v;   // g per mile
  const upfrontKg = isEV && s.includeBattery ? v.batteryKwh * FACTORS.batteryKgPerKwh.v : 0;
  return { energy, maint: s.maint[v.pt], perMile: energy + s.maint[v.pt], co2, upfrontKg };
}

export function cumulativeCost(upfront, perMile, miles) { return upfront + perMile * miles; }
export function cumulativeCo2Kg(upfrontKg, gPerMile, miles) { return upfrontKg + (gPerMile * miles) / 1000; }

// Distance at which two straight lines (upfront + slope * miles) cross, or null if they never do.
export function breakEven(upA, slopeA, upB, slopeB) {
  if (slopeA === slopeB) return null;
  const x = (upB - upA) / (slopeA - slopeB);
  return x > 0 ? x : null;
}

export function results(cost) {
  const s = scenario(cost);
  const rows = s.fam.variants.map((v, i) => {
    const r = rates(v, s);
    const upfront = s.prices[i] - s.incentives[i];
    return {
      v, i, ...r, upfront,
      energyTotal: r.energy * s.miles,
      maintTotal: r.maint * s.miles,
      tco: cumulativeCost(upfront, r.perMile, s.miles),
      lifeKg: cumulativeCo2Kg(r.upfrontKg, r.co2, s.miles),
    };
  });
  // Cost break-evens: each pricier-upfront option against the cheapest-upfront one.
  const base = rows.reduce((a, b) => (b.upfront < a.upfront ? b : a));
  const costBE = rows.filter((r) => r !== base).map((r) => ({
    from: base, to: r, miles: breakEven(base.upfront, base.perMile, r.upfront, r.perMile),
  }));
  // Carbon break-evens: each option with manufacturing emissions against the family's gas car.
  const cbase = rows.find((r) => r.v.pt === 'ICE') ?? rows.reduce((a, b) => (b.upfrontKg < a.upfrontKg ? b : a));
  const carbonBE = rows.filter((r) => r !== cbase && r.upfrontKg > cbase.upfrontKg).map((r) => ({
    from: cbase, to: r, miles: breakEven(cbase.upfrontKg * 1000, cbase.co2, r.upfrontKg * 1000, r.co2),
  }));
  const cheapest = rows.reduce((a, b) => (b.tco < a.tco ? b : a));
  const cleanest = rows.reduce((a, b) => (b.lifeKg < a.lifeKg ? b : a));
  return { s, rows, costBE, carbonBE, cheapest, cleanest };
}

// Pick the cost family (and highlight variants) from the cars in Spec Comparison.
export function carryOver(carIds) {
  const links = carIds.map((id) => ({ id, link: SPEC_LINKS[id] })).filter((x) => x.link);
  if (!links.length) return null;
  // Prefer a car that has a direct gas/hybrid/EV counterpart over one that only maps to a family.
  const fam = (links.find((x) => x.link.variant) ?? links[0]).link.fam;
  return {
    fam,
    variants: links.filter((x) => x.link.fam === fam && x.link.variant).map((x) => x.link.variant),
    links: links.filter((x) => x.link.fam === fam),
  };
}
