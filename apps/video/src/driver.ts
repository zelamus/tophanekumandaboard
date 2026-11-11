// Belirleyici kare sürücüsü — Remotion kareleri bağımsız ve paralel ürettiği
// için durumlı bir motor kullanılamaz. Bunun yerine her kare için simulateAt()
// motoru t=0'dan o kareye kadar sabit adımlarla ileri sarar: saf fonksiyon,
// işçi sayısından bağımsız aynı sonucu verir.
import { RelayEngine } from '../../web/src/sim/engine';
import type { SolveProbes } from '../../web/src/sim/engine';
import type { SimOutput } from '../../web/src/sim/model';
import type { Cable } from '../../web/src/store';
import { presetCables } from '../../web/src/presets';
import { BTN, FPS, T5, WIRE_START, WIRE_STEP } from './timeline';

/** useSim.ts PROBES kopyası — aynen korunur */
const PROBES: SolveProbes = {
  indicators: { red: 'sup.R', green: 'sup.S', yellow: 'sup.T', ctrl: 'sup.Rc' },
  lamp5: ['sup.X', 'sup.X2'],
  ext: { yellow: 'ext.fazY', red: 'ext.fazR', green: 'ext.fazG', gnd: 'ext.gnd' },
  motor: ['sup.U', 'sup.V', 'sup.W'],
  coils: {
    c1: ['c1.a1', 'c1.a2'],
    c2: ['c2.a1', 'c2.a2'],
    c3: ['c3.a1', 'c3.a2'],
    c4: ['c4.a1', 'c4.a2'],
    d1: ['d1.a1', 'd1.a2'],
    zr: ['d2.a1', 'd2.a2'],
  },
};

type Pressed = Record<'b1' | 'b2' | 'b3' | 'b4', boolean>;

/** useSim.ts deviceContacts'ın saf sürümü — mağaza yerine parametre alır */
function deviceContacts(
  pressed: Pressed,
  breakers: { motor: boolean; control: boolean },
  coils: { c1: boolean; c2: boolean; c3: boolean; c4: boolean; d1: boolean },
  zrClosed: boolean,
  termikArmed: boolean,
) {
  const edges: { a: string; b: string; closed: boolean }[] = [];
  for (const b of ['b1', 'b2', 'b3', 'b4'] as const) {
    const on = pressed[b];
    edges.push({ a: `${b}.c1`, b: `${b}.c2`, closed: true });
    edges.push({ a: `${b}.c1`, b: `${b}.nc`, closed: !on });
    edges.push({ a: `${b}.c2`, b: `${b}.nc`, closed: !on });
    edges.push({ a: `${b}.c1`, b: `${b}.no`, closed: on });
    edges.push({ a: `${b}.c2`, b: `${b}.no`, closed: on });
  }
  edges.push({ a: 'e.tn.a', b: 'e.tn.b', closed: termikArmed });
  edges.push({ a: 'e.tc.a', b: 'e.tc.b', closed: termikArmed });
  for (const m of ['m1', 'm2', 'm3'] as const) {
    edges.push({ a: `e.${m}.a`, b: `e.${m}.b`, closed: true });
  }
  edges.push({ a: 'd1.com', b: 'd1.nc', closed: !coils.d1 });
  edges.push({ a: 'd1.com', b: 'd1.no', closed: coils.d1 });
  edges.push({ a: 'd2.no.a', b: 'd2.no.b', closed: zrClosed });
  for (const r of ['c1', 'c2'] as const) {
    edges.push({ a: `d2.${r}.com`, b: `d2.${r}.no`, closed: zrClosed });
    edges.push({ a: `d2.${r}.com`, b: `d2.${r}.nc`, closed: !zrClosed });
  }
  for (const k of ['c1', 'c2', 'c3', 'c4'] as const) {
    const on = coils[k];
    for (const c of ['m1', 'm2', 'x1', 'x2', 'x3'] as const) {
      edges.push({ a: `${k}.${c}.a`, b: `${k}.${c}.b`, closed: on });
    }
    for (const c of ['k1', 'k2'] as const) {
      edges.push({ a: `${k}.${c}.a`, b: `${k}.${c}.b`, closed: !on });
    }
  }
  if (breakers.motor) {
    edges.push({ a: 'sup.R', b: 'e.m1.a', closed: true });
    edges.push({ a: 'sup.S', b: 'e.m2.a', closed: true });
    edges.push({ a: 'sup.T', b: 'e.m3.a', closed: true });
  }
  return edges;
}

function sources(breakers: { motor: boolean; control: boolean }) {
  const list: { tid: string; pot: 'L1' | 'L2' | 'L3' | 'N' }[] = [
    { tid: 'sup.R', pot: 'L1' },
    { tid: 'sup.S', pot: 'L2' },
    { tid: 'sup.T', pot: 'L3' },
    { tid: 'sup.Mp', pot: 'N' },
    { tid: 'sup.X', pot: 'L1' },
    { tid: 'sup.X2', pot: 'N' },
  ];
  if (breakers.control) list.push({ tid: 'sup.Rc', pot: 'L1' });
  return list;
}

export interface FrameState {
  cables: Cable[];
  pressed: Pressed;
  breakers: { motor: boolean; control: boolean };
  termikArmed: boolean;
  zr: { delayMs: number; mode: 'düz' | 'ters' };
  sim: SimOutput;
}

const ALL_WIRES = T5.wires;
const ALL_CABLES = presetCables(T5);

/** frame karesindeki pano durumunu hesaplar (saf, eşzamanlılık-güvenli) */
export function simulateAt(frame: number): FrameState {
  const engine = new RelayEngine();
  const cables: Cable[] = [];
  const breakers = { motor: true, control: true };
  const zr = { delayMs: 3000, mode: 'düz' as const };
  let termikArmed = true;
  let sim: SimOutput | null = null;
  let pressed: Pressed = { b1: false, b2: false, b3: false, b4: false };

  for (let step = 0; step <= frame; step++) {
    // o kareye kadar kurulmuş kablolar
    const n = Math.min(
      ALL_WIRES.length,
      Math.max(0, Math.floor((step - WIRE_START) / WIRE_STEP) + 1),
    );
    if (step < WIRE_START) {
      if (cables.length !== 0) cables.length = 0;
    } else if (cables.length !== n) {
      cables.length = n;
      for (let i = 0; i < n; i++) cables[i] = ALL_CABLES[i];
    }

    pressed = {
      b1: false,
      b3: false,
      b4: false,
      b2: (step >= BTN.press1 && step < BTN.release1) || (step >= BTN.press2 && step < BTN.release2),
    };

    const out = engine.solve({
      wires: cables.map((c) => ({ a: c.a, b: c.b })),
      contacts: (coils, zrClosed, armed) => deviceContacts(pressed, breakers, coils, zrClosed, armed),
      termikArmed,
      sources: sources(breakers),
      dtMs: step === 0 ? 0 : 1000 / FPS,
      zr,
      probes: PROBES,
    });

    // kısa devre → termik hemen atar (useSim'deki kuralın aynısı)
    if (out.shorts.length > 0 && termikArmed) termikArmed = false;
    sim = out;
  }

  return {
    cables: cables.slice(),
    pressed,
    breakers,
    termikArmed,
    zr,
    sim: sim!,
  };
}
