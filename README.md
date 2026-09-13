# Dyno Compare

A 3D showroom for comparing performance cars side by side: drag the cars around, tap spec hotspots, read every figure on a spec sheet that links to its manufacturer source, and get a plain-language explanation of the engineering trade-offs behind the numbers.

**[Live Demo](https://aymankhayat.github.io/dyno-compare/)**

![Screenshot](docs/screenshot.png)

## Features

- **3D showroom built in code:** every car is modeled by hand in three.js from its own silhouette and sized from the maker's published length, width, height and wheelbase, so the lineup is to scale. Each model carries its signature details: the 911's round headlights and full-width light bar, the M3's kidney grille, the GR Corolla's roof wing and three exhaust tips, and the IONIQ 5 N's pixel lights. Each car is shown in its own standout color. Drag to orbit, watch the drive-in animation when the lineup changes, and tap spec hotspots pinned to each model.
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

## Tech stack

Plain HTML, CSS and JavaScript (ES modules), with no build step. three.js 0.186 is loaded from jsDelivr through an import map, and the 3D stage loads lazily, so the rest of the page works even without WebGL. Gauges are hand-built SVG. Fonts are Unbounded, Barlow and Barlow Condensed. The site is hosted on GitHub Pages.

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

Open `http://localhost:3000`, and `/tests.html` to run the tests in the browser. No environment variables are needed.

## About

Built by [Ayman Khayat](https://www.linkedin.com/in/ayman-khayat-350b4b335), a mechanical engineering student, drawing on a Toyota dealership internship in hybrid powertrain diagnostics. The 3D cars are hand-built approximations of each model's shape, not official manufacturer models.

MIT licensed.
