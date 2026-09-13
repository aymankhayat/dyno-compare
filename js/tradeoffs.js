// Plain-language engineering trade-offs, generated from the cars actually being
// compared so every explanation cites this comparison's own numbers.
import { format, unit, powerToWeight, weightPerPower, averageG, round } from './units.js';

function makeCtx(cars, sys) {
  const idx = new Map(cars.map((c, i) => [c.id, i]));
  const num = (v, d = 0) => round(v, d).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return {
    cars,
    sys,
    num,
    byId: (id) => cars.find((c) => c.id === id),
    name: (c) => `<b class="ink ink-${idx.get(c.id)}">${c.short}</b>`,
    q: (kind, v, d) => `${format(kind, v, sys, d)}&nbsp;${unit(kind, sys)}`,
    s: (v) => `${v}&nbsp;s`,   // 0-60 claims, printed exactly as published
    ptwUnit: sys === 'metric' ? 'kW/tonne' : 'hp/ton',
    wppUnit: sys === 'metric' ? 'kg/kW' : 'lb/hp',
    ptw: (c) => powerToWeight(c.hp.v, c.weight.v, sys),
    wpp: (c) => weightPerPower(c.hp.v, c.weight.v, sys),
  };
}

const list = (items) => `<ul class="facts">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

// ---------------------------------------------------------------------------
// Signature essays
// ---------------------------------------------------------------------------

const ESSAYS = {
  'hybrid-ice': (x) => {
    const prius = x.byId('toyota-prius');
    const hyb = x.byId('honda-civic-hybrid');
    const gas = x.byId('honda-civic-sport');
    const dW = hyb.weight.v - gas.weight.v;
    const pP = x.ptw(prius), pH = x.ptw(hyb), pG = x.ptw(gas);
    return {
      id: 'essay-hybrid',
      kicker: 'Signature run',
      title: 'Hybrid vs gas, from the service bay',
      html: `
        <p class="lede">A spec sheet says “hybrid” and stops. Underneath, these two hybrids solve the same
        problem in opposite ways, and neither one behaves like the gas car next to it. This is the part
        you learn by diagnosing them, not by reading the brochure.</p>

        <h4>Two ways to wire an engine to two motors</h4>
        <p>${x.name(prius)} uses Toyota’s power-split system. A single planetary gearset ties three things
        together: the engine on the planet carrier, motor-generator 1 (MG1) on the sun gear, and the ring gear,
        which is the output shaft and is driven by motor-generator 2 (MG2, ${x.q('power', prius.motor.hp)} here)
        through a reduction gear. Engine power reaches the wheels two ways at once: mechanically through the
        gears, and electrically as MG1 generates current that MG2 turns back into torque.</p>
        <p>${x.name(hyb)} uses Honda’s two-motor system, which is mostly a series hybrid. The engine spins a
        generator, and the traction motor (${x.q('power', hyb.motor.hp)}, ${x.q('torque', hyb.torque.v)} from
        ${hyb.torque.rpm} rpm, per Honda) drives the wheels on its own. Only at steady highway speed does a
        lock-up clutch couple the engine straight to the wheels through one fixed ratio, because at cruise
        that beats converting mechanical power to electricity and back.</p>

        <h4>What “e-CVT” actually means</h4>
        <p>There is no belt, no pulley and no clutch pack in the Prius’s e-CVT. The “ratio” is whatever MG1’s
        speed makes it: speed MG1 up or slow it down and the planetary set moves engine rpm independently of
        road speed. That’s why a Prius at full throttle holds the engine at a steady, high rpm while the car
        catches up (the “rubber band” feel drivers describe). The engine is parked near its best-power speed
        for the whole run, which is part of why a hybrid’s acceleration beats what its peak-horsepower number
        suggests.</p>
        <p>${x.name(gas)} has a conventional belt-and-pulley CVT doing a similar job mechanically.
        ${x.name(hyb)} has almost no ratio change at all, since the motor drives the wheels directly; Honda’s
        newer calibrations step engine rpm in simulated shifts under hard acceleration so the sound tracks
        the speed.</p>

        <h4>Regenerative braking is blended, not bolted on</h4>
        <p>Press the brake pedal in either hybrid and you’re sending a request rather than pushing fluid
        straight to the calipers. The brake control decides how much of the stop the motor can absorb as
        regeneration and makes up the rest with hydraulic friction braking. How much regen is available
        depends on what the battery can accept at that moment: a pack near the top of its charge window, or
        a cold one, takes less, so more of the stop goes to the pads. Near walking pace regen fades out and
        the friction brakes finish the stop; a good calibration hides that handoff.</p>
        <p>Two things follow in the service bay. Hybrid pads and rotors do so little work that rotors often
        rust before the pads wear out. And because an electronically controlled brake system can build
        pressure on its own (Toyota’s systems can prime when a door opens or the pedal is touched), Toyota’s
        procedures call for disabling it before brake work.</p>
        <p>On long descents Toyota’s B position adds engine braking: when the battery can’t take more charge,
        MG1 spins the unfueled engine so its pumping losses absorb energy instead of the brakes. Honda gives
        the driver deceleration paddles that set how hard regeneration pulls on lift-off.</p>

        <h4>Battery management: the pack lives in the middle</h4>
        <p>The traction battery is almost never allowed to reach true empty or true full. The hybrid control
        system holds state of charge inside a middle window, because shallow cycles in that band are what let
        a pack last the life of the car. The “full” and “empty” bars on the dash are that window, not the
        cells’ real limits.</p>
        <p>The battery ECU watches voltage block by block, pack temperature at several points, and current in
        and out. When block voltages drift apart it flags the pack. On Toyota’s nickel-metal hydride packs
        that’s the familiar P0A80 “replace hybrid battery pack” code, set from the voltage spread between
        blocks rather than a single low reading. Heat is the other enemy: Toyota packs are air-cooled by a
        fan that draws cabin air through an intake by the rear seat, and an intake choked with lint or pet
        hair raises pack temperature until the system limits power to protect it.</p>
        <p>And one thing no spec sheet mentions: the high-voltage system can’t start without a healthy 12-volt
        battery, because the 12 V side powers the control units and closes the system main relays. A weak
        12 V battery is one of the most common reasons a hybrid won’t go into READY.</p>

        <h4>The weight bill</h4>
        <p>The Civic pair makes the cost easy to see because it’s one body with two powertrains.
        ${x.name(hyb)} weighs ${x.q('mass', hyb.weight.v)} to ${x.name(gas)}’s ${x.q('mass', gas.weight.v)}:
        ${x.q('mass', dW)} for the battery, two motors, inverter and their cooling, with the engine still on
        board. In exchange it makes ${x.q('power', hyb.hp.v)} to ${x.q('power', gas.hp.v)}, so power-to-weight
        still improves, from ${x.num(pG)} to ${x.num(pH)}&nbsp;${x.ptwUnit}. ${x.name(prius)}, at
        ${x.q('mass', prius.weight.v)} and ${x.q('power', prius.hp.v)}, lands within
        ${x.num(Math.abs(pP / pH - 1) * 100, 1)}% of the Civic Hybrid on power-to-weight with a completely
        different architecture.</p>

        <h4>What this comparison can’t show yet</h4>
        <p>Honda doesn’t publish 0–60 times for either Civic, so those needles are missing instead of
        estimated; Toyota claims ${x.s(prius.zero60.v)} for the Prius. The torque figures also measure
        different things: Toyota publishes only the Prius engine’s ${x.q('torque', prius.torque.v)}, Honda
        publishes the Civic Hybrid’s traction-motor torque, and the Civic Sport’s figure is its engine and
        the whole story. That’s why two of the torque needles are dashed.</p>`,
    };
  },

  'turbo-na': (x) => {
    const na = x.byId('toyota-gr86');
    const t = x.byId('toyota-gr-supra');
    const dW = t.weight.v - na.weight.v;
    const pNa = x.ptw(na), pT = x.ptw(t);
    return {
      id: 'essay-turbo',
      kicker: 'Signature run',
      title: 'Turbo vs naturally aspirated: read the curves, not the peaks',
      html: `
        <p class="lede">Both are rear-drive Toyota sports cars with a manual option. The difference that
        matters is how each engine fills its cylinders with air.</p>

        <h4>Where the torque lives</h4>
        <p>${x.name(t)}’s turbocharged 3.0-liter six holds its full ${x.q('torque', t.torque.v)} from
        ${t.torque.rpm} rpm. On a dyno sheet that’s a flat tabletop. ${x.name(na)}’s naturally aspirated
        2.4-liter flat-four makes ${x.q('torque', na.torque.v)} at ${na.torque.rpm} rpm and peaks in power at
        ${na.hp.rpm} rpm. The turbo engine is fed compressed air; the naturally aspirated engine only gets
        what atmospheric pressure pushes in, so it makes its power by revving.</p>

        <h4>Lag is about transients, not low rpm</h4>
        <p>“Turbos are weak down low” isn’t quite right: the Supra makes more torque at ${t.torque.rpm.split('–')[0]}
        rpm than the GR86 makes anywhere. The lag shows up on transients. Open the throttle suddenly and the
        turbine needs exhaust energy to spin the compressor up before boost arrives. Until it does, the engine
        behaves like a smaller, lower-compression naturally aspirated engine. On a modern twin-scroll setup
        like the Supra’s that’s a fraction of a second, but you feel it as a pause, then a surge, most at low
        rpm where there’s the least exhaust flow to work with.</p>
        <p>The GR86 has nothing to wait for. Throttle position maps almost directly to torque, which is why
        naturally aspirated engines are prized for response and why drivers can meter power precisely in the
        middle of a corner.</p>

        <h4>Heat, compression and altitude</h4>
        <p>Boost makes heat. Turbo engines run lower compression ratios to avoid knock, need an intercooler to
        cool the charge, and can lose power when that intercooler heat-soaks over repeated hard runs.
        Naturally aspirated engines can run higher compression and give the same output lap after lap.
        Altitude flips the argument: a naturally aspirated engine loses power as the air thins (a common rule
        of thumb is about 3% per 1,000 ft), while a turbo can spin harder to make up most of the loss.</p>

        <h4>What the stopwatch says</h4>
        <p>Toyota claims ${x.s(t.zero60.v)} for the Supra with the automatic and ${x.s(na.zero60.v)} for the
        GR86 with the manual. The Supra carries ${x.q('mass', dW)} more but has ${x.num(pT)} against
        ${x.num(pNa)}&nbsp;${x.ptwUnit}, so it wins the straight line easily. Toyota’s own figures also show the
        gearbox matters: the Supra is quicker with its automatic (${x.s(3.9)} vs ${x.s(4.2)} manual), while the
        GR86 is quicker with its manual (${x.s(6.1)} vs ${x.s(6.6)} automatic). The GR86’s case is the one a
        spec table can’t show: lighter, simpler and more predictable at the limit.</p>`,
    };
  },

  'awd-rwd': (x) => {
    const r = x.byId('bmw-m3-competition');
    const a = x.byId('bmw-m3-competition-xdrive');
    const dW = a.weight.v - r.weight.v;
    const dHp = a.hp.v - r.hp.v;
    return {
      id: 'essay-awd',
      kicker: 'Signature run',
      title: 'AWD vs RWD: what four driven wheels buy, and what they cost',
      html: `
        <p class="lede">This pair isolates the drivetrain better than almost anything you can buy: same body,
        same 3.0-liter twin-turbo six, same 8-speed automatic.</p>

        <h4>One variable, nearly</h4>
        <p>${x.name(a)} makes ${x.q('power', dHp)} more (BMW attributes it to engine-management tuning) and
        weighs ${x.q('mass', dW)} more for the transfer case, front differential, front prop shaft and
        half-shafts. Those two roughly cancel: ${x.num(x.ptw(r))} against ${x.num(x.ptw(a))}&nbsp;${x.ptwUnit}.
        Yet BMW claims ${x.s(a.zero60.v)} to 60&nbsp;mph for the xDrive car and ${x.s(r.zero60.v)} for
        rear drive.</p>

        <h4>Launches are traction-limited</h4>
        <p>From a standstill, two rear tires can’t use all ${x.q('torque', r.torque.v)}; traction control has to
        trim torque until speed builds. The ceiling on acceleration is roughly tire grip × gravity × the share
        of the car’s weight sitting on driven tires. Rear drive gets some help as weight shifts back under
        acceleration, but AWD puts all four contact patches to work, so the ceiling rises. Averaged over the
        run, that’s ${x.num(averageG(r.zero60.v), 2)}&nbsp;g for rear drive against
        ${x.num(averageG(a.zero60.v), 2)}&nbsp;g for xDrive. Most of the gap is won in the first second or two;
        once the car is fast enough that power, not grip, is the limit, the extra hardware is mostly carried
        weight.</p>

        <h4>What AWD costs</h4>
        <p>Mass carried everywhere (${x.q('mass', dW)} here), extra rotating parts and friction in the
        driveline, more to service, and usually a higher price. It also changes balance: sending torque to the
        front tires asks them to steer and drive at once. BMW’s answer is a rear-biased system with a 2WD mode
        that sends all torque to the rear, so the car can behave like the rear-drive version when grip isn’t
        the problem.</p>

        <h4>When rear drive makes more sense</h4>
        <p>In rain or cold, AWD wins everywhere. On a dry road past the first couple of gears, these two cars
        are separated by ${x.q('power', dHp)} and ${x.q('mass', dW)}. Rear drive is lighter and simpler, and
        some drivers want a car that rotates on the throttle.</p>`,
    };
  },
};

// ---------------------------------------------------------------------------
// Generic sections, triggered by what differs between the cars
// ---------------------------------------------------------------------------

function aspiration(x) {
  const ice = x.cars.filter((c) => c.induction);
  const turbo = ice.filter((c) => c.induction === 'turbo');
  const na = ice.filter((c) => c.induction === 'na');
  if (!turbo.length || !na.length) return null;
  const peak = (c) => {
    const e = c.eng;
    const tq = e ? e.tq : c.torque.v;
    const rpm = e ? e.tqRpm : c.torque.rpm;
    if (tq == null) return `${x.name(c)}: torque unverified`;
    return `${x.name(c)} (${c.induction === 'turbo' ? 'turbo' : 'naturally aspirated'}): ${x.q('torque', tq)}${rpm ? ` at ${rpm} rpm` : ''}${e ? ', engine only' : ''}`;
  };
  return {
    id: 'aspiration',
    title: 'Turbo vs naturally aspirated: where the lag comes from',
    html: `
      ${list(ice.map(peak))}
      <p>A turbocharger uses exhaust energy to spin a compressor that forces extra air into the engine. That
      is why turbo engines often show peak torque across a wide, low band: once boost is up, the cylinders
      are fuller than atmospheric pressure alone could make them. A naturally aspirated engine takes in only
      what the atmosphere pushes in, so it builds torque toward the middle of its range and makes power by
      revving.</p>
      <p>Lag is a transient effect, not a lack of low-rpm torque. Snap the throttle open at low rpm and the
      turbine has to spool up before boost arrives, so the response comes as a short pause and then a surge.
      A naturally aspirated engine answers the pedal immediately and proportionally. The trade runs the
      other way on heat and altitude: turbo engines run lower compression, depend on intercooling and can
      heat-soak, but they lose far less power in thin air.</p>`,
  };
}

function drivetrain(x) {
  const kinds = new Set(x.cars.map((c) => c.drivetrain));
  if (kinds.size < 2) return null;
  const weights = x.cars.map((c) => `${x.name(c)}: ${c.drivetrain}${c.weight.v != null ? `, ${x.q('mass', c.weight.v)}` : ''}${c.awdNote ? `. ${c.awdNote}` : ''}`);

  if (kinds.has('AWD')) {
    // A same-family pair isolates the drivetrain; call it out when present.
    const awd = x.cars.filter((c) => c.drivetrain === 'AWD');
    const pair = awd.map((a) => [a, x.cars.find((c) => c.family === a.family && c.drivetrain !== 'AWD')]).find(([, b]) => b);
    const pairText = pair && pair[0].weight.v != null && pair[1].weight.v != null
      ? `<p>${x.name(pair[0])} and ${x.name(pair[1])} share a platform, which isolates the cost:
        ${x.q('mass', pair[0].weight.v - pair[1].weight.v)} for the AWD hardware.</p>`
      : '';
    return {
      id: 'drivetrain',
      title: 'AWD adds weight and cost, and buys traction',
      html: `
        ${list(weights)}
        ${pairText}
        <p>An all-wheel-drive car carries a transfer case or coupling, a front differential and extra shafts.
        That’s weight you haul everywhere, extra friction in the driveline and more parts to service. What it
        buys is traction: the limit on acceleration is roughly tire grip × gravity × the share of weight on the
        driven tires, and AWD puts all of it to work. That pays most at a standing start and on wet or loose
        surfaces. Once a car is moving fast enough that power rather than grip is the limit, AWD’s advantage
        mostly disappears and its weight remains.</p>`,
    };
  }
  return {
    id: 'drivetrain',
    title: 'Front- vs rear-wheel drive: where the weight goes under power',
    html: `
      ${list(weights)}
      <p>Under acceleration, weight shifts toward the rear axle. Rear-drive cars gain grip at the driven
      wheels exactly when they need it; front-drive cars lose it, which is why powerful front-drivers fight
      wheelspin and torque steer. Front drive earns its place on packaging, cost and weight: the whole
      powertrain sits in one compact unit up front. High-output front-drivers like the Civic Type R use a
      limited-slip differential and a front suspension designed to reduce torque steer to put their power
      down.</p>`,
  };
}

function ptwSection(x) {
  const rows = x.cars.map((c) => ({ c, p: x.ptw(c), w: x.wpp(c), t: c.zero60.v }));
  const known = rows.filter((r) => r.p != null).sort((a, b) => b.p - a.p);
  const timed = known.filter((r) => r.t != null);
  const facts = rows.map((r) => r.p == null
    ? `${x.name(r.c)}: can’t be calculated (${r.c.weight.v == null ? 'curb weight' : 'power'} unverified)`
    : `${x.name(r.c)}: ${x.num(r.p)}&nbsp;${x.ptwUnit} (${x.num(r.w, 1)}&nbsp;${x.wppUnit})${r.t != null ? `, ${x.s(r.t)} claimed 0–60` : ''}`);

  let verdict;
  if (timed.length >= 2) {
    const byT = [...timed].sort((a, b) => a.t - b.t);
    const [p0, p1] = timed;
    if (p0.c !== byT[0].c) {
      verdict = `<p>This comparison has the paradox built in. ${x.name(p0.c)} has the most power per
        ${x.sys === 'metric' ? 'tonne' : 'ton'}, but ${x.name(byT[0].c)} is quicker to 60 by its maker’s own
        claim: ${x.s(byT[0].t)} against ${x.s(p0.t)}.</p>`;
    } else {
      const pGap = (p0.p / p1.p - 1) * 100;
      const tGap = (p1.t / p0.t - 1) * 100;
      verdict = `<p>Here the ranking holds: ${x.name(p0.c)} leads on power-to-weight and on the claimed 0–60.
        The margins aren’t proportional, though. Its power-to-weight lead over ${x.name(p1.c)} is
        ${x.num(pGap)}%, while ${x.name(p1.c)} takes ${x.num(tGap)}% longer to reach 60. Power-to-weight sets
        the potential; the list below decides how much of it reaches the road.</p>`;
    }
  } else {
    verdict = `<p>${timed.length ? 'Only one of these cars has' : 'None of these cars have'} a
      manufacturer-published 0–60 time, so this pairing can’t test power-to-weight against the stopwatch.
      The reasons below still decide which one feels quicker.</p>`;
  }

  return {
    id: 'ptw',
    title: 'Power-to-weight: why more power per pound doesn’t always win',
    html: `
      ${list(facts)}
      ${verdict}
      <ul class="reasons">
        <li><b>Traction.</b> Power the tires can’t transmit doesn’t count. Off the line, most cars here are
        grip-limited, so drivetrain and weight distribution matter more than peak output.</li>
        <li><b>The shape of the curve.</b> Peak horsepower happens at one rpm. Acceleration follows the
        average power across the rpm band the car actually uses, so a broad turbo torque plateau, an e-CVT that
        holds the engine at its best-power speed, or an electric motor with full torque from zero can beat a
        higher peak number.</li>
        <li><b>Gearing and shifts.</b> Shorter gearing multiplies torque at the wheels, and every manual shift
        interrupts drive. Toyota’s own figures show it cuts both ways: the GR86 is quicker with its manual,
        the GR Supra with its automatic.</li>
        <li><b>How it feels.</b> Throttle response, low-speed torque and noise shape perceived quickness. A car
        with worse power-to-weight but instant torque can feel faster in traffic than one that needs to be
        revved.</li>
      </ul>`,
  };
}

function electrified(x) {
  const ev = x.cars.filter((c) => c.powertrain === 'EV');
  const hy = x.cars.filter((c) => c.powertrain === 'Hybrid' || c.powertrain === 'PHEV');
  if (!ev.length && !hy.length) return null;
  const parts = [];
  if (hy.length) {
    const toyota = hy.filter((c) => c.transType === 'ecvt');
    const honda = hy.filter((c) => c.transType === 'direct');
    parts.push(`<h4>Hybrids: two power sources and one ratio problem</h4>`);
    if (toyota.length) {
      parts.push(`<p>${toyota.map(x.name).join(', ')} use${toyota.length === 1 ? 's' : ''} Toyota’s
        power-split system: a planetary gearset links the engine, a generator motor and the drive motor, and the
        generator’s speed sets engine rpm independently of road speed. That’s the “e-CVT”. There’s no belt;
        the engine can sit at its most efficient or most powerful speed while the motors make up the
        difference.</p>`);
    }
    if (honda.length) {
      parts.push(`<p>${honda.map(x.name).join(', ')} use${honda.length === 1 ? 's' : ''} Honda’s two-motor
        system: the engine mostly drives a generator and the traction motor drives the wheels, with a lock-up
        clutch for direct engine drive at highway cruise.</p>`);
    }
    parts.push(`<p>Both recover energy by using the motor as a generator under braking, blended with the
      friction brakes. The cost is weight: battery, motors, inverter and cooling, carried on top of an
      engine.</p>`);
  }
  if (ev.length) {
    const heavy = ev.filter((c) => c.weight.v != null);
    parts.push(`<h4>Electric drive: full torque from zero rpm, and a heavy battery</h4>
      <p>An electric motor makes its peak torque from a standstill and needs only a single reduction gear, so
      there are no shifts and no waiting for boost or revs. That’s why EVs feel quicker in traffic than their
      power-to-weight suggests. The price is mass: ${heavy.map((c) => `${x.name(c)} weighs ${x.q('mass', c.weight.v)}`).join('; ')}.
      Sustained output is managed by battery temperature and charge, which is also why some EVs, like the
      IONIQ 5 N with its 10-second N Grin Boost, quote a short-term peak.</p>`);
  }
  return { id: 'electrified', title: 'Electrified powertrains', html: parts.join('') };
}

const TRANS_TEXT = {
  manual: 'A manual interrupts drive for every shift, and launches depend on the driver, which usually costs time in a 0–60 run. It also keeps the driver in charge of rpm and adds weight to nothing.',
  auto: 'A modern automatic shifts in a fraction of the time a person can and uses more, closer ratios to keep the engine near peak power. It is often quicker in a straight line than the manual version of the same car.',
  cvt: 'A belt CVT varies its ratio continuously, holding the engine at an efficient or powerful rpm. The trade is feel: engine speed stops matching road speed, which some drivers dislike.',
  ecvt: 'A power-split e-CVT has no belt: a planetary gearset and a generator motor set engine rpm, so the engine can stay at its best speed while the car accelerates.',
  direct: 'Honda’s two-motor hybrid has no gearbox in the usual sense. The motor drives the wheels directly, and a clutch locks the engine to the wheels at highway speed.',
  single: 'An EV uses a single reduction gear because an electric motor makes usable torque from zero to very high rpm. Nothing to shift, nothing to interrupt drive.',
};

function transmission(x) {
  const types = [...new Set(x.cars.map((c) => c.transType))];
  if (types.length < 2) return null;
  return {
    id: 'transmission',
    title: 'Transmissions: how the power gets metered out',
    html: `
      ${list(x.cars.map((c) => `${x.name(c)}: ${c.transmission}`))}
      ${types.map((t) => `<p>${TRANS_TEXT[t]}</p>`).join('')}
      <p>Toyota’s own claims show the effect isn’t one-directional: the GR86 reaches 60 in ${x.s(6.1)} with
      its manual and ${x.s(6.6)} with its automatic, while the GR Supra does it in ${x.s(3.9)} with its
      automatic and ${x.s(4.2)} with its manual.</p>`,
  };
}

function torqueBasis(x) {
  const odd = x.cars.filter((c) => c.torque.basis === 'engine' || c.torque.basis === 'motor' || c.torque.v == null);
  if (!odd.length) return null;
  return {
    id: 'torque-basis',
    title: 'Why some torque needles are dashed or missing',
    html: `
      ${list(odd.map((c) => `${x.name(c)}: ${c.torque.note}`))}
      <p>Makers publish torque differently for electrified cars. An engine-only figure understates what
      reaches the wheels once the motors add theirs, and motor torque is measured before the reduction gear.
      Rather than add numbers that were never meant to be added, this page shows what the manufacturer
      published and marks it.</p>`,
  };
}

export function buildTradeoffs(cars, sys, signature) {
  const x = makeCtx(cars, sys);
  const covered = new Set(signature?.covers ?? []);
  const out = [];
  if (signature && ESSAYS[signature.id]) out.push({ ...ESSAYS[signature.id](x), signature: true });
  const generic = [
    ['aspiration', aspiration],
    ['drivetrain', drivetrain],
    ['ptw', ptwSection],
    ['electrified', electrified],
    ['transmission', transmission],
    ['torque-basis', torqueBasis],
  ];
  for (const [key, fn] of generic) {
    if (covered.has(key)) continue;
    const s = fn(x);
    if (s) out.push(s);
  }
  return out;
}
