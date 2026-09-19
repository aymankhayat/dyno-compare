// Cost & Emissions view: the second mode of the tool. Reuses the spec mode's
// gauges, glass panels and colors; all math lives in js/costmodel.js.
import { REGIONS, REGION_KEYS, FAMILIES, FACTORS, SOURCES, COST_CHECKED } from './costdata.js';
import { results, L_PER_GAL, KM_PER_MI } from './costmodel.js';
import { createGauge } from './gauges.js';

const COLORS = ['var(--car-0)', 'var(--car-1)', 'var(--car-2)'];
const PT_NAME = { ICE: 'Gas', Hybrid: 'Hybrid', EV: 'Electric' };
const $ = (s) => document.querySelector(s);

function niceScale(max) {
  const raw = max <= 0 ? 1 : max * 1.15;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const top = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((m) => m >= raw);
  const major = top / 5;
  const digits = [0, 1, 2, 3, 4].find((d) => Math.abs(Math.round(major * 10 ** d) - major * 10 ** d) < 1e-6) ?? 4;
  return { max: top, major, minor: major / 2, digits };
}

// Tick values for chart axes, in display units.
function axisStep(max) {
  const raw = max / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((m) => m >= raw);
}

export function createCostView({ state, onChange }) {
  const gauges = {
    cpm: createGauge($('#g-cpm')),
    co2: createGauge($('#g-co2')),
    life: createGauge($('#g-life')),
  };
  let lastKey = '';

  const metric = () => state.units === 'metric';
  const dUnit = () => (metric() ? 'km' : 'mi');
  const toDisp = (miles) => (metric() ? miles * KM_PER_MI : miles);
  const fromDisp = (d) => (metric() ? d / KM_PER_MI : d);
  const perDisp = (perMile) => (metric() ? perMile / KM_PER_MI : perMile);
  const n0 = (v) => Math.round(v).toLocaleString('en-US');
  const money = (v, cur, d = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const dist = (miles) => `${n0(toDisp(miles))}&nbsp;${dUnit()}`;

  function badge(kind, srcKey) {
    const src = srcKey ? SOURCES[srcKey] : null;
    const tag = `<span class="kind ${kind}">${kind === 'sourced' ? 'Sourced' : 'Illustrative'}</span>`;
    return src ? `${tag} <a class="src-link" href="${src.url}" target="_blank" rel="noopener" title="${src.label}">source</a>` : tag;
  }

  // ------------------------------------------------------------------ hero
  function renderHero(R) {
    const { s } = R;
    const names = s.fam.variants.map((v) => v.label);
    $('#cost-title').innerHTML = `${names[0]} <span class="grad">vs ${names.slice(1).join(' vs ')}</span>`;
    $('#cost-hook').textContent = `${s.region.name}: ${n0(toDisp(s.annual))} ${dUnit()} a year for ${s.years} years. Purchase, energy and maintenance, plus lifetime CO2 on this region's grid.`;
    const carried = state.cost.carried;
    const car = $('#cost-carried');
    if (carried && carried.fam === s.fam.id) {
      car.innerHTML = `Carried over from Spec Comparison: ${carried.links.map((l) => `<b>${l.name}</b> (${l.link.note})`).join('; ')}.`;
      car.hidden = false;
    } else if (!carried && !state.cost.famLocked) {
      car.textContent = 'The cars in Spec Comparison aren’t sold with gas, hybrid and electric versions, so this starts with the Toyota Corolla line.';
      car.hidden = false;
    } else {
      car.hidden = true;
    }
    $('#fam-pills').innerHTML = FAMILIES.map((f) => `<button type="button" data-fam="${f.id}" aria-pressed="${f.id === s.fam.id}">${f.name}</button>`).join('');
    $('#region-pills').innerHTML = REGION_KEYS.map((k) => {
      const r = REGIONS[k];
      return `<button type="button" data-region="${k}" aria-pressed="${k === state.cost.region}">${r.short}${r.gulf ? '<small>Gulf</small>' : ''}</button>`;
    }).join('');

    $('#cost-cards').innerHTML = R.rows.map((r) => {
      const tags = [];
      if (r === R.cheapest) tags.push('<span class="win">Lowest cost</span>');
      if (r === R.cleanest) tags.push('<span class="win co2">Lowest CO2</span>');
      if (carried?.variants?.includes(r.v.id)) tags.push('<span class="from-spec">From your spec lineup</span>');
      return `
        <article class="cost-card glass c${r.i}">
          <p class="cc-head"><span class="ink-dot d${r.i}"></span><span class="cc-name">${r.v.year} ${r.v.label}</span><span class="pt-chip">${PT_NAME[r.v.pt]}</span></p>
          <p class="cc-total">${money(r.tco, s.region.currency)}</p>
          <p class="cc-sub">total cost over ${dist(s.miles)}</p>
          <dl class="cc-grid">
            <dt>Per ${dUnit()}</dt><dd>${money(perDisp(r.tco / s.miles), s.region.currency, 2)}</dd>
            <dt>Lifetime CO2</dt><dd>${(r.lifeKg / 1000).toFixed(1)}&nbsp;t</dd>
          </dl>
          ${tags.length ? `<p class="cc-tags">${tags.join('')}</p>` : ''}
        </article>`;
    }).join('');
  }

  // ------------------------------------------------------------------ inputs
  function renderInputs(R) {
    const { s } = R;
    const r = s.region;
    const cur = r.currency;
    const volUnit = metric() ? 'L' : 'gal';
    const toVol = (perGal) => (metric() ? perGal / L_PER_GAL : perGal);
    const miMax = metric() ? 64000 : 40000;
    const miStep = metric() ? 1000 : 500;

    $('#c-mi').min = metric() ? 2000 : 1000;
    $('#c-mi').max = miMax;
    $('#c-mi').step = miStep;
    $('#c-mi').value = Math.round(toDisp(s.annual) / miStep) * miStep;
    $('#c-mi-out').textContent = `${n0(toDisp(s.annual))} ${dUnit()} / year`;
    $('#c-mi-note').innerHTML = badge(FACTORS.annualMiles.kind);
    $('#c-yrs').value = s.years;
    $('#c-yrs-out').textContent = `${s.years} year${s.years === 1 ? '' : 's'}`;
    $('#c-batt').checked = s.includeBattery;

    const field = (id, label, value, unitText, kind, src, note, digits) => `
      <label class="cfield" for="${id}">
        <span class="cf-label">${label}</span>
        <span class="cf-input"><input id="${id}" type="number" inputmode="decimal" min="0" step="any" value="${value.toFixed(digits)}"><span class="cf-unit">${unitText}</span></span>
        <span class="cf-meta">${badge(kind, src)}${note ? ` <span class="cf-note">${note}</span>` : ''}</span>
      </label>`;
    $('#c-energy').innerHTML = [
      field('c-fr', 'Regular gasoline', toVol(s.regular), `${cur}/${volUnit}`, state.cost.fr != null ? 'illustrative' : r.regular.kind, state.cost.fr != null ? null : r.regular.src, state.cost.fr != null ? 'Your value.' : r.regular.note, 3),
      field('c-fp', 'Premium gasoline', toVol(s.premium), `${cur}/${volUnit}`, state.cost.fp != null ? 'illustrative' : r.premium.kind, state.cost.fp != null ? null : r.premium.src, state.cost.fp != null ? 'Your value.' : r.premium.note, 3),
      field('c-el', 'Electricity', s.elec, `${cur}/kWh`, state.cost.el != null ? 'illustrative' : r.elec.kind, state.cost.el != null ? null : r.elec.src, state.cost.el != null ? 'Your value.' : r.elec.note, 4),
      field('c-gr', 'Grid carbon intensity', s.grid, 'g CO2e/kWh', state.cost.gr != null ? 'illustrative' : r.grid.kind, state.cost.gr != null ? null : r.grid.src, state.cost.gr != null ? 'Your value.' : `${r.name}, ${r.grid.year}, lifecycle.`, 0),
    ].join('');

    $('#c-vehicles').innerHTML = `
      <table class="vtable">
        <thead><tr><th scope="col">Car</th><th scope="col">Purchase price (${cur})</th><th scope="col">Incentives (${cur})</th><th scope="col">EPA combined</th></tr></thead>
        <tbody>${s.fam.variants.map((v, i) => `
          <tr>
            <th scope="row"><span class="ink-dot d${i}"></span>${v.year} ${v.label}<small>${PT_NAME[v.pt]}</small></th>
            <td data-label="Purchase price (${cur})"><input type="number" min="0" step="100" data-price="${i}" value="${s.prices[i]}" aria-label="${v.label} purchase price">
              <small>${state.cost.p?.[i] != null ? 'Your value' : (cur === 'USD' ? `US MSRP ${badge('sourced', v.price.src)}` : `US MSRP converted ${badge('illustrative', r.fx.src)}`)}</small></td>
            <td data-label="Incentives (${cur})"><input type="number" min="0" step="100" data-incentive="${i}" value="${s.incentives[i]}" aria-label="${v.label} incentives"></td>
            <td class="epa">${v.pt === 'EV'
              ? `${metric() ? (v.kwh100.v / KM_PER_MI).toFixed(1) : v.kwh100.v.toFixed(1)} kWh/100 ${dUnit()}<small>${v.batteryKwh} kWh battery, ${dist(v.rangeMi)} range</small>`
              : `${metric() ? (235.215 / v.mpg.v).toFixed(1) + ' L/100 km' : v.mpg.v + ' mpg'}<small>${v.fuel} fuel ${badge('sourced', 'epa')}</small>`}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p class="fine">Incentives default to zero. Enter any purchase incentive you qualify for. Totals exclude insurance, registration, financing and resale value, which vary more by buyer than by powertrain.</p>`;
  }

  // ------------------------------------------------------------------ gauges
  function renderGauges(R, sweep) {
    const { s, rows } = R;
    const cur = s.region.currency;
    const cpm = rows.map((r) => perDisp(r.perMile));
    const co2 = rows.map((r) => perDisp(r.co2));
    const life = rows.map((r) => r.lifeKg / 1000);
    gauges.cpm.update({
      title: `Running cost per ${dUnit()}`, scale: niceScale(Math.max(...cpm)), unit: `${cur}/${dUnit()}`.toUpperCase(), sweep,
      needles: cpm.map((v) => ({ value: v })),
      readouts: rows.map((r, i) => ({ name: r.v.label, text: money(cpm[i], cur, cpm[i] < 1 ? 3 : 2), note: `energy ${money(perDisp(r.energy), cur, 3)} + maintenance ${money(perDisp(r.maint), cur, 3)}` })),
      label: `Running cost per ${dUnit()}: ${rows.map((r, i) => `${r.v.label} ${money(cpm[i], cur, 3)}`).join(', ')}`,
    });
    gauges.co2.update({
      title: `Use-phase CO2 per ${dUnit()}`, scale: niceScale(Math.max(...co2)), unit: `G/${dUnit()}`.toUpperCase(), sweep,
      needles: co2.map((v) => ({ value: v })),
      readouts: rows.map((r, i) => ({ name: r.v.label, text: `${n0(co2[i])} g`, note: r.v.pt === 'EV' ? `at ${n0(s.grid)} g/kWh grid` : 'tailpipe' })),
      label: `CO2 per ${dUnit()}: ${rows.map((r, i) => `${r.v.label} ${n0(co2[i])} grams`).join(', ')}`,
    });
    gauges.life.update({
      title: 'Lifetime CO2', scale: niceScale(Math.max(...life)), unit: 'TONNES', sweep,
      needles: life.map((v) => ({ value: v })),
      readouts: rows.map((r, i) => ({ name: r.v.label, text: `${life[i].toFixed(1)} t`, note: r.upfrontKg ? `incl. ${(r.upfrontKg / 1000).toFixed(1)} t battery` : `over ${dist(s.miles)}` })),
      label: `Lifetime CO2: ${rows.map((r, i) => `${r.v.label} ${life[i].toFixed(1)} tonnes`).join(', ')}`,
    });
  }

  // ------------------------------------------------------------------ charts
  function lineChart(el, { xMax, yMax, lines, markers, vline, yFmt, label }) {
    const W = 600, H = 340, L = 62, R = 14, T = 20, B = 50;
    const x = (m) => L + (Math.min(m, xMax) / xMax) * (W - L - R);
    const y = (v) => H - B - (v / yMax) * (H - T - B);
    const ticks = 5;
    let g = '';
    for (let k = 0; k <= ticks; k++) {
      const yv = (yMax / ticks) * k;
      g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(yv)}" y2="${y(yv)}"/><text class="ytick" x="${L - 8}" y="${y(yv) + 4}" text-anchor="end">${yFmt(yv)}</text>`;
    }
    const dMax = toDisp(xMax);
    const step = axisStep(dMax);
    for (let d = 0; d <= dMax + 1e-9; d += step) {
      const k = d >= 1000 ? `${n0(d / 1000)}k` : n0(d);
      g += `<text class="xtick" x="${x(fromDisp(d))}" y="${H - B + 20}" text-anchor="middle">${k}</text>`;
    }
    g += `<text class="xlabel" x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">Total distance (${dUnit()})</text>`;
    if (vline) {
      g += `<line class="own" x1="${x(vline.x)}" x2="${x(vline.x)}" y1="${T}" y2="${H - B}"/><text class="own-label" x="${x(vline.x) - 6}" y="${T + 12}" text-anchor="end">${vline.label}</text>`;
    }
    lines.forEach((l) => {
      g += `<line class="series" x1="${x(0)}" y1="${y(l.y0)}" x2="${x(xMax)}" y2="${y(l.y0 + l.slope * xMax)}" style="stroke:${l.color};color:${l.color}"/>`;
    });
    markers.forEach((m) => {
      if (m.x == null || m.x > xMax) return;
      const yy = y(m.y);
      const right = x(m.x) > W * 0.55;
      g += `<g class="be"><line x1="${x(m.x)}" x2="${x(m.x)}" y1="${yy}" y2="${H - B}"/><circle cx="${x(m.x)}" cy="${yy}" r="6"/><text x="${x(m.x) + (right ? -10 : 10)}" y="${yy - 12}" text-anchor="${right ? 'end' : 'start'}">${m.label}</text></g>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${g}</svg>`;
  }

  function renderCharts(R) {
    const { s, rows, costBE, carbonBE } = R;
    const cur = s.region.currency;
    const own = s.miles;
    const finite = (list) => list.map((b) => b.miles).filter((m) => m != null);
    const xMaxFor = (list) => Math.min(Math.max(own * 1.2, ...finite(list).map((m) => m * 1.12)), own * 4, 600000);

    const xc = xMaxFor(costBE);
    const yc = niceScale(Math.max(...rows.map((r) => r.upfront + r.perMile * xc))).max;
    lineChart($('#chart-cost'), {
      xMax: xc, yMax: yc,
      lines: rows.map((r) => ({ y0: r.upfront, slope: r.perMile, color: COLORS[r.i] })),
      markers: costBE.map((b) => ({ x: b.miles, y: b.from.upfront + b.from.perMile * (b.miles ?? 0), label: b.miles ? `${b.to.v.label} pays back` : '' })),
      vline: { x: own, label: `${s.years} years` },
      yFmt: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, notation: 'compact', maximumFractionDigits: 1 }).format(v),
      label: `Cumulative cost against distance. ${costBE.map((b) => `${b.to.v.label} ${b.miles ? `breaks even with ${b.from.v.label} at ${n0(toDisp(b.miles))} ${dUnit()}` : `never breaks even with ${b.from.v.label}`}`).join('. ')}.`,
    });

    const xe = xMaxFor(carbonBE);
    const ye = niceScale(Math.max(...rows.map((r) => (r.upfrontKg + (r.co2 * xe) / 1000) / 1000))).max;
    lineChart($('#chart-co2'), {
      xMax: xe, yMax: ye,
      lines: rows.map((r) => ({ y0: r.upfrontKg / 1000, slope: r.co2 / 1e6, color: COLORS[r.i] })),
      markers: carbonBE.map((b) => ({ x: b.miles, y: (b.from.co2 * (b.miles ?? 0)) / 1e6, label: b.miles ? `${b.to.v.label} carbon payback` : '' })),
      vline: { x: own, label: `${s.years} years` },
      yFmt: (v) => `${v.toFixed(v < 10 ? 1 : 0)} t`,
      label: `Cumulative CO2 against distance. ${carbonBE.map((b) => `${b.to.v.label} ${b.miles ? `overtakes ${b.from.v.label} at ${n0(toDisp(b.miles))} ${dUnit()}` : `never overtakes ${b.from.v.label}`}`).join('. ')}.`,
    });

    const beText = (b, kind) => {
      if (b.miles == null) {
        return kind === 'cost'
          ? (b.to.upfront < b.from.upfront || b.to.perMile >= b.from.perMile
            ? `<li><b class="ink ink-${b.to.i}">${b.to.v.label}</b> never pays back against ${b.from.v.label}: it costs more to run.</li>`
            : `<li><b class="ink ink-${b.to.i}">${b.to.v.label}</b>: no break-even needed.</li>`)
          : `<li><b class="ink ink-${b.to.i}">${b.to.v.label}</b> never makes up its battery's CO2 against ${b.from.v.label} on this grid.</li>`;
      }
      const within = b.miles <= own;
      const yrs = b.miles / s.annual;
      return `<li><b class="ink ink-${b.to.i}">${b.to.v.label}</b> ${kind === 'cost' ? 'pays back its higher price against' : 'makes up its battery CO2 against'} ${b.from.v.label} at <b>${dist(b.miles)}</b>, about ${yrs.toFixed(1)} years at your mileage${within ? ', inside your ownership period.' : `, after your ${s.years}-year ownership.`}</li>`;
    };
    $('#be-cost').innerHTML = costBE.map((b) => beText(b, 'cost')).join('');
    $('#be-co2').innerHTML = carbonBE.length ? carbonBE.map((b) => beText(b, 'co2')).join('') : '<li>Battery manufacturing is switched off, so no carbon payback distance applies.</li>';
  }

  // ------------------------------------------------------------------ explainers
  function renderExplainers(R) {
    const { s, rows } = R;
    const ice = rows.find((r) => r.v.pt === 'ICE');
    const hyb = rows.find((r) => r.v.pt === 'Hybrid');
    const ev = rows.find((r) => r.v.pt === 'EV');
    const name = (r) => `<b class="ink ink-${r.i}">${r.v.label}</b>`;
    const galPer100 = (r) => 100 / r.v.mpg.v;
    const kwhEq = (r) => galPer100(r) * 33.7;   // EPA MPGe basis: 33.7 kWh per gallon
    const per = (g) => `${n0(perDisp(g))}&nbsp;g/${dUnit()}`;
    const perRegion = REGION_KEYS.map((k) => `${REGIONS[k].short} ${per((ev.v.kwh100.v / 100) * REGIONS[k].grid.v)}`).join(', ');
    const evBE = R.carbonBE.find((b) => b.to === ev);
    const porsche = s.fam.id === 'porsche';

    $('#cost-explainers').innerHTML = `
      <article class="note glass">
        <p class="kicker">Gas engine</p>
        <h3>Combustion: most of the fuel leaves as heat</h3>
        <p>${name(ice)} burns ${galPer100(ice).toFixed(2)} gallons per 100 miles on the EPA combined cycle. At EPA's MPGe basis of 33.7&nbsp;kWh per gallon that is about <b>${n0(kwhEq(ice))}&nbsp;kWh of chemical energy per 100 miles</b>, against ${ev.v.kwh100.v.toFixed(1)}&nbsp;kWh for ${name(ev)} measured at the wall.</p>
        <p>The gap is thermodynamics. Even the best gasoline engines convert only about 40% of their fuel's energy to work at their most efficient speed and load, and far less in real driving: heat leaves through the exhaust and coolant, the throttle plate makes the engine pump against a partial vacuum at light loads, idling burns fuel for no distance, and every stop turns the car's kinetic energy into brake heat. That is why this car does ${ice.v.mpg.city}&nbsp;mpg in the city and ${ice.v.mpg.hwy}&nbsp;mpg on the highway: stop-and-go driving is where combustion wastes the most.</p>
        <p>Every gallon burned releases 8,887&nbsp;g of CO2 at the tailpipe, so its ${per(ice.co2)} is fixed by fuel economy and doesn't change with the region.</p>
      </article>
      <article class="note glass">
        <p class="kicker">Hybrid</p>
        <h3>${porsche ? 'A performance hybrid: the battery buys response, not range' : 'Hybrid: recover the braking energy, keep the engine in its sweet spot'}</h3>
        ${porsche ? `
        <p>${name(hyb)} is rated ${hyb.v.mpg.v}&nbsp;mpg combined, slightly worse than ${name(ice)} at ${ice.v.mpg.v}&nbsp;mpg. Porsche's T-Hybrid uses its 1.9&nbsp;kWh battery to spin an electric turbocharger and a motor in the gearbox for throttle response and power, and it carries a larger 3.6-liter engine. Electrification only saves fuel when the control strategy is built around efficiency, which is the point the Toyota and Hyundai families show.</p>`
          : `
        <p>${name(hyb)} flips the gas car's pattern: ${hyb.v.mpg.city}&nbsp;mpg city and ${hyb.v.mpg.hwy}&nbsp;mpg highway${hyb.v.mpg.city > hyb.v.mpg.hwy ? ', better in town than on the highway' : ''}. Three mechanisms do that. Regenerative braking uses the motor as a generator, so part of the energy a gas car turns into brake heat goes back into the battery (blended with the friction brakes and limited by how much charge the battery can accept). Motor assist supplies torque at low speed, so the engine doesn't have to be sized or tuned for acceleration${s.fam.id === 'toyota' ? ': Toyota runs its hybrid engines on the Atkinson cycle, trading peak power for efficiency, and splits power through a planetary gearset (the e-CVT) instead of a gearbox' : ': Hyundai pairs a 1.6-liter turbo engine with a motor built into a six-speed automatic'}. And the engine shuts off at stops and at low speeds.</p>
        <p>The control system keeps the battery in a middle band of charge and moves the engine toward its most efficient speed and load. On the highway there is little braking to recover and the engine is already working efficiently, so the advantage narrows. Net result here: ${per(hyb.co2)} against ${per(ice.co2)} for the gas car, with no plug and a battery small enough that its manufacturing emissions are left out.</p>`}
      </article>
      <article class="note glass">
        <p class="kicker">Electric</p>
        <h3>Battery EV: efficient drivetrain, emissions set by the grid</h3>
        <p>${name(ev)} stores ${ev.v.batteryKwh}&nbsp;kWh in its battery and uses ${ev.v.kwh100.v.toFixed(1)}&nbsp;kWh per 100 miles. EPA measures that at the wall, so charging losses are already included. The inverter and permanent-magnet motor convert most of that energy to wheel torque, and regenerative braking recovers energy on every stop.</p>
        <p>"Zero-emission" only describes the tailpipe. On the grid in ${s.region.name}, at ${n0(s.grid)}&nbsp;g CO2e per kWh, this car emits <b>${per(ev.co2)}</b> in use. The same car in each preset: ${perRegion}. Building its battery adds about ${(ev.v.batteryKwh * FACTORS.batteryKgPerKwh.v / 1000).toFixed(1)}&nbsp;t of CO2 before the first mile (ICCT's 60&nbsp;kg per kWh)${s.includeBattery ? '' : ', which is currently switched off'}.</p>
        <p>${evBE?.miles ? `Here it makes that battery debt back against ${name(ice)} after <b>${dist(evBE.miles)}</b>. ` : ''}${hyb && hyb.lifeKg < ev.lifeKg ? `On this grid and mileage the hybrid ends up with lower lifetime CO2 than the EV, which is the honest answer where electricity is generated mostly from oil and gas.` : `A cleaner grid shortens that payback, and a dirtier one stretches it, which is why the Gulf presets move this number so much.`}</p>
      </article>`;
  }

  // ------------------------------------------------------------------ sources
  function renderSources(R) {
    const { s } = R;
    const r = s.region;
    const row = (fig, val, kind, src, note) => `<tr><th scope="row">${fig}</th><td>${val}</td><td>${badge(kind, src)}</td><td>${note ?? ''}</td></tr>`;
    const unitLabel = (p) => (p.unit === 'L' ? `${r.currency} ${p.v.toFixed(3)} per litre` : `${r.currency} ${p.v.toFixed(3)} per gallon`);
    $('#cost-sources').innerHTML = `
      <table class="srctable">
        <thead><tr><th scope="col">Figure</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Note</th></tr></thead>
        <tbody>
          ${row('Regular gasoline', unitLabel(r.regular), r.regular.kind, r.regular.src, r.regular.note)}
          ${row('Premium gasoline', unitLabel(r.premium), r.premium.kind, r.premium.src, r.premium.note)}
          ${row('Electricity', `${r.currency} ${r.elec.v.toFixed(4)} per kWh`, r.elec.kind, r.elec.src, r.elec.note)}
          ${row('Grid carbon intensity', `${r.grid.v} g CO2e/kWh (${r.grid.year})`, r.grid.kind, r.grid.src, 'Lifecycle emissions per kWh generated.')}
          ${row('Exchange rate', r.currency === 'USD' ? '1' : `${r.fx.v.toFixed(4)} ${r.currency} per USD`, r.fx.kind, r.fx.src, r.fx.note)}
          ${row('Gasoline CO2', '8,887 g per gallon', FACTORS.gasCo2PerGal.kind, FACTORS.gasCo2PerGal.src, FACTORS.gasCo2PerGal.note)}
          ${row('Battery manufacturing', '60 kg CO2e per kWh', FACTORS.batteryKgPerKwh.kind, FACTORS.batteryKgPerKwh.src, FACTORS.batteryKgPerKwh.note)}
          ${['ICE', 'Hybrid', 'EV'].map((k) => row(`Maintenance, ${PT_NAME[k].toLowerCase()}`, `USD ${FACTORS.maint[k].v.toFixed(3)} per mile`, FACTORS.maint[k].kind, FACTORS.maint[k].src, FACTORS.maint[k].note)).join('')}
          ${row('Annual mileage default', '12,000 mi', 'illustrative', null, FACTORS.annualMiles.note)}
          ${row('Ownership default', '8 years', 'illustrative', null, FACTORS.years.note)}
          ${s.fam.variants.map((v) => row(`${v.year} ${v.label}`, `US MSRP USD ${n0(v.price.v)}; EPA ${v.pt === 'EV' ? `${v.kwh100.v.toFixed(1)} kWh/100 mi` : `${v.mpg.v} mpg combined`}`, 'sourced', v.price.src, 'Fuel economy from the EPA record for the 2026 model.')).join('')}
        </tbody>
      </table>
      <p class="fine">Prices and tariffs last checked <time datetime="${COST_CHECKED}">${new Date(`${COST_CHECKED}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>. Fuel and electricity prices move; use the inputs above to match your own.</p>`;
  }

  function render({ sweep = false } = {}) {
    const R = results(state.cost);
    renderHero(R);
    const key = `${state.cost.region}|${state.cost.fam}|${state.units}|${JSON.stringify(state.cost.p)}|${JSON.stringify(state.cost.i)}|${state.cost.fr}|${state.cost.fp}|${state.cost.el}|${state.cost.gr}`;
    // Re-render input fields only when their values change from outside, so typing isn't interrupted.
    if (key !== lastKey || !document.activeElement?.closest('#cost-inputs')) renderInputs(R);
    lastKey = key;
    renderGauges(R, sweep);
    renderCharts(R);
    renderExplainers(R);
    renderSources(R);
    return R;
  }

  // ------------------------------------------------------------------ events
  const num = (el) => { const v = parseFloat(el.value); return Number.isFinite(v) && v >= 0 ? v : null; };
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fam]');
    if (f) { state.cost.fam = f.dataset.fam; state.cost.famLocked = true; state.cost.p = []; state.cost.i = []; onChange({ sweep: true }); return; }
    const r = e.target.closest('[data-region]');
    if (r) {
      state.cost.region = r.dataset.region;
      Object.assign(state.cost, { fr: null, fp: null, el: null, gr: null, p: [], i: [] });
      onChange({ sweep: true });
      return;
    }
    if (e.target.id === 'c-reset') {
      Object.assign(state.cost, { fr: null, fp: null, el: null, gr: null, p: [], i: [] });
      onChange();
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'c-mi') { state.cost.mi = Math.round(fromDisp(+t.value)); onChange(); return; }
    if (t.id === 'c-yrs') { state.cost.yrs = +t.value; onChange(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    const v = num(t);
    if (t.id === 'c-batt') { state.cost.batt = t.checked; onChange(); return; }
    const perGal = (x) => (x == null ? null : (metric() ? x * L_PER_GAL : x));
    if (t.id === 'c-fr') { state.cost.fr = perGal(v); onChange(); return; }
    if (t.id === 'c-fp') { state.cost.fp = perGal(v); onChange(); return; }
    if (t.id === 'c-el') { state.cost.el = v; onChange(); return; }
    if (t.id === 'c-gr') { state.cost.gr = v; onChange(); return; }
    if (t.dataset.price != null) { state.cost.p[+t.dataset.price] = v; onChange(); return; }
    if (t.dataset.incentive != null) { state.cost.i[+t.dataset.incentive] = v; onChange(); }
  });

  return { render };
}

