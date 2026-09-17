# Case study: Dyno Compare

**Live:** https://aymankhayat.github.io/dyno-compare/ · **Code:** https://github.com/aymankhayat/dyno-compare
**Built by:** [Ayman Khayat](https://www.linkedin.com/in/ayman-khayat-350b4b335), mechanical engineering student

## The problem

Spec sheets tell you what a car makes, not why two cars with similar numbers drive differently. Most comparison sites also mix manufacturer figures with magazine tests and simulated estimates without saying which is which. The idea came from a Toyota dealership internship in hybrid powertrain diagnostics, where the gap between the brochure and what you see in the service bay is obvious.

The goal: a comparison tool where **every number is traceable to the manufacturer**, and every comparison **explains the engineering trade-off** behind the numbers.

## Approach

- **Data as the source of truth.** Every figure in `js/data.js` carries an index into that car's list of manufacturer documents. Values are stored in the units the maker publishes and converted to metric in one module (`js/units.js`).
- **Plain static stack.** HTML, CSS and ES modules, with no build step. three.js is loaded lazily from a CDN, so the page works without WebGL.
- **Explanations generated from the data.** `js/tradeoffs.js` writes sections from what actually differs between the selected cars (aspiration, drivetrain, transmission, electrification, power-to-weight), plus three hand-written essays for the signature runs.
- **Tests in the browser.** `tests.html` runs 32 checks on conversions, data integrity, URL state and the trade-off generator.

## Engineering notes

### 1. Zero blanks without guessing
- **Problem:** The first lineup had 18 US-market cars. Most makers don't publish top speed and several don't publish 0–60, and the most complete test sources couldn't be read by the tools used to build this.
- **Approach:** Instead of borrowing simulated or unverifiable figures, the lineup was cut to cars whose makers publish all five headline figures (power, torque, curb weight, 0–60, top speed). A test fails if any figure is blank.
- **Result:** 18 → 9 cars, with 45 of 45 figures sourced from 11 manufacturer documents and 0 estimated numbers.

### 2. Conversions checked against the maker's own math
- **Problem:** Unit toggles are easy to get subtly wrong (mechanical vs metric horsepower, rounding).
- **Approach:** One conversion module with exact factors. Tests pin reference values and cross-check derived figures against numbers a manufacturer prints itself.
- **Result:** 60 mph = 96.6 km/h and 300 hp = 224 kW pass. The GR Supra's computed weight-to-power is 8.90 lb/hp against Toyota's published 8.89.

### 3. Real car models that load on a phone
- **Problem:** Two passes of cars built in code (extruded body styles, then hand-traced silhouettes) never looked like the real cars. Real community models look right but arrive at 17–46 MB each, authored at different scales and facing different directions.
- **Approach:** Each car is a licensed Sketchfab model, compressed with gltf-transform (meshopt geometry, WebP textures), then turned, scaled to the maker's published length, centered and set on the floor in code (`js/realcars.js`). The built-in shapes stay as a fallback if a file fails. Mesh simplification visibly dented the GR Corolla's body panels, so it was switched off; the M3's textures were capped at 512 px instead.
- **Result:** 6 models went from 135 MB to 19 MB total (1.5–6.2 MB each), and only the cars on screen are downloaded. Every artist and license is credited on the site. The two 911s share a 992 GT3 Touring body, the closest free stock 992.

### 4. A 3D stage that doesn't trap your thumb
- **Problem:** A full-height WebGL canvas swallowed touch scrolling on phones, and the gauge needle sweep (requestAnimationFrame) stalled in background tabs.
- **Approach:** Rotation is opt-in on coarse pointers, the render loop pauses when the canvas is off-screen or the tab is hidden, and the sweep uses timers.
- **Result:** 0 px horizontal overflow at 375 px and 400 px widths, and needles settle correctly in hidden tabs.

## Result

- 3 signature runs (hybrid vs gas, turbo vs NA, AWD vs RWD), plus any 2–3 of 9 cars
- Instrument cluster, sourced spec sheet, generated trade-offs, shareable URLs
- 32 automated tests passing
- Portfolio layer: film grain, tachometer rings, live-data ticker, KPI strip. All imagery on the site is real renders of the site itself; no AI-generated images are used.
