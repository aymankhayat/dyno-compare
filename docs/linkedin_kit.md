# LinkedIn kit: Dyno Compare

Nothing here has been posted. Copy, edit and post it yourself.
Humanizer pass (done by hand, since the scoring script needs Python): no em dashes, straight quotes, no invisible characters, no slop-lexicon words, 3 hashtags, links kept out of the post body.

---

## 1. Launch post

Hook options considered:
1. **Number Reveal (shipped):** I cut my car-comparison site from 18 cars to 9 so that none of its 45 numbers had to be guessed.
2. Myth Bust: Turbo lag isn't a lack of low-rpm torque. The GR Supra makes 368 lb-ft from 1,800 rpm.
3. Insider Secret: After a Toyota internship in hybrid diagnostics, the part spec sheets never show is why two cars with similar numbers drive differently.

Why #1: it leads with the decision that makes the project credible, and the number survives truncation.

```text
I cut my car-comparison site from 18 cars to 9 so that none of its 45 numbers had to be guessed.

Dyno Compare puts two or three performance cars side by side in a 3D showroom. Every figure links to the manufacturer document it came from: 45 figures, 11 documents, 0 estimates.

The idea came from my internship at a Toyota dealership, working on hybrid powertrain diagnostics. What I saw in the service bay rarely matched what the brochure implied, so I built this to learn the engineering behind the numbers.

What I had to get right:
- Units. One conversion module and 31 automated tests. The GR Supra's computed weight-to-power is 8.90 lb/hp; Toyota publishes 8.89.
- The cars. Six models built in three.js from traced silhouettes, sized from published length, width, height and wheelbase. 19 KB of code, no model files.
- The explanations. Each comparison writes its own trade-offs: why turbos lag on transients, why AWD wins launches, and how Porsche's T-Hybrid spends its battery on throttle response instead of mileage.

The hardest call was deleting half the lineup. A blank is honest. A borrowed number isn't.

Which car would you put on the dyno next? (Links in the first comment.)

#MechanicalEngineering #Automotive #HybridVehicles
```

### First comment (post right after publishing)

```text
Live demo: https://aymankhayat.github.io/dyno-compare/
Code: https://github.com/aymankhayat/dyno-compare
Case study, four engineering problems and what each one measured out to: https://github.com/aymankhayat/dyno-compare/blob/main/CASE_STUDY.md
```

```
POST READY
hook: #2 Number Reveal
length: about 1,250 characters
```

---

## 2. Projects section entry

**Project name:** Dyno Compare
**Associated with:** (your university, if you want it listed)
**Project URL:** https://aymankhayat.github.io/dyno-compare/

**Description:**
```text
A 3D showroom for comparing performance cars side by side, inspired by my internship in hybrid powertrain diagnostics at a Toyota dealership.

- 9 cars from Toyota GR, BMW M, Porsche and Hyundai, with 45 manufacturer figures from 11 source documents and 0 estimated numbers. The lineup was cut from 18 cars so every figure is published by the maker.
- 6 car models built in three.js from traced silhouettes and sized from published dimensions, in 19 KB of code with no model files.
- SVG instrument cluster, a sourced spec sheet, shareable comparison links and generated explanations of turbo vs NA, AWD vs RWD and hybrid vs gas trade-offs.
- 31 automated tests, including unit conversions (60 mph = 96.6 km/h, 300 hp = 224 kW) and a power-to-weight check within 0.01 lb/hp of Toyota's published GR Supra figure.

Case study: https://github.com/aymankhayat/dyno-compare/blob/main/CASE_STUDY.md
```
**Skills to tag:** three.js, JavaScript, Automotive Engineering, Hybrid Vehicles, Data Validation

---

## 3. CV bullets by target role

### Automotive engineering (OEM / tier-1 internships)
- Built Dyno Compare, a vehicle comparison tool covering 9 performance cars on 45 manufacturer-sourced figures (power, torque, curb weight, 0-60, top speed), with generated explanations of turbo vs NA, AWD vs RWD and hybrid vs ICE trade-offs.
- Validated derived metrics against OEM data, matching Toyota's published GR Supra weight-to-power ratio within 0.01 lb/hp, backed by 31 automated tests.

### Dealership / service technical roles
- Drew on hybrid powertrain diagnostics experience from a Toyota dealership internship to write a technical explainer on regenerative brake blending, power-split e-CVT operation and hybrid battery management, published in a live comparison tool.
- Sourced 45 specifications from 11 manufacturer documents and cut the vehicle lineup from 18 to 9 rather than publish unverified figures.

### Software / front-end
- Built and deployed a static three.js and SVG web app with no build step: 6 procedurally modeled cars sized from published dimensions in 19 KB of code, shareable URL state and a mobile-safe 3D stage that pauses rendering off-screen.
- Wrote a 31-test browser suite covering unit conversions, data integrity and URL state; live at aymankhayat.github.io/dyno-compare.

### General mechanical engineering
- Designed and built Dyno Compare, a 3D vehicle comparison site with 9 cars, 45 sourced specifications and 31 automated tests, explaining the engineering behind turbocharging, drivetrain layout and hybrid systems; live at aymankhayat.github.io/dyno-compare.
