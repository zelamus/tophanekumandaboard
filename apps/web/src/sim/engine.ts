// Kumanda ve Kontrol Atölyesi — simülasyon motoru
//
// Çalışma mantığı:
//  1. Kablolar + o an kapalı cihaz kontakları bir graf oluşturur.
//  2. Her besleme noktasından (kesici çıkışları) o potansiyelin (L1/L2/L3/N)
//     ulaştığı uçlar BFS ile bulunur.
//  3. Bobinler "faz + nötr" kuralına göre enerjilenir; bobin değişince kontak
//     konumları değişir; graf tekrar çözülür — çözüm durana kadar (en çok 12 adım).
//  4. Zaman rölesi (ZR) gerçek zamanlı çalışır: enerjiliyken sayaç ilerler,
//     enerjisi kesilince sıfırlanır.
//  5. Termik röle atınca yalnızca gecikmeli NC yardımcı kontağı (e.tc) açılır;
//     ana faz köprüleri kapalı kalmaya devam eder (gerçek kart davranışı).

import type { ContactEdge, DeviceRuntime, Pot, SimOutput, TimerConfig } from './model';
import { PHASES } from './model';

/** Bobin durumları (frame'ler arasında saklanır) */
export interface CoilState {
  c1: boolean; c2: boolean; c3: boolean; c4: boolean; d1: boolean;
}

/** Motorun döndüğü yön: 1 = ileri, -1 = geri */
export type MotorDir = 1 | -1;

export interface SolveProbes {
  /** Sabit indikatör lambalarının besleme uçları (faz varsa yanar) */
  indicators: { red: string; green: string; yellow: string; ctrl: string };
  /** Beyaz lamba: iki ucu ayrı — faz+nötr gerekir */
  lamp5: readonly [string, string];
  /** Harici sinyal lambası: faz ucu + ortak toprak ucu */
  ext: { yellow: string; red: string; green: string; gnd: string };
  /** Motor üç fazlı beslenir: [U, V, W] uçları */
  motor: readonly [string, string, string];
  /** Bobin uçları: [A1, A2] */
  coils: {
    c1: readonly [string, string];
    c2: readonly [string, string];
    c3: readonly [string, string];
    c4: readonly [string, string];
    d1: readonly [string, string];
    zr: readonly [string, string];
  };
}

export interface SolveArgs {
  /** Öğrenci kabloları — her zaman iletenkenarlar */
  wires: readonly { a: string; b: string }[];
  /** Cihaz kontakları — bobin/ZR/termik durumuna göre ileten */
  contacts: (coils: CoilState, zrClosed: boolean, termikArmed: boolean) => ContactEdge[];
  /** Besleme uçları (kesici kapalıysa listededir) */
  sources: readonly { tid: string; pot: Pot }[];
  /** Bu çözümde geçen süre (ms) — ZR sayacı için */
  dtMs: number;
  /** ZR zaman rölesi ayarı */
  zr: TimerConfig;
  probes: SolveProbes;
}

const FORWARD_ORDERS: ReadonlySet<string> = new Set(['L1,L2,L3', 'L2,L3,L1', 'L3,L1,L2']);

const sameCoils = (a: CoilState, b: CoilState): boolean =>
  a.c1 === b.c1 && a.c2 === b.c2 && a.c3 === b.c3 && a.c4 === b.c4 && a.d1 === b.d1;

export class RelayEngine {
  coils: CoilState = { c1: false, c2: false, c3: false, c4: false, d1: false };
  zrElapsed = 0;
  zrClosed = false;
  termikArmed = true;

  reset(): void {
    this.coils = { c1: false, c2: false, c3: false, c4: false, d1: false };
    this.zrElapsed = 0;
    this.zrClosed = false;
    this.termikArmed = true;
  }

  termikTrip(): void { this.termikArmed = false; }
  termikReset(): void { this.termikArmed = true; }

  solve(args: SolveArgs): SimOutput {
    const dev: DeviceRuntime = {
      contactors: { c1: this.coils.c1, c2: this.coils.c2, c3: this.coils.c3, c4: this.coils.c4 },
      d1: this.coils.d1,
      zr: { energized: false, elapsed: this.zrElapsed, closed: this.zrClosed },
      termik: { armed: this.termikArmed },
    };

    // --- 1) Kablolar sabit graf: her adımda kontaklar yeniden kurulur ---
    const adj = new Map<string, string[]>();
    const link = (a: string, b: string): void => {
      if (a === b) return;
      let list = adj.get(a);
      if (!list) adj.set(a, list = []);
      if (!list.includes(b)) list.push(b);
      list = adj.get(b);
      if (!list) adj.set(b, list = []);
      if (!list.includes(a)) list.push(a);
    };
    for (const w of args.wires) link(w.a, w.b);

    // --- 2) Bobin çözümleninceye kadar graf + BFS tekrar edilir ---
    let reach: Map<string, Set<Pot>> = new Map();
    for (let iter = 0; iter < 12; iter++) {
      reach = this.reachable(adj, args.contacts(this.coils, this.zrClosed, this.termikArmed), args.sources);
      const energize = makeEnergizer(reach);
      const next: CoilState = {
        c1: energize(...args.probes.coils.c1),
        c2: energize(...args.probes.coils.c2),
        c3: energize(...args.probes.coils.c3),
        c4: energize(...args.probes.coils.c4),
        d1: energize(...args.probes.coils.d1),
      };
      const stable = sameCoils(next, this.coils);
      this.coils = next;
      dev.contactors = { c1: next.c1, c2: next.c2, c3: next.c3, c4: next.c4 };
      dev.d1 = next.d1;
      if (stable) break;
    }

    // --- 3) Zaman rölesi zamanlaması (gerçek zaman, frame başına bir kez) ---
    const zrEn = makeEnergizer(reach)(...args.probes.coils.zr);
    if (zrEn) {
      this.zrElapsed += args.dtMs;
      this.zrClosed = args.zr.mode === 'düz'
        ? this.zrElapsed >= args.zr.delayMs
        : this.zrElapsed < args.zr.delayMs;
    } else {
      this.zrElapsed = 0;
      this.zrClosed = false;
    }
    dev.zr = { energized: zrEn, elapsed: this.zrElapsed, closed: this.zrClosed };

    // --- 4) Lamba / motor çıktıları ---
    const hasPhase = (t: string): boolean =>
      reach.get(t)?.has('L1') === true || reach.get(t)?.has('L2') === true || reach.get(t)?.has('L3') === true;
    const lamps = {
      red: hasPhase(args.probes.indicators.red),
      green: hasPhase(args.probes.indicators.green),
      yellow: hasPhase(args.probes.indicators.yellow),
      ctrl: hasPhase(args.probes.indicators.ctrl),
      white: hasPhase(args.probes.lamp5[0]) && reach.get(args.probes.lamp5[1])?.has('N') === true ||
             hasPhase(args.probes.lamp5[1]) && reach.get(args.probes.lamp5[0])?.has('N') === true,
    };
    const gndN = reach.get(args.probes.ext.gnd)?.has('N') === true;
    const ext = {
      yellow: gndN && hasPhase(args.probes.ext.yellow),
      red: gndN && hasPhase(args.probes.ext.red),
      green: gndN && hasPhase(args.probes.ext.green),
    };

    // Motor: üç uçta da faz olmalı; faz sırası yönü belirler
    const [u, v, w] = args.probes.motor;
    const up = firstPhase(reach, u);
    const vp = firstPhase(reach, v);
    const wp = firstPhase(reach, w);
    const all = up !== null && vp !== null && wp !== null;
    const seq = all ? `${up},${vp},${wp}` : '';
    const motor = {
      running: all && FORWARD_ORDERS.has(seq),
      dir: (FORWARD_ORDERS.has(seq) ? 1 : -1) as MotorDir,
      missingPhase: !all && (up !== null || vp !== null || wp !== null),
    };

    // --- 5) Kısa devre tespiti: aynı uçta çakışan potansiyeller ---
    const shorts: string[] = [];
    for (const [tid, set] of reach) {
      const nPhases = PHASES.filter((p) => set.has(p)).length;
      const hasN = set.has('N');
      if (nPhases >= 2 || (nPhases >= 1 && hasN)) shorts.push(tid);
    }

    const pot = new Map<string, Pot[]>();
    for (const [k, set] of reach) pot.set(k, [...set].sort());

    return { pot, dev, lamps, ext, motor, shorts };
  }

  /** Bir potansiyelin graf üzerinde ulaştığı tüm uçlar */
  private reachable(
    adj: Map<string, string[]>,
    contacts: ContactEdge[],
    sources: readonly { tid: string; pot: Pot }[],
  ): Map<string, Set<Pot>> {
    // Temel graf (kablolar) kopyalanır; kapalı kontaklar üzerine eklenir
    const full = new Map<string, string[]>();
    for (const [k, list] of adj) full.set(k, [...list]);
    const link = (a: string, b: string): void => {
      if (a === b) return;
      let list = full.get(a);
      if (!list) full.set(a, list = []);
      if (!list.includes(b)) list.push(b);
      list = full.get(b);
      if (!list) full.set(b, list = []);
      if (!list.includes(a)) list.push(a);
    };
    for (const c of contacts) if (c.closed) link(c.a, c.b);

    const reach = new Map<string, Set<Pot>>();
    const addPot = (t: string, p: Pot): void => {
      let set = reach.get(t);
      if (!set) reach.set(t, set = new Set());
      set.add(p);
    };

    for (const s of sources) {
      addPot(s.tid, s.pot);
      const seen = new Set<string>([s.tid]);
      const q: string[] = [s.tid];
      while (q.length) {
        const cur = q.shift()!;
        for (const nx of full.get(cur) ?? []) {
          addPot(nx, s.pot);
          if (!seen.has(nx)) {
            seen.add(nx);
            q.push(nx);
          }
        }
      }
    }
    return reach;
  }
}

function makeEnergizer(reach: Map<string, Set<Pot>>): (a: string, b: string) => boolean {
  const has = (t: string, p: Pot): boolean => reach.get(t)?.has(p) === true;
  return (a, b) => {
    if (!reach.has(a) || !reach.has(b)) return false;
    const aPhase = PHASES.some((p) => has(a, p));
    const bPhase = PHASES.some((p) => has(b, p));
    return (aPhase && has(b, 'N')) || (bPhase && has(a, 'N'));
  };
}

function firstPhase(reach: Map<string, Set<Pot>>, t: string): Pot | null {
  const set = reach.get(t);
  if (!set) return null;
  for (const p of PHASES) if (set.has(p)) return p;
  return null;
}

