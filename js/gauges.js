// Radial instrument gauges drawn in SVG. One dial carries a needle per car,
// so the comparison reads at a glance, like a shared cluster face.

const NS = 'http://www.w3.org/2000/svg';
const CX = 100;
const CY = 100;
const START = -135;   // degrees from 12 o'clock
const SWEEP = 270;

// Fixed scales so a needle means the same thing in every comparison.
export const SCALES = {
  power: { imperial: { max: 700, major: 100, minor: 25 }, metric: { max: 500, major: 100, minor: 25 } },
  torque: { imperial: { max: 600, major: 100, minor: 25 }, metric: { max: 800, major: 100, minor: 25 } },
  time: { imperial: { max: 10, major: 1, minor: 0.5 }, metric: { max: 10, major: 1, minor: 0.5 } },
};

function svgEl(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function polar(r, deg) {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

export function angleFor(value, max) {
  const f = Math.max(0, Math.min(1, value / max));
  return START + SWEEP * f;
}

let uid = 0;

export function createGauge(host, { slots = 3 } = {}) {
  const id = `gauge${uid++}`;
  host.innerHTML = `
    <h3 class="gauge-title" id="${id}-t"></h3>
    <div class="gauge-dial"></div>
    <ul class="gauge-readouts" aria-labelledby="${id}-t"></ul>`;
  const titleEl = host.querySelector('.gauge-title');
  const list = host.querySelector('.gauge-readouts');

  const svg = svgEl('svg', { viewBox: '0 0 200 200', role: 'img' });
  host.querySelector('.gauge-dial').appendChild(svg);

  const defs = svgEl('defs', {}, svg);
  const ring = svgEl('linearGradient', { id: `${id}-ring`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  svgEl('stop', { offset: 0, 'stop-color': '#6a737c' }, ring);
  svgEl('stop', { offset: 0.45, 'stop-color': '#262b31' }, ring);
  svgEl('stop', { offset: 1, 'stop-color': '#4a525a' }, ring);
  const face = svgEl('radialGradient', { id: `${id}-face`, cx: 0.5, cy: 0.4, r: 0.65 }, defs);
  svgEl('stop', { offset: 0, 'stop-color': '#20262c' }, face);
  svgEl('stop', { offset: 1, 'stop-color': '#0b0e11' }, face);

  svgEl('circle', { cx: CX, cy: CY, r: 98, fill: `url(#${id}-ring)` }, svg);
  svgEl('circle', { cx: CX, cy: CY, r: 93, fill: `url(#${id}-face)` }, svg);
  const scale = svgEl('g', { class: 'dial-scale' }, svg);
  const unitText = svgEl('text', { x: CX, y: 142, class: 'dial-unit', 'text-anchor': 'middle' }, svg);

  const needles = [];
  for (let i = 0; i < slots; i++) {
    const g = svgEl('g', { class: `needle n${i} off` }, svg);
    svgEl('line', { x1: CX, y1: CY + 16, x2: CX, y2: 22 }, g);
    needles.push(g);
  }
  svgEl('circle', { cx: CX, cy: CY, r: 10, class: 'hub' }, svg);
  svgEl('circle', { cx: CX, cy: CY, r: 3.5, class: 'hub-cap' }, svg);

  let scaleKey = '';

  function drawScale({ max, major, minor }) {
    scale.replaceChildren();
    const [sx, sy] = polar(84, START);
    const [ex, ey] = polar(84, START + SWEEP);
    svgEl('path', { d: `M${sx} ${sy} A84 84 0 1 1 ${ex} ${ey}`, class: 'dial-track' }, scale);
    const steps = Math.round(max / minor);
    for (let k = 0; k <= steps; k++) {
      const v = k * minor;
      const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-9;
      const a = angleFor(v, max);
      const [x1, y1] = polar(isMajor ? 72 : 78, a);
      const [x2, y2] = polar(84, a);
      svgEl('line', { x1, y1, x2, y2, class: isMajor ? 'tick major' : 'tick' }, scale);
      if (isMajor) {
        const [tx, ty] = polar(60, a);
        const t = svgEl('text', { x: tx, y: ty + 4, 'text-anchor': 'middle', class: 'dial-num' }, scale);
        t.textContent = Number.isInteger(v) ? String(v) : v.toFixed(1);
      }
    }
  }

  function setNeedle(n, deg) {
    n.style.transform = `rotate(${deg}deg)`;
  }

  // needles: [{ value (in display units), dashed }]
  // readouts: [{ name, text (or null for unverified), note }]
  function update({ title, scale: sc, unit, needles: data, readouts, label, sweep = false }) {
    titleEl.textContent = title;
    const key = `${sc.max}/${sc.major}/${sc.minor}`;
    if (key !== scaleKey) {
      drawScale(sc);
      scaleKey = key;
    }
    unitText.textContent = unit;
    svg.setAttribute('aria-label', label);

    needles.forEach((n, i) => {
      const d = data[i];
      const shown = d && d.value != null;
      n.classList.toggle('off', !shown);
      n.classList.toggle('dashed', Boolean(d && d.dashed));
    });

    const settle = () => needles.forEach((n, i) => {
      const d = data[i];
      if (d && d.value != null) setNeedle(n, angleFor(d.value, sc.max));
    });

    if (sweep) {
      // Ignition self-test: needles sweep to the stop and fall back to their readings.
      // Timers rather than requestAnimationFrame, which pauses in background tabs.
      needles.forEach((n) => setNeedle(n, START));
      svg.getBoundingClientRect();   // commit the start position before animating
      setTimeout(() => {
        needles.forEach((n, i) => { if (data[i] && data[i].value != null) setNeedle(n, START + SWEEP); });
        setTimeout(settle, 720);
      }, 30);
    } else {
      settle();
    }

    list.innerHTML = readouts.map((r, i) => `
      <li class="r${i}">
        <span class="chip" aria-hidden="true"></span>
        <span class="who">${r.name}</span>
        ${r.text == null
          ? '<span class="val unverified">unverified</span>'
          : `<span class="val">${r.text}</span>`}
        ${r.note ? `<span class="basis">${r.note}</span>` : ''}
      </li>`).join('');
  }

  return { update };
}
