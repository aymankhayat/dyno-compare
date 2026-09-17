import { CARS, CAR_BY_ID, SIGNATURES, CHECKED, MAKES } from './data.js';
import { parseState, serializeState, matchSignature } from './state.js';
import { createGauge, SCALES } from './gauges.js';
import { buildTradeoffs } from './tradeoffs.js';
import { convert, format, unit, powerToWeight, weightPerPower, averageG, round } from './units.js';

// ?clean hides the interface over the 3D stage, for capturing clean renders of the showroom.
if (new URLSearchParams(location.search).has('clean')) document.documentElement.classList.add('clean');

const state = parseState(location.search);
const LETTERS = ['A', 'B', 'C'];
const ACCENTS = ['#6cf0c2', '#5ab8ff', '#ff7a9a'];
const DRIVE_NAMES = { AWD: 'All-wheel drive', RWD: 'Rear-wheel drive', FWD: 'Front-wheel drive' };
const TRANS_BLURB = {
  manual: 'Three pedals. Every shift interrupts drive, which costs time off the line but keeps the driver in charge of rpm.',
  auto: 'Shifts faster than a person can and keeps the engine near peak power; often quicker than the manual version of the same car.',
  dct: 'Two clutches pre-select the next gear, so shifts happen with almost no break in drive.',
  ecvt: 'A planetary gearset and a generator motor set engine rpm independently of road speed. No belt, no clutch packs.',
  single: 'Electric motors make usable torque from zero to very high rpm, so one reduction gear is enough.',
  twospeed: 'A short first gear for launch and a tall second gear for efficiency and top speed, unusual for an EV.',
  hybridAuto: 'An electric motor sits between the engine and a conventional multi-speed automatic.',
};

const $ = (s) => document.querySelector(s);
const cars = () => state.cars.map((id) => CAR_BY_ID.get(id));
const fullName = (c) => `${c.year} ${c.make} ${c.model}`;
const q = (kind, v) => `${format(kind, v, state.units)} ${unit(kind, state.units)}`;

let stage = null;
let stageKey = '';
let focusedCar = -1;

const gauges = {
  power: createGauge($('#g-power')),
  torque: createGauge($('#g-torque')),
  time: createGauge($('#g-time')),
};

const RUN_ICONS = {
  'hybrid-ice': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="17" height="10" rx="2.2"/><path d="M21.5 10.5v3"/><path d="M11.8 8.8 9.2 12.4h3.6l-2.6 3.6"/></svg>',
  'turbo-na': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 5.2a6.8 6.8 0 1 1-6.8 6.8"/><path d="M5.2 12H2.5"/><path d="M12 5.2V2.5h5"/><path d="m14 10 3.5-3.5"/></svg>',
  'awd-rwd': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3.5" width="4" height="6" rx="1"/><rect x="17" y="3.5" width="4" height="6" rx="1"/><rect x="3" y="14.5" width="4" height="6" rx="1"/><rect x="17" y="14.5" width="4" height="6" rx="1"/><path d="M7 6.5h10M7 17.5h10M12 6.5v11"/></svg>',
};

// ---------------------------------------------------------------------------
// Stage: copy, wordmark, card, paint, callouts
// ---------------------------------------------------------------------------

function fitWordmark() {
  const el = $('#wordmark');
  el.style.fontSize = '';
  const max = el.parentElement.clientWidth * 0.96;
  if (el.scrollWidth > max) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor((size * max) / el.scrollWidth)}px`;
  }
}

function renderStageCopy() {
  const cs = cars();
  const sig = matchSignature(state.cars);
  $('#stage-kicker').textContent = sig ? 'Signature run' : 'Your comparison';
  // Headline with a gradient on everything after "vs" (titles and names come from data.js).
  const [lead, ...rest] = (sig ? sig.title : cs.map((c) => c.short).join(' vs ')).split(' vs ');
  $('#stage-title').innerHTML = rest.length ? `${lead} <span class="grad">vs ${rest.join(' vs ')}</span>` : lead;
  // Custom lineups produce long titles; set them smaller so they don't run into the stage buttons.
  $('#stage-title').classList.toggle('long', !sig);
  $('#stage-hook').textContent = sig ? sig.hook : cs.map(fullName).join(', ');
  $('#wordmark').textContent = sig ? sig.word : 'Versus';
  fitWordmark();
}

function renderStageCard() {
  const cs = cars();
  const el = $('#stage-card');
  if (focusedCar >= 0 && cs[focusedCar]) {
    const c = cs[focusedCar];
    const ptw = powerToWeight(c.hp.v, c.weight.v, state.units);
    el.innerHTML = `
      <p class="kicker"><span class="ink-dot d${focusedCar}"></span>Car ${LETTERS[focusedCar]}</p>
      <h3>${c.make} ${c.model}</h3>
      <p class="sub">${c.year}, ${c.trim}</p>
      <dl>
        <dt>Peak power</dt><dd>${q('power', c.hp.v)}</dd>
        <dt>Peak torque</dt><dd>${q('torque', c.torque.v)}</dd>
        <dt>0–60 mph</dt><dd>${c.zero60.v} s</dd>
        <dt>Top speed</dt><dd>${q('speed', c.top.v)}</dd>
        <dt>Curb weight</dt><dd>${q('mass', c.weight.v)}</dd>
        <dt>Power-to-weight</dt><dd>${round(ptw, 0)} ${state.units === 'metric' ? 'kW/t' : 'hp/ton'}</dd>
      </dl>`;
    return;
  }
  el.innerHTML = `
    <p class="kicker">On the floor</p>
    <ul class="lineup">
      ${cs.map((c, i) => `
        <li>
          <span class="ink-dot d${i}"></span>
          <span class="who">${c.short}</span>
          <span class="num">${q('power', c.hp.v)}</span>
          <small>${c.zero60.v} s to 60, ${q('speed', c.top.v)} top speed</small>
        </li>`).join('')}
    </ul>`;
}

function syncStage() {
  if (!stage) return;
  const key = state.cars.join(',');
  if (key === stageKey) return;
  stageKey = key;
  stage.setCars(cars().map((c, i) => ({
    name: c.short,
    model: c.model3d,
    dims: c.dims,
    paint: c.paint,
    accent: ACCENTS[i],
    hotspots: [
      { anchor: 'powertrain', label: c.powertrain === 'EV' ? 'Motors' : 'Engine' },
      { anchor: 'cabin', label: '0–60' },
      { anchor: 'drivetrain', label: c.drivetrain },
      { anchor: 'transmission', label: 'Gearbox' },
      { anchor: 'weight', label: 'Weight' },
    ],
  })));
}

function calloutContent(c, anchor) {
  const sys = state.units;
  switch (anchor) {
    case 'powertrain':
      return {
        label: c.powertrain === 'EV' ? 'Motors' : 'Engine', title: c.engine, value: q('power', c.hp.v),
        note: `${c.hp.rpm ? `Peak power at ${c.hp.rpm} rpm. ` : ''}${q('torque', c.torque.v)} of torque${c.torque.rpm ? ` at ${c.torque.rpm} rpm` : ''}.${c.hp.note ? ` ${c.hp.note}` : ''}`,
      };
    case 'cabin':
      return {
        label: '0–60 mph', title: 'Manufacturer claim', value: `${c.zero60.v} s`,
        note: `Top speed ${q('speed', c.top.v)}${c.top.tag ? ` (${c.top.tag})` : ''}. Average acceleration to 60: ${round(averageG(c.zero60.v), 2).toFixed(2)} g.`,
      };
    case 'drivetrain':
      return { label: 'Drivetrain', title: DRIVE_NAMES[c.drivetrain], value: c.drivetrain, note: c.awdNote ?? (c.drivetrain === 'RWD' ? 'Weight shifts to the driven wheels under acceleration, and the front tires are left to steer.' : 'Grip at all four tires for launches and low-traction roads, paid for in weight.') };
    case 'transmission':
      return { label: 'Gearbox', title: c.transmission, value: '', note: TRANS_BLURB[c.transType] ?? '' };
    case 'weight': {
      const ptw = powerToWeight(c.hp.v, c.weight.v, sys);
      const wpp = weightPerPower(c.hp.v, c.weight.v, sys);
      return {
        label: 'Curb weight', title: `${c.year} ${c.model}, ${c.trim}`, value: q('mass', c.weight.v),
        note: `${round(ptw, 0)} ${sys === 'metric' ? 'kW per tonne' : 'hp per ton'}, or ${round(wpp, 1).toFixed(1)} ${sys === 'metric' ? 'kg per kW' : 'lb per hp'}.`,
      };
    }
    default:
      return { label: '', title: '', value: '', note: '' };
  }
}

function showCallout(i, h, anchorEl) {
  const c = cars()[i];
  const box = $('#callout');
  const d = calloutContent(c, h.anchor);
  box.innerHTML = `
    <button type="button" class="c-close" aria-label="Close">×</button>
    <p class="c-label">${d.label}</p>
    <p class="c-title">${d.title}</p>
    ${d.value ? `<p class="c-value">${d.value}</p>` : ''}
    ${d.note ? `<p class="c-note">${d.note}</p>` : ''}`;
  box.hidden = false;
  const st = box.parentElement.getBoundingClientRect();
  const r = anchorEl.getBoundingClientRect();
  const w = box.offsetWidth;
  let left = r.left - st.left + 28;
  if (left + w > st.width - 12) left = r.left - st.left - w - 12;
  const top = Math.min(Math.max(80, r.top - st.top - 20), st.height - box.offsetHeight - 16);
  box.style.left = `${Math.max(12, left)}px`;
  box.style.top = `${top}px`;
  box.querySelector('.c-close').focus({ preventScroll: true });
  box.dataset.for = `${i}:${h.anchor}`;
  box._return = anchorEl;
}

function closeCallout() {
  const box = $('#callout');
  if (box.hidden) return;
  box.hidden = true;
  box._return?.focus({ preventScroll: true });
}

async function initStage() {
  const canvas = $('#stage-canvas');
  const fail = () => {
    canvas.hidden = true;
    $('#stage-fallback').hidden = false;
    ['#stage-hint', '#reset-view'].forEach((s) => { $(s).hidden = true; });
  };
  try {
    const mod = await import('./stage3d.js');
    if (!mod.webglAvailable()) { fail(); return; }
    stage = mod.createStage({
      canvas,
      overlay: $('#stage-overlay'),
      onHotspot: showCallout,
      onFocus: (i) => {
        focusedCar = i;
        closeCallout();
        renderStageCard();
      },
    });
    syncStage();

    // On touch screens a full-screen canvas would trap page scrolling, so rotating is opt-in.
    if (matchMedia('(pointer: coarse)').matches) {
      canvas.style.pointerEvents = 'none';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.id = 'rotate';
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = 'Rotate';
      $('#reset-view').before(btn);
      btn.addEventListener('click', () => {
        const on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        btn.textContent = on ? 'Done rotating' : 'Rotate';
        canvas.style.pointerEvents = on ? 'auto' : 'none';
      });
    }
  } catch (err) {
    console.error(err);
    fail();
  }
}

// ---------------------------------------------------------------------------
// Signature runs and car slots
// ---------------------------------------------------------------------------

function renderRuns() {
  const active = matchSignature(state.cars);
  $('#runs-list').innerHTML = SIGNATURES.map((s) => `
    <button class="run" type="button" data-run="${s.id}" aria-pressed="${active?.id === s.id}">
      <span class="run-icon" aria-hidden="true">${RUN_ICONS[s.id] ?? ''}</span>
      <span class="run-title">${s.title}</span>
      <span class="run-cars">${s.cars.map((id, i) => `<span class="ink-dot d${i}"></span>${CAR_BY_ID.get(id).short}`).join('<span class="vs">vs</span>')}</span>
      <span class="run-hook">${s.hook}</span>
    </button>`).join('');
}

const OPTIONS = MAKES.map((make) => `
  <optgroup label="${make}">
    ${CARS.filter((c) => c.make === make).map((c) => `<option value="${c.id}">${c.year} ${c.model} (${c.trim})</option>`).join('')}
  </optgroup>`).join('');

function renderSlots() {
  const html = state.cars.map((id, i) => `
    <div class="slot s${i}">
      <label for="slot-${i}"><span class="ink-dot d${i}"></span>Car ${LETTERS[i]}</label>
      <div class="slot-row">
        <select id="slot-${i}" data-slot="${i}">${OPTIONS}</select>
        ${i === 2 ? '<button type="button" class="ghost" id="remove-third">Remove</button>' : ''}
      </div>
    </div>`).join('');
  const add = state.cars.length < 3 ? '<button type="button" class="ghost add" id="add-third">Add a third car</button>' : '';
  $('#slots').innerHTML = html + add;
  state.cars.forEach((id, i) => { $(`#slot-${i}`).value = id; });
}

// ---------------------------------------------------------------------------
// Cluster
// ---------------------------------------------------------------------------

function renderCluster(sweep = false) {
  const cs = cars();
  const sys = state.units;
  const say = (c, text) => `${c.short} ${text ?? 'unverified'}`;

  const pw = cs.map((c) => (c.hp.v == null ? null : q('power', c.hp.v)));
  gauges.power.update({
    title: 'Peak power', scale: SCALES.power[sys], unit: unit('power', sys), sweep,
    needles: cs.map((c) => ({ value: convert('power', c.hp.v, sys) })),
    readouts: cs.map((c, i) => ({ name: c.short, text: pw[i], note: c.hp.rpm ? `at ${c.hp.rpm} rpm` : c.hp.tag })),
    label: `Peak power: ${cs.map((c, i) => say(c, pw[i])).join(', ')}`,
  });

  const tq = cs.map((c) => (c.torque.v == null ? null : q('torque', c.torque.v)));
  const basisNote = (c) => {
    if (c.torque.basis === 'engine') return 'engine only';
    if (c.torque.basis === 'motor') return 'traction motor';
    return c.torque.rpm ? `at ${c.torque.rpm} rpm` : c.torque.tag;
  };
  gauges.torque.update({
    title: 'Peak torque', scale: SCALES.torque[sys], unit: unit('torque', sys), sweep,
    needles: cs.map((c) => ({ value: convert('torque', c.torque.v, sys), dashed: c.torque.basis === 'engine' || c.torque.basis === 'motor' })),
    readouts: cs.map((c, i) => ({ name: c.short, text: tq[i], note: c.torque.v == null ? null : basisNote(c) })),
    label: `Peak torque: ${cs.map((c, i) => say(c, tq[i])).join(', ')}`,
  });

  const t = cs.map((c) => (c.zero60.v == null ? null : `${c.zero60.v} s`));
  gauges.time.update({
    title: sys === 'metric' ? '0–97 km/h (0–60 mph)' : '0–60 mph', scale: SCALES.time[sys], unit: 'SECONDS', sweep,
    needles: cs.map((c) => ({ value: c.zero60.v })),
    readouts: cs.map((c, i) => ({ name: c.short, text: t[i], note: c.zero60.v == null ? null : ['maker claim', c.zero60.tag].filter(Boolean).join(', ') })),
    label: `Zero to sixty: ${cs.map((c, i) => say(c, t[i])).join(', ')}`,
  });
}

// ---------------------------------------------------------------------------
// Spec sheet
// ---------------------------------------------------------------------------

const why = (note, label = 'Note') => (note ? `<details class="why"><summary>${label}</summary><p>${note}</p></details>` : '');
const stamp = (note) => `<span class="stamp">unverified</span>${why(note, 'Why?')}`;
const srcRef = (c, s) => (s == null ? '' : `<a class="src" href="#src-${c.id}-${s}" title="${c.sources[s].label}">${s + 1}</a>`);

function numericRow({ label, kind, key, best, fixedMax, extra }) {
  const cs = cars();
  const sys = state.units;
  const specs = cs.map((c) => c[key]);
  const vals = specs.map((s) => (s.v == null ? null : convert(kind, s.v, sys)));
  const eligible = vals.map((v, i) => (v != null && (key !== 'torque' || !specs[i].basis || specs[i].basis === 'system')));
  const pool = vals.filter((v, i) => eligible[i]);
  const bestVal = best && pool.length >= 2 ? (best === 'min' ? Math.min(...pool) : Math.max(...pool)) : null;
  const max = fixedMax ?? Math.max(...vals.filter((v) => v != null), 0);

  const cells = cs.map((c, i) => {
    const s = specs[i];
    if (s.v == null) return `<td class="c${i}">${stamp(s.note)}</td>`;
    const isBest = eligible[i] && vals[i] === bestVal;
    const at = s.rpm ? `<span class="at">at ${s.rpm} rpm</span>` : '';
    const tags = [s.kind === 'claimed' ? 'maker claim' : null, s.basis === 'engine' ? 'engine only' : null, s.basis === 'motor' ? 'traction motor' : null, s.tag].filter(Boolean);
    // Show published decimals as published (3.25 s, 142.9 mph) rather than rounding them away.
    const published = String(s.v).split('.')[1]?.length;
    const digits = kind === 'time' ? (published ?? 1) : (sys === 'imperial' && published ? published : undefined);
    return `<td class="c${i}${isBest ? ' best' : ''}">
      <span class="val">${format(kind, s.v, sys, digits)}</span><span class="u">${kind === 'time' ? 's' : unit(kind, sys)}</span>${srcRef(c, s.s)}
      ${isBest ? '<span class="best-mark" title="Best in this comparison">best</span>' : ''}
      ${at}${tags.length ? `<span class="tag">${tags.join(', ')}</span>` : ''}
      <span class="trace" style="--w:${max ? Math.min(100, (vals[i] / max) * 100) : 0}%"></span>
      ${why(s.note)}
    </td>`;
  }).join('');
  return `<tr><th scope="row">${label}${extra ? `<span class="row-note">${extra}</span>` : ''}</th>${cells}</tr>`;
}

function derivedRow(label, note, fn, digits, unitText, best) {
  const cs = cars();
  const vals = cs.map(fn);
  const pool = vals.filter((v) => v != null);
  const bestVal = pool.length >= 2 ? (best === 'min' ? Math.min(...pool) : Math.max(...pool)) : null;
  const max = Math.max(...pool, 0);
  const cells = cs.map((c, i) => {
    const v = vals[i];
    if (v == null) return `<td class="c${i}">${stamp('Needs a figure this car is missing.')}</td>`;
    return `<td class="c${i}${v === bestVal ? ' best' : ''}"><span class="val">${round(v, digits).toFixed(digits)}</span><span class="u">${unitText}</span>
      ${v === bestVal ? '<span class="best-mark" title="Best in this comparison">best</span>' : ''}
      <span class="trace" style="--w:${max ? (v / max) * 100 : 0}%"></span></td>`;
  }).join('');
  return `<tr class="derived"><th scope="row">${label}<span class="row-note">${note}</span></th>${cells}</tr>`;
}

function textRow(label, fn) {
  return `<tr><th scope="row">${label}</th>${cars().map((c, i) => `<td class="c${i} text">${fn(c)}</td>`).join('')}</tr>`;
}

function renderPrintout() {
  const cs = cars();
  const sys = state.units;
  $('#sheet').style.setProperty('--cols', cs.length);
  const head = cs.map((c, i) => `
    <th scope="col" class="c${i}">
      <span class="car-name"><span class="ink-dot d${i}"></span>${c.year} ${c.make}<b>${c.model}</b></span>
      <span class="car-trim">${c.trim}</span>
    </th>`).join('');

  const rows = [
    numericRow({ label: sys === 'metric' ? '0–97 km/h' : '0–60 mph', extra: sys === 'metric' ? 'published as 0–60 mph' : null, kind: 'time', key: 'zero60', best: 'min', fixedMax: 10 }),
    numericRow({ label: 'Top speed', kind: 'speed', key: 'top', best: 'max' }),
    numericRow({ label: 'Peak power', kind: 'power', key: 'hp', best: 'max' }),
    numericRow({ label: 'Peak torque', kind: 'torque', key: 'torque', best: 'max' }),
    numericRow({ label: 'Curb weight', kind: 'mass', key: 'weight', best: null }),
    derivedRow('Power-to-weight', sys === 'metric' ? 'kW per tonne, higher is better' : 'hp per ton (2,000 lb), higher is better',
      (c) => powerToWeight(c.hp.v, c.weight.v, sys), 0, sys === 'metric' ? 'kW/t' : 'hp/ton', 'max'),
    derivedRow('Weight per unit of power', sys === 'metric' ? 'kg per kW, lower is better' : 'lb per hp, lower is better',
      (c) => weightPerPower(c.hp.v, c.weight.v, sys), 1, sys === 'metric' ? 'kg/kW' : 'lb/hp', 'min'),
    derivedRow('Average 0–60 acceleration', 'from the claimed time', (c) => averageG(c.zero60.v), 2, 'g', 'max'),
    textRow('Drivetrain', (c) => `${c.drivetrain}${c.awdNote ? `<span class="tag">${c.awdNote}</span>` : ''}`),
    textRow('Powertrain', (c) => `<span class="pt">${c.powertrain === 'NA' ? 'Naturally aspirated' : c.powertrain}</span><span class="tag">${c.engine}</span>`),
    textRow('Transmission', (c) => c.transmission),
  ].join('');

  $('#sheet').innerHTML = `
    <caption class="sr-only">Specifications for ${cs.map(fullName).join(', ')}</caption>
    <thead><tr><th scope="col" class="corner">Figure</th>${head}</tr></thead>
    <tbody>${rows}</tbody>`;

  $('#sources').innerHTML = cs.map((c, i) => `
    <div class="src-car">
      <h4><span class="ink-dot d${i}"></span>${fullName(c)}</h4>
      <ol>${c.sources.map((s, k) => `<li id="src-${c.id}-${k}"><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')}</ol>
    </div>`).join('');
}

// ---------------------------------------------------------------------------
// Trade-offs
// ---------------------------------------------------------------------------

function renderTradeoffs() {
  const sections = buildTradeoffs(cars(), state.units, matchSignature(state.cars));
  $('#tradeoff-list').innerHTML = sections.map((s) => `
    <article class="note glass${s.signature ? ' essay' : ''}" id="t-${s.id}">
      ${s.kicker ? `<p class="kicker">${s.kicker}</p>` : ''}
      <h3>${s.title}</h3>
      ${s.html}
    </article>`).join('');
  $('#tradeoffs').hidden = !state.explain;
}

// ---------------------------------------------------------------------------
// Controls and state
// ---------------------------------------------------------------------------

function renderControls() {
  document.querySelectorAll('[data-units]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.units === state.units)));
  $('#explain').checked = state.explain;
}

function renderAll({ sweep = false } = {}) {
  closeCallout();
  renderControls();
  renderStageCopy();
  renderRuns();
  renderSlots();
  renderCluster(sweep);
  renderPrintout();
  renderTradeoffs();
  syncStage();
  renderStageCard();
  document.title = `${cars().map((c) => c.short).join(' vs ')} | Dyno Compare`;
}

function commit(opts) {
  history.replaceState(null, '', serializeState(state) + location.hash);
  renderAll(opts);
}

document.addEventListener('click', (e) => {
  const box = $('#callout');
  if (!box.hidden && !box.contains(e.target) && !e.target.closest('.hs')) closeCallout();
  if (e.target.closest('.c-close')) { closeCallout(); return; }

  const run = e.target.closest('[data-run]');
  if (run) {
    state.cars = SIGNATURES.find((s) => s.id === run.dataset.run).cars.slice();
    commit({ sweep: true });
    if (window.scrollY > 200) $('#top').scrollIntoView({ block: 'start' });
    return;
  }
  const u = e.target.closest('[data-units]');
  if (u) { state.units = u.dataset.units; commit(); return; }
  if (e.target.id === 'reset-view') { stage?.resetView(); return; }
  if (e.target.id === 'add-third') {
    state.cars.push(CARS.find((c) => !state.cars.includes(c.id)).id);
    commit();
    $('#slot-2').focus();
    return;
  }
  if (e.target.id === 'remove-third') {
    state.cars = state.cars.slice(0, 2);
    commit();
    $('#add-third').focus();
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCallout(); });

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-slot]')) {
    const i = Number(e.target.dataset.slot);
    state.cars[i] = e.target.value;
    commit();
    $(`#slot-${i}`).focus();
  }
  if (e.target.id === 'explain') {
    state.explain = e.target.checked;
    commit();
  }
});

$('#share').addEventListener('click', async () => {
  const btn = $('#share');
  const done = (msg) => {
    $('#share-status').textContent = msg;
    setTimeout(() => { $('#share-status').textContent = ''; }, 2400);
  };
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: document.title, url: location.href });
      return;
    }
    await navigator.clipboard.writeText(location.href);
    done('Link copied');
  } catch (err) {
    if (err.name !== 'AbortError') done('Copy the link from the address bar');
  }
  btn.blur();
});

window.addEventListener('resize', fitWordmark);

const checked = new Date(`${CHECKED}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
document.querySelectorAll('[data-checked]').forEach((el) => {
  el.textContent = checked;
  el.setAttribute('datetime', CHECKED);
});

history.replaceState(null, '', serializeState(state) + location.hash);
renderAll({ sweep: !matchMedia('(prefers-reduced-motion: reduce)').matches });
document.fonts?.ready.then(fitWordmark);
initStage();
