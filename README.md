# Dyno Compare

A 3D showroom for comparing performance cars side by side: drag the cars around, tap spec hotspots, read every figure on a spec sheet that links to its manufacturer source, and get a plain-language explanation of the engineering trade-offs behind the numbers.

**[Live Demo](https://aymankhayat.github.io/dyno-compare/)** · **[Case study](CASE_STUDY.md)** · 9 cars · 45 manufacturer figures from 11 documents · 32 automated tests

![Screenshot](docs/screenshot.png)

## Features

- **3D showroom with real car models:** each car is a credited Sketchfab model, compressed for mobile and turned, scaled to the maker's published length and set on the floor in code (`js/realcars.js`), so the lineup is to scale. If a model file can't load, a built-in shape made in code (`js/carmodels.js`) stands in. Drag to orbit, watch the drive-in animation when the lineup changes, and tap spec hotspots pinned to each model.
- **Three signature runs** load first, each isolating one trade-off:
  - **Hybrid vs gas:** Porsche 911 Carrera vs 911 Carrera GTS T-Hybrid. An electric turbo and a PDK-integrated motor used to kill turbo lag, contrasted with Toyota's power-split hybrid system from a hybrid-diagnostics point of view.
  - **Turbo vs naturally aspirated:** Toyota GR86 vs GR Supra 3.0.
  - **AWD vs RWD:** BMW M3 Competition vs M3 Competition M xDrive.
- **Pick any 2 or 3 cars** from 9 current US-market performance cars (Toyota GR, BMW M, Porsche 911, Hyundai IONIQ 5 N).
- **Instrument cluster:** radial gauges for power, torque and 0–60, with one needle and glowing arc per car.
- **Units toggle:** imperial (mph, hp, lb, lb-ft) or metric (km/h, kW, kg, N·m).
- **Explain the trade-offs toggle:** turns the generated explanations on or off.
- **Shareable links:** the URL always encodes the comparison on screen, e.g. `?cars=toyota-gr86,toyota-gr-supra&units=metric`.
- **Mobile layout:** compact gauge rows, a swipeable run carousel, and opt-in rotation so the 3D stage never traps page scrolling.
- **Portfolio layer:** film grain, tachometer-style glowing rings, a live-data ticker and KPI strip computed from `js/data.js`, story sections using real renders of the site, Engineering Notes and an Open Graph share card. Motion respects `prefers-reduced-motion`.

## Tech stack

Plain HTML, CSS and JavaScript (ES modules), with no build step. three.js 0.186 is loaded from jsDelivr through an import map, and the 3D stage loads lazily, so the rest of the page works even without WebGL. Gauges are hand-built SVG. Fonts are Unbounded, Barlow, Barlow Condensed and JetBrains Mono. The site is hosted on GitHub Pages. All images are real renders of the site (`assets/`); the share card is rendered from `docs/og-card.html`.

## Engineering notes

Four real problems from building this, each with what it measured out to, are written up in **[CASE_STUDY.md](CASE_STUDY.md)**: cutting the lineup from 18 to 9 cars so all 45 figures are published, checking conversions against Toyota's own numbers, shrinking 6 real car models from 135 MB to 19 MB, and keeping a WebGL stage from trapping mobile scrolling.

## 3D model credits

Models are used under their authors' Creative Commons licenses, compressed with gltf-transform (meshopt, WebP textures) and scaled in code. They are community models, not official manufacturer data. NonCommercial licenses apply to this personal portfolio project.

| Used for | Model | Author | License |
| --- | --- | --- | --- |
| GR86 | [2022 Toyota GR86](https://sketchfab.com/3d-models/2724aadbf88b4706a26cf7d1b2332d0c) | ddiaz-design | CC BY-NC-SA 4.0 |
| GR Supra | [Toyota GR Supra](https://sketchfab.com/3d-models/371c9c1ded6440699b7c261c0fb82a2c) | 0verly | CC BY-NC 4.0 |
| GR Corolla | [2023 Toyota GR Corolla](https://sketchfab.com/3d-models/204283fa663d4ccea7f3bdfd1ba6680e) | srineshchethiya | CC BY 4.0 |
| M3, M3 Competition, M3 Competition M xDrive | [2021 BMW M3 Competition (G80)](https://sketchfab.com/3d-models/a9027a26b7ee4da4b564d939b6c27559) | supercarmodels | CC BY 4.0 |
| 911 Carrera, 911 Carrera GTS T-Hybrid | [2022 Porsche 911 GT3 Touring (992)](https://sketchfab.com/3d-models/a76364a3d50c4d78912a28250cb57be5) | ddiaz-design | CC BY-NC-SA 4.0 |
| IONIQ 5 N | [2024 Hyundai Ioniq 5 N](https://sketchfab.com/3d-models/8d16325eb7974a948627b3cd77f30f52) | ddiaz-design | CC BY-NC 4.0 |

## Data methodology

- **Only complete cars.** The lineup only includes cars whose makers publish every figure shown: 0–60, top speed, power, torque and curb weight. The tests fail if any figure is blank.
- **Sources:** Toyota.com full specification pages, BMW Group PressClub USA, Porsche USA technical data and Porsche Newsroom, HyundaiUSA.com and Hyundai Newsroom. Every value in [`js/data.js`](js/data.js) carries an index into that car's source list, and the spec sheet links to it.
- **0–60 times are manufacturer claims** and are labeled that way. Two are quoted rather than read from a spec page: the GR Corolla's 4.9 s is Toyota's claim as quoted by Edmunds, and the IONIQ 5 N's top speed comes from Hyundai's launch release.
- **Last checked:** 13 September 2026, shown on the site.

## Unit conversions

All data is stored in US units exactly as published and converted in one place, [`js/units.js`](js/units.js): mph → km/h × 1.609344, hp → kW × 0.745699872, lb → kg × 0.45359237, lb-ft → N·m × 1.3558179483. The test page checks **60 mph = 96.6 km/h** and **300 hp = 224 kW**, and cross-checks derived figures against ones Toyota publishes itself.

## Getting started

There's no install and no build. Serve the folder with any static server, since ES modules don't load from `file://`:

```bash
npx serve .
```

Add `?clean` to any comparison URL to hide the interface over the 3D stage, which is how the images in `assets/` were captured.

Open `http://localhost:3000`, and `/tests.html` to run the tests in the browser. No environment variables are needed.

## About

Built by [Ayman Khayat](https://www.linkedin.com/in/ayman-khayat-350b4b335), a mechanical engineering student, drawing on a Toyota dealership internship in hybrid powertrain diagnostics. The 3D cars are credited community models (see above), not official manufacturer models.

MIT licensed.
