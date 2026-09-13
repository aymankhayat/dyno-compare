// Plain-language engineering trade-offs, generated from the cars actually being
// compared so every explanation cites this comparison's own numbers.
import { format, unit, powerToWeight, weightPerPower, averageG, round, HP_TO_KW } from './units.js';

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
    kw: (kw) => (sys === 'metric' ? `${kw}&nbsp;kW` : `${num(kw / HP_TO_KW)}&nbsp;hp (${kw}&nbsp;kW)`),
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
    const gas = x.byId('porsche-911-carrera');
    const hyb = x.byId('porsche-911-carrera-gts');
    const dW = hyb.weight.v - gas.weight.v;
    const dHp = hyb.hp.v - gas.hp.v;
    return {
      id: 'essay-hybrid',
      kicker: 'Signature run',
      title: 'Hybrid vs gas: a battery for response, not mileage',
      html: `
        <p class="lede">Most hybrids, including the Toyota hybrids I worked on in the service bay, carry a
        battery to save fuel. Porsche’s T-Hybrid carries one so a turbocharged engine answers the throttle
        like a naturally aspirated one. The parts list is familiar: motors, an inverter, a high-voltage
        battery, energy recovery. The priorities are the opposite.</p>

        <h4>What the T-Hybrid adds</h4>
        <p>${x.name(gas)} uses a 3.0-liter twin-turbo flat-six rated at ${x.q('power', gas.hp.v)} and
        ${x.q('torque', gas.torque.v)}. ${x.name(hyb)} moves to a 3.6-liter flat-six with an electric
        turbocharger that makes ${x.q('power', hyb.eng.hp)} and ${x.q('torque', hyb.eng.tq)} on its own. Add the
        motor in its eight-speed PDK and Porsche rates the system at ${x.q('power', hyb.hp.v)} and
        ${x.q('torque', hyb.torque.v)}.</p>
        <p>Porsche’s figures for the pieces: the turbo’s motor sits between the compressor and turbine wheels
        and can also run as a generator, recovering up to ${x.kw(hyb.eturboKw)} from the exhaust stream. The
        transmission motor adds up to ${x.q('torque', hyb.motor.tq)} and ${x.kw(hyb.motor.kw)}. The
        ${hyb.battery.volts}-volt battery holds ${hyb.battery.kwh}&nbsp;kWh gross and is about the size and weight
        of a 12-volt AGM starter battery.</p>

        <h4>Turbo lag, solved electrically</h4>
        <p>The turbo-vs-NA run on this site shows where lag comes from: the turbine needs exhaust energy before
        the compressor can make boost. The T-Hybrid spins the turbo’s shaft from the battery instead of
        waiting, so boost builds before the exhaust alone could build it. Once exhaust flow is plentiful, the
        same motor turns surplus exhaust energy back into electricity. The motor in the PDK covers the other
        gap: torque at low engine speed, before boost is fully up.</p>

        <h4>Why this isn’t a Prius</h4>
        <p>A Toyota power-split hybrid is built around one planetary gearset. The engine sits on the planet
        carrier, motor-generator 1 (MG1) on the sun gear, and the ring gear is the output, driven by
        motor-generator 2 (MG2). MG1’s speed sets engine rpm independently of road speed; that’s the e-CVT,
        with no belt and no clutch packs. The battery is big enough to move the car on electricity alone at
        low speed and cycles constantly to save fuel.</p>
        <p>The T-Hybrid keeps a conventional eight-speed dual-clutch gearbox, the engine always drives the
        wheels, and the battery stays small because it only has to deliver short, hard bursts.</p>

        <h4>What carries over from the service bay</h4>
        <p>The fundamentals don’t change with the badge. Energy recovery under braking is blended with
        friction braking by the brake control system, and how much the motor can absorb depends on what the
        battery can accept at that moment. A small pack makes that tighter: ${hyb.battery.kwh}&nbsp;kWh fills and
        empties in seconds of hard driving, so the control system has to manage state of charge and
        temperature constantly to keep a boost in reserve.</p>
        <p>Toyota packs work in a middle band of charge, never true empty or true full. On Toyota’s
        nickel-metal hydride packs the battery ECU sets the familiar P0A80 “replace hybrid battery pack” code
        when block voltages drift apart, and an air-cooled pack with a lint-clogged intake limits power to
        protect itself. The high-voltage system also needs a healthy 12-volt side to start: it powers the
        control units and closes the system main relays, which is why a weak 12 V battery is one of the most
        common reasons a Toyota hybrid won’t go into READY.</p>

        <h4>The weight bill</h4>
        <p>${x.name(hyb)} weighs ${x.q('mass', hyb.weight.v)} to ${x.name(gas)}’s ${x.q('mass', gas.weight.v)}:
        ${x.q('mass', dW)} more, for the bigger engine, the hybrid hardware and the GTS equipment. In exchange it
        makes ${x.q('power', dHp)} more, taking power-to-weight from ${x.num(x.ptw(gas))} to
        ${x.num(x.ptw(hyb))}&nbsp;${x.ptwUnit}. Porsche claims ${x.s(hyb.zero60.v)} to 60 with the Sport Chrono
        Package, against ${x.s(gas.zero60.v)} for the Carrera (${x.s(3.7)} with Sport Chrono).</p>

        <h4>What this comparison can’t separate</h4>
        <p>The GTS also has 0.6 liters more displacement than the Carrera, so the gap here is hybrid system
        plus bigger engine plus GTS tuning. The closest Porsche comes to isolating the hybrid’s cost is its
        statement that the new GTS coupe gained ${x.q('mass', 103)} over the previous, non-hybrid GTS.</p>`,
    };
  },

  'turbo-na': (x) => {
    const na = x.byId('toyota-gr86');
    const t = x.byId('toyota-gr-supra');
    const dW = t.weight.v - na.weight.v;
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
        behaves like a smaller, lower-compression naturally aspirated engine. On a modern turbo engine that’s
        a fraction of a second, but you feel it as a pause, then a surge, most at low rpm where there’s the
        least exhaust flow to work with.</p>
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
        GR86 with the manual. The Supra carries ${x.q('mass', dW)} more but has ${x.num(x.ptw(t))} against
        ${x.num(x.ptw(na))}&nbsp;${x.ptwUnit}, so it wins the straight line easily. Toyota’s own figures also show
        the gearbox matters: the Supra is quicker with its automatic (${x.s(3.9)} vs ${x.s(4.2)} manual), while
        the GR86 is quicker with its manual (${x.s(6.1)} vs ${x.s(6.6)} automatic). The GR86’s case is the one a
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
    const tq = c.eng ? c.eng.tq : c.torque.v;
    const rpm = c.eng ? null : c.torque.rpm;
    return `${x.name(c)} (${c.induction === 'turbo' ? 'turbo' : 'naturally aspirated'}): ${x.q('torque', tq)}${rpm ? ` at ${rpm} rpm` : ''}${c.eng ? ', engine only' : ''}`;
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
  const weights = x.cars.map((c) => `${x.name(c)}: ${c.drivetrain}, ${x.q('mass', c.weight.v)}${c.awdNote ? `. ${c.awdNote}` : ''}`);

  if (kinds.has('AWD')) {
    // A same-family pair isolates the drivetrain; call it out when present.
    const awd = x.cars.filter((c) => c.drivetrain === 'AWD');
    const pair = awd.map((a) => [a, x.cars.find((c) => c.family === a.family && c.drivetrain !== 'AWD')]).find(([, b]) => b);
    const pairText = pair
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
      wheelspin and torque steer. Front drive earns its place on packaging, cost and weight.</p>`,
  };
}

function ptwSection(x) {
  const rows = x.cars.map((c) => ({ c, p: x.ptw(c), w: x.wpp(c), t: c.zero60.v }));
  const byP = [...rows].sort((a, b) => b.p - a.p);
  const byT = [...rows].sort((a, b) => a.t - b.t);
  const facts = byP.map((r) => `${x.name(r.c)}: ${x.num(r.p)}&nbsp;${x.ptwUnit} (${x.num(r.w, 1)}&nbsp;${x.wppUnit}), ${x.s(r.t)} claimed 0–60`);

  let verdict;
  const [p0, p1] = byP;
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
        average power across the rpm band the car actually uses, so a broad turbo torque plateau, an
        electrically spooled turbo, or an electric motor with full torque from zero can beat a higher peak
        number.</li>
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
    parts.push(`<h4>Hybrids: what the battery is for</h4>
      <p>${hy.map(x.name).join(', ')} put${hy.length === 1 ? 's' : ''} an electric motor between the engine and
      a conventional gearbox and keep${hy.length === 1 ? 's' : ''} the battery small, because the job is short
      bursts of torque rather than driving on electricity. That is the opposite of a Toyota power-split hybrid,
      where a planetary gearset and two motor-generators replace the gearbox and the battery cycles
      constantly to save fuel.</p>
      <p>Either way, energy recovered under braking is blended with the friction brakes, and how much the
      motor can take depends on the battery’s charge and temperature at that moment.</p>`);
  }
  if (ev.length) {
    parts.push(`<h4>Electric drive: full torque from zero rpm, and a heavy battery</h4>
      <p>An electric motor makes its peak torque from a standstill and needs only a single reduction gear, so
      there are no shifts and no waiting for boost or revs. That’s why EVs feel quicker in traffic than their
      power-to-weight suggests. The price is mass: ${ev.map((c) => `${x.name(c)} weighs ${x.q('mass', c.weight.v)}`).join('; ')}.
      Sustained output is managed by battery temperature and charge, which is also why some EVs, like the
      IONIQ 5 N with its 10-second N Grin Boost, quote a short-term peak.</p>`);
  }
  return { id: 'electrified', title: 'Electrified powertrains', html: parts.join('') };
}

const TRANS_TEXT = {
  manual: 'A manual interrupts drive for every shift, and launches depend on the driver, which usually costs time in a 0–60 run. It also keeps the driver in charge of rpm.',
  auto: 'A modern automatic shifts in a fraction of the time a person can and uses more, closer ratios to keep the engine near peak power. It is often quicker in a straight line than the manual version of the same car.',
  dct: 'A dual-clutch gearbox has the next gear pre-selected on a second clutch, so shifts happen with almost no interruption in drive.',
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
  const odd = x.cars.filter((c) => c.torque.basis === 'engine' || c.torque.basis === 'motor');
  if (!odd.length) return null;
  return {
    id: 'torque-basis',
    title: 'Why some torque needles are dashed',
    html: `
      ${list(odd.map((c) => `${x.name(c)}: ${c.torque.note}`))}
      <p>Makers publish torque differently for electrified cars. An engine-only figure understates what
      reaches the wheels once the motors add theirs. Rather than add numbers that were never meant to be
      added, this page shows what the manufacturer published and marks it.</p>`,
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
