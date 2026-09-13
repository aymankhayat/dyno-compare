import { CARS, CAR_BY_ID, SIGNATURES, CHECKED, MAKES } from './data.js';
import { parseState, serializeState, matchSignature } from './state.js';
import { createGauge, SCALES } from './gauges.js';
import { buildTradeoffs } from './tradeoffs.js';
import { convert, format, unit, powerToWeight, weightPerPower, averageG, round } from './units.js';

const state = parseState(location.search);
const LETTERS = ['A', 'B', 'C'];
const $ = (s) => document.querySelector(s);

const gauges = {
  power: createGauge($('#g-power')),
  torque: createGauge($('#g-torque')),
  time: createGauge($('#g-time')),
};

const cars = () => state.cars.map((id) => CAR_BY_ID.get(id));
const fullName = (c) => `${c.year} ${c.make} ${c.model}`;

// ---------------------------------------------------------------------------
// Signature runs
// ---------------------------------------------------------------------------

function renderRuns() {
  const active = matchSignature(state.cars);
  $('#runs').innerHTML = SIGNATURES.map((s) => `
    <button class="run" type="button" data-run="${s.id}" aria-pressed="${active?.id === s.id}">
      <span class="run-title">${s.title}</span>
      <span class="run-cars">${s.cars.map((id, i) => `<span class="ink-dot d${i}"></span>${CAR_BY_ID.get(id).short}`).join('<span class="vs">vs</span>')}</span>
      <span class="run-hook">${s.hook}</span>
    </button>`).join('');
}

// ---------------------------------------------------------------------------
// Car slots
// ---------------------------------------------------------------------------

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
  const add = state.cars.length < 3
    ? '<button type="button" class="ghost add" id="add-third">Add a third car</button>'
    : '';
  $('#slots').innerHTML = html + add;
  state.cars.forEach((id, i) => { $(`#slot-${i}`).value = id; });
}

// ---------------------------------------------------------------------------
// Instrument cluster
// ---------------------------------------------------------------------------

function renderCluster(sweep = false) {
  const cs = cars();
  const sys = state.units;
  const say = (c, text) => `${c.short} ${text ?? 'unverified'}`;

  const pw = cs.map((c) => (c.hp.v == null ? null : `${format('power', c.hp.v, sys)} ${unit('power', sys)}`));
  gauges.power.update({
    title: 'Peak power',
    scale: SCALES.power[sys],
    unit: unit('power', sys),
    sweep,
    needles: cs.map((c) => ({ value: convert('power', c.hp.v, sys) })),
    readouts: cs.map((c, i) => ({ name: c.short, text: pw[i], note: c.hp.rpm ? `at ${c.hp.rpm} rpm` : c.hp.tag })),
    label: `Peak power: ${cs.map((c, i) => say(c, pw[i])).join(', ')}`,
  });

  const tq = cs.map((c) => (c.torque.v == null ? null : `${format('torque', c.torque.v, sys)} ${unit('torque', sys)}`));
  const basisNote = (c) => {
    if (c.torque.basis === 'engine') return 'engine only';
    if (c.torque.basis === 'motor') return 'traction motor';
    return c.torque.rpm ? `at ${c.torque.rpm} rpm` : c.torque.tag;
  };
  gauges.torque.update({
    title: 'Peak torque',
    scale: SCALES.torque[sys],
    unit: unit('torque', sys),
    sweep,
    needles: cs.map((c) => ({
      value: convert('torque', c.torque.v, sys),
      dashed: c.torque.basis === 'engine' || c.torque.basis === 'motor',
    })),
    readouts: cs.map((c, i) => ({ name: c.short, text: tq[i], note: c.torque.v == null ? null : basisNote(c) })),
    label: `Peak torque: ${cs.map((c, i) => say(c, tq[i])).join(', ')}`,
  });

  const t = cs.map((c) => (c.zero60.v == null ? null : `${c.zero60.v} s`));
  gauges.time.update({
    title: sys === 'metric' ? '0–97 km/h (0–60 mph)' : '0–60 mph',
    scale: SCALES.time[sys],
    unit: 'seconds',
    sweep,
    needles: cs.map((c) => ({ value: c.zero60.v })),
    readouts: cs.map((c, i) => ({ name: c.short, text: t[i], note: c.zero60.v == null ? null : ['maker claim', c.zero60.tag].filter(Boolean).join(', ') })),
    label: `Zero to sixty: ${cs.map((c, i) => say(c, t[i])).join(', ')}`,
  });
}

// ---------------------------------------------------------------------------
// Dyno printout (the raw spec sheet)
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
    return `<td class="c${i}${isBest ? ' best' : ''}">
      <span class="val">${format(kind, s.v, sys, kind === 'time' ? (String(s.v).split('.')[1]?.length ?? 1) : undefined)}</span><span class="u">${kind === 'time' ? 's' : unit(kind, sys)}</span>${srcRef(c, s.s)}
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
    if (v == null) return `<td class="c${i}">${stamp('Needs a verified input that this car is missing.')}</td>`;
    return `<td class="c${i}${v === bestVal ? ' best' : ''}"><span class="val">${round(v, digits).toFixed(digits)}</span><span class="u">${unitText}</span>
      ${v === bestVal ? '<span class="best-mark" title="Best in this comparison">best</span>' : ''}
      <span class="trace" style="--w:${max ? (v / max) * 100 : 0}%"></span></td>`;
  }).join('');
  return `<tr class="derived"><th scope="row">${label}<span class="row-note">${note}</span></th>${cells}</tr>`;
}

function textRow(label, fn) {
  const cells = cars().map((c, i) => `<td class="c${i} text">${fn(c)}</td>`).join('');
  return `<tr><th scope="row">${label}</th>${cells}</tr>`;
}

function renderPrintout() {
  const cs = cars();
  const sys = state.units;
  $('#sheet').style.setProperty('--cols', cs.length);
  const head = cs.map((c, i) => `
    <th scope="col" class="c${i}">
      <span class="ink-dot d${i}"></span>
      <span class="car-name">${c.year} ${c.make} <b>${c.model}</b></span>
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
    textRow('Powertrain', (c) => `<span class="pt pt-${c.powertrain.toLowerCase()}">${c.powertrain === 'NA' ? 'Naturally aspirated' : c.powertrain}</span><span class="tag">${c.engine}</span>`),
    textRow('Transmission', (c) => c.transmission),
  ].join('');

  $('#sheet').innerHTML = `
    <caption class="sr-only">Specifications for ${cs.map(fullName).join(', ')}</caption>
    <thead><tr><th scope="col" class="corner">Run sheet</th>${head}</tr></thead>
    <tbody>${rows}</tbody>`;

  $('#sources').innerHTML = cs.map((c, i) => `
    <div class="src-car">
      <h4><span class="ink-dot d${i}"></span>${fullName(c)}</h4>
      <ol>${c.sources.map((s, k) => `<li id="src-${c.id}-${k}"><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')}</ol>
    </div>`).join('');
}

// ---------------------------------------------------------------------------
// Trade-off panel
// ---------------------------------------------------------------------------

function renderTradeoffs() {
  const sections = buildTradeoffs(cars(), state.units, matchSignature(state.cars));
  $('#tradeoff-list').innerHTML = sections.map((s) => `
    <article class="note${s.signature ? ' essay' : ''}" id="t-${s.id}">
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
  renderControls();
  renderRuns();
  renderSlots();
  renderCluster(sweep);
  renderPrintout();
  renderTradeoffs();
  const cs = cars();
  document.title = `${cs.map((c) => c.short).join(' vs ')} | Dyno Compare`;
}

function commit(opts) {
  history.replaceState(null, '', serializeState(state) + location.hash);
  renderAll(opts);
}

document.addEventListener('click', (e) => {
  const run = e.target.closest('[data-run]');
  if (run) {
    state.cars = SIGNATURES.find((s) => s.id === run.dataset.run).cars.slice();
    commit({ sweep: true });
    return;
  }
  const u = e.target.closest('[data-units]');
  if (u) { state.units = u.dataset.units; commit(); return; }
  if (e.target.id === 'add-third') {
    const next = CARS.find((c) => !state.cars.includes(c.id));
    state.cars.push(next.id);
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
  const url = location.href;
  const done = (msg) => {
    btn.dataset.state = 'done';
    $('#share-status').textContent = msg;
    setTimeout(() => { btn.dataset.state = ''; $('#share-status').textContent = ''; }, 2400);
  };
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: document.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    done('Link copied');
  } catch (err) {
    if (err.name !== 'AbortError') done('Copy the link from the address bar');
  }
});

const checked = new Date(`${CHECKED}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
document.querySelectorAll('[data-checked]').forEach((el) => {
  el.textContent = checked;
  if (el.tagName === 'TIME') el.setAttribute('datetime', CHECKED);
});

// Normalize the URL so the address bar is always a shareable link.
history.replaceState(null, '', serializeState(state) + location.hash);
renderAll({ sweep: !matchMedia('(prefers-reduced-motion: reduce)').matches });
