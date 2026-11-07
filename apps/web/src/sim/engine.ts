// Kumanda ve Kontrol Atölyesi — simülasyon motoru
//
// Çalışma mantığı:
//  1. Kablolar + o an kapalı cihaz kontakları bir graf oluşturur.
//  2. Her besleme noktasından (kesici çıkışları) o potansiyelin (L1/L2/L3/N)
//     ulaştığı uçlar BFS ile bulunur.
//  3. Bobinler "faz + nötr" kuralına göre enerjilenir; bobin değişince kontak
//     konumları değişir; graf tekrar çözülür — çözüm durana kadar (en çok 12 adım).
//  4. Zaman rölesi (ZR) gerçek zamanlı çalışır: 'düz' mod enerjiliyken sayar,
//     gecikme sonunda kontak kapanır; 'ters' mod (off-delay) enerjide anında
//     kapanır, enerjisi kesildikten sonra gecikme kadar kapalı kalır.
//  5. Termik röle atınca yardımcı NC kontakları (e.tc + e.tn) açılır; ana faz
//     köprüleri (e.m1-m3) kapalı kalmaya devam eder (gerçek kart davranışı).
//     Termik durumu mağazadan (SolveArgs.termikArmed) gelir — tek doğruluk kaynağı.

import type { ContactEdge, DeviceRuntime, Pot, SimOutput, TimerConfig } from './model';
import { PHASES } from './model';

/** Bobin durumları (frame'ler arasında saklanır) */
export interface CoilState {
  c1: boolean; c2: boolean; c3: boolean; c4: boolean; d1: boolean;
}

/** Motorun döndüğü yön: 1 = ileri, -1 = geri, 0 = durdu (yön anlamsız) */
export type MotorDir = 1 | 0 | -1;

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
  /** Termik röle durumu — mağazadan beslenir (tek doğruluk kaynağı) */
  termikArmed: boolean;
  /** Besleme uçları (kesici kapalıysa listededir) */
  sources: readonly { tid: string; pot: Pot }[];
  /** Bu çözümde geçen süre (ms) — ZR sayacı için */
  dtMs: number;
  /** ZR zaman rölesi ayarı */
  zr: TimerConfig;
  probes: SolveProbes;
}

const FORWARD_ORDERS: ReadonlySet<string> = new Set(['L1,L2,L3', 'L2,L3,L1', 'L3,L1,L2']);
const REVERSE_ORDERS: ReadonlySet<string> = new Set(['L1,L3,L2', 'L3,L2,L1', 'L2,L1,L3']);

const sameCoils = (a: CoilState, b: CoilState): boolean =>
  a.c1 === b.c1 && a.c2 === b.c2 && a.c3 === b.c3 && a.c4 === b.c4 && a.d1 === b.d1;

export class RelayEngine {
  coils: CoilState = { c1: false, c2: false, c3: false, c4: false, d1: false };
  zrElapsed = 0;
  zrClosed = false;
  /** 'ters' modda enerji kesildikten sonra kontağın kapalı kalacağı kalan süre (ms) */
  zrTail = 0;
  /** Aktif ZR kipi — kip değişince iç ZR durumu sıfırlanır */
  private zrMode: TimerConfig['mode'] | null = null;
  /** ters kipte enerji kesilip tail sayarken re-enerjilemeyi ayırt eder */
  private zrHolding = false;

  reset(): void {
    this.coils = { c1: false, c2: false, c3: false, c4: false, d1: false };
    this.zrElapsed = 0;
    this.zrClosed = false;
    this.zrTail = 0;
    this.zrMode = null;
    this.zrHolding = false;
  }

  solve(args: SolveArgs): SimOutput {
    const dev: DeviceRuntime = {
      contactors: { c1: this.coils.c1, c2: this.coils.c2, c3: this.coils.c3, c4: this.coils.c4 },
      d1: this.coils.d1,
      zr: { energized: false, elapsed: this.zrElapsed, closed: this.zrClosed },
      termik: { armed: args.termikArmed },
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
    let unstable = false;
    for (let iter = 0; iter < 12; iter++) {
      reach = this.reachable(adj, args.contacts(this.coils, this.zrClosed, args.termikArmed), args.sources);
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
      if (iter === 11) unstable = true;
    }
    if (unstable) {
      // Çözüm 12 adımda oturmadı (bobin kendi NC kontağıyla besleniyordu vb.):
      // SON bobin durumuyla kontak grafiğini bir kez daha kur — böylece
      // pot/lamba/motor çıktıları görüntülenen bobinlerle tutarlı kalır.
      reach = this.reachable(adj, args.contacts(this.coils, this.zrClosed, args.termikArmed), args.sources);
    }

    // --- 3) Zaman rölesi zamanlaması (gerçek zaman, frame başına bir kez) ---
    //  düz  (on-delay):  enerjide sayaç akar; delayMs sonunda kontak kapanır,
    //                    enerji kesilince sayaç ve kontak sıfırlanır.
    //  ters (off-delay): enerjide kontak HEMEN kapanır; enerji kesilince
    //                    delayMs kadar kapalı kalır, sonra açılır.
    const zrClosedBefore = this.zrClosed; // relaxation'da kullanılan kontak değeri
    const zrEn = makeEnergizer(reach)(...args.probes.coils.zr);
    // Kip değişimi (düz↔ters): iç ZR durumunu sıfırla — eski tail yeni kipe sızmasın
    if (this.zrMode !== args.zr.mode) {
      this.zrMode = args.zr.mode;
      this.zrElapsed = 0;
      this.zrTail = 0;
      this.zrClosed = false;
      this.zrHolding = false;
    }
    if (args.zr.mode === 'düz') {
      if (zrEn) {
        this.zrElapsed += args.dtMs;
        this.zrClosed = this.zrElapsed >= args.zr.delayMs;
      } else {
        this.zrElapsed = 0;
        this.zrClosed = false;
      }
      dev.zr = { energized: zrEn, elapsed: this.zrElapsed, closed: this.zrClosed };
    } else {
      if (zrEn) {
        if (this.zrHolding) this.zrElapsed = 0; // tail'lerken yeniden enerjilendi → yeni sayım
        this.zrHolding = false;
        this.zrElapsed += args.dtMs;
        this.zrTail = args.zr.delayMs; // enerjiliyken tutma süresi hep taze
        this.zrClosed = true;
      } else if (this.zrTail > 0) {
        this.zrHolding = true;
        this.zrTail -= args.dtMs;
        this.zrClosed = true;
        if (this.zrTail <= 0) {
          this.zrTail = 0;
          this.zrElapsed = 0;
          this.zrClosed = false;
        }
      } else {
        this.zrClosed = false;
        this.zrElapsed = 0;
      }
      dev.zr = {
        energized: zrEn,
        elapsed: zrEn ? this.zrElapsed : this.zrTail, // enerjide sayaç, tutarken kalan süre
        closed: this.zrClosed,
      };
    }
    // ZR kontağı bu karede değiştiyse: devre eşdeğerini yeniden kur — lamba/
    // motor/pot çıktıları YENİ kontakla aynı karede gelsin (1 kare gecikme yok).
    if (this.zrClosed !== zrClosedBefore) {
      reach = this.reachable(adj, args.contacts(this.coils, this.zrClosed, args.termikArmed), args.sources);
    }

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
    // Harici sinyal lambaları simetrik: lambaden faz+N hangi uçtan gelirse
    // gelsin yanmalıdır (gerçekte kutup yönü önemsiz).
    const extEn = makeEnergizer(reach);
    const eg = args.probes.ext;
    const ext = {
      yellow: extEn(eg.yellow, eg.gnd),
      red: extEn(eg.red, eg.gnd),
      green: extEn(eg.green, eg.gnd),
    };

    // Motor: üç uçta da faz olmalı; faz sırası yönü belirler. Gerçek üç fazlı
    // asenkron motor hem ileri hem geri (döngüsel) sırada döner; birbiriyle
    // tekrar eden faz dizisi (ör. L1,L1,L2) ise motor dönmez.
    const [u, v, w] = args.probes.motor;
    const up = firstPhase(reach, u);
    const vp = firstPhase(reach, v);
    const wp = firstPhase(reach, w);
    const all = up !== null && vp !== null && wp !== null;
    const distinct = all ? new Set([up, vp, wp]).size === 3 : false;
    const seq = all ? `${up},${vp},${wp}` : '';
    const fwd = all && distinct && FORWARD_ORDERS.has(seq);
    const bwd = all && distinct && REVERSE_ORDERS.has(seq);
    const running = fwd || bwd;
    // Sargı akımı modeli (ters-zaman kaba sınıflandırma):
    //  • uçlarda ≥2 FARKLI faz ve motor dönmüyor (faz-faz hatası / kilitli rotor):
    //    akım ~5×In → termik ~2 sn'de atar.
    //  • ≥1 faz VE bir terminalde N: akım L→sargı→star→sargı→N yolunu tamamlar
    //    (iki sargı seri, ~2.5×In) → termik ~6 sn'de atar.
    //  • yalnız 1 faz (nötr yok): dönüş yolu yok → akım yok → termik ısınmaz.
    //  • ÇAKIŞMA: faz-faz ve faz-nötr koşulları aynı anda mümkünse EN KÖTÜ
    //    (en hızlı) sınıf geçerli → 2 sn (faultNeutral'dan üstün alır).
    const distinctPhases = new Set([up, vp, wp].filter((p): p is Pot => p !== null)).size;
    const neutralReturn = [u, v, w].some((tid) => reach.get(tid)?.has('N') === true);
    const faultPhases = !running && distinctPhases >= 2;
    const faultNeutral = !running && distinctPhases >= 1 && neutralReturn;
    const motor = {
      running,
      dir: (all && distinct ? (fwd ? 1 : -1) : 0) as MotorDir,
      missingPhase: (!all && (up !== null || vp !== null || wp !== null)) || (all && !distinct),
      overCurrent: faultPhases || faultNeutral,
      stallTripDelayMs: faultPhases ? 2000 : 6000,
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

    return { pot, dev, lamps, ext, motor, shorts, unstable };
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

