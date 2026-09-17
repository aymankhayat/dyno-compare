// Portfolio layer: live-data ticker, KPI numbers, scroll reveal and the hero's cursor light.
// Numbers come from js/data.js so the page can't drift from the data.
import { CARS, SIGNATURES, MODEL_FILES } from './data.js';

// 3D model credits: list only the model files that are actually deployed.
const creditsEl = document.getElementById('model-credits');
if (creditsEl) {
  Promise.all(Object.values(MODEL_FILES).map((m) =>
    fetch(m.file, { method: 'HEAD' }).then((r) => (r.ok ? m : null)).catch(() => null)))
    .then((found) => {
      const used = found.filter(Boolean);
      if (!used.length) return;
      creditsEl.innerHTML = `3D models: ${used.map((m) =>
        `<a href="${m.url}" target="_blank" rel="noopener">${m.title}</a> by ${m.author} (${m.license})`).join('; ')}. Models are scaled to each car’s published length and are close stand-ins, not official manufacturer data.`;
      creditsEl.hidden = false;
    });
}

document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FIGURES = ['hp', 'torque', 'weight', 'zero60', 'top'];

// KPIs
const kpi = {
  cars: CARS.length,
  figures: CARS.reduce((n, c) => n + FIGURES.filter((k) => c[k].v != null).length, 0),
  sources: new Set(CARS.flatMap((c) => c.sources.map((s) => s.url))).size,
  models: new Set(CARS.map((c) => c.model3d)).size,
  runs: SIGNATURES.length,
};
document.querySelectorAll('[data-kpi]').forEach((el) => {
  if (kpi[el.dataset.kpi] != null) el.textContent = kpi[el.dataset.kpi];
});

// Ticker: published readouts in dyno-printout form.
const ticker = document.getElementById('ticker');
if (ticker) {
  const item = (c) => `<span class="tk"><span class="tick" aria-hidden="true"></span><b>${c.short.toUpperCase()}</b>`
    + ` ${c.hp.v} HP / ${c.torque.v} LB-FT${c.torque.rpm ? ` @ ${c.torque.rpm} RPM` : ''} / 0-60 ${c.zero60.v} S / ${c.top.v} MPH</span>`;
  const run = CARS.map(item).join('')
    + `<span class="tk"><span class="tick" aria-hidden="true"></span><b>${kpi.figures} FIGURES</b> FROM ${kpi.sources} MANUFACTURER DOCUMENTS</span>`;
  // Two copies make the loop seamless; the second is hidden from assistive tech.
  ticker.innerHTML = `<div class="tk-run">${run}</div><div class="tk-run" aria-hidden="true">${run}</div>`;
  ticker.querySelectorAll('.tk-run').forEach((r) => { r.style.display = 'flex'; });
}

// Scroll reveal (translate only; content is visible without it).
const revealEls = document.querySelectorAll('[data-reveal]');
if (reduce || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => io.observe(el));
}

// Cursor-following light in the hero, fine pointers only.
const stage = document.querySelector('.stage');
if (stage && !reduce && matchMedia('(pointer: fine)').matches) {
  let frame = 0;
  stage.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--mx', `${e.clientX - r.left}px`);
      stage.style.setProperty('--my', `${e.clientY - r.top}px`);
      frame = 0;
    });
  });
}
