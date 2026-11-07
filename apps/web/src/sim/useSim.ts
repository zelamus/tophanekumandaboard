// RAF döngüsü: kablolara + cihaz durumlarına göre RelayEngine.solve çağrılır.
// Kısa devre otomatik olarak termiği atar (e.tc açılır → kumanda kopar).
// Motor faz akısı bozulursa (uğuldama — sargı akımı) ~5 sn içinde yine termik atar.

import { useEffect, useRef } from 'react';
import { RelayEngine } from './engine';
import type { ContactEdge, Pot } from './model';
import { A, getState } from '../store';
import type { CoilState, SolveProbes } from './engine';

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

const SWITCHES = ['b1', 'b2', 'b3', 'b4'] as const;
const COILS = ['c1', 'c2', 'c3', 'c4'] as const;

/** Cihaz iç bağlantılarını (kontakları) kurar.
 *  NOT: termik durumu mağazada tutulur (A.termikArm/termikTrip) ve mağazadan
 *  solve'a (termikArmed) geçer — tek doğruluk kaynağı.
 *  Termik yedek kontakları: tn + tc (95-96 NC) attığında ikisi de açılır. */
function deviceContacts(coils: CoilState, zrClosed: boolean, termikArmed: boolean): ContactEdge[] {
  const s = getState();
  const edges: ContactEdge[] = [];

  // butonlar: c1/c2 ortak çifti + nc (kapalı) / no (açık)
  for (const b of SWITCHES) {
    const pressed = s.pressed[b];
    edges.push({ a: `${b}.c1`, b: `${b}.c2`, closed: true });
    edges.push({ a: `${b}.c1`, b: `${b}.nc`, closed: !pressed });
    edges.push({ a: `${b}.c2`, b: `${b}.nc`, closed: !pressed });
    edges.push({ a: `${b}.c1`, b: `${b}.no`, closed: pressed });
    edges.push({ a: `${b}.c2`, b: `${b}.no`, closed: pressed });
  }

  // e — termik röle (95-96 NC: attığında AÇILIR)
  edges.push({ a: 'e.tn.a', b: 'e.tn.b', closed: termikArmed });
  edges.push({ a: 'e.tc.a', b: 'e.tc.b', closed: termikArmed });
  for (const m of ['m1', 'm2', 'm3'] as const) {
    edges.push({ a: `e.${m}.a`, b: `e.${m}.b`, closed: true });
  }

  // d1 — takma röle
  edges.push({ a: 'd1.com', b: 'd1.nc', closed: !coils.d1 });
  edges.push({ a: 'd1.com', b: 'd1.no', closed: coils.d1 });

  // d2 — zaman rölesi (ZR)
  edges.push({ a: 'd2.no.a', b: 'd2.no.b', closed: zrClosed });
  for (const r of ['c1', 'c2'] as const) {
    edges.push({ a: `d2.${r}.com`, b: `d2.${r}.no`, closed: zrClosed });
    edges.push({ a: `d2.${r}.com`, b: `d2.${r}.nc`, closed: !zrClosed });
  }

  // kontaktörler
  for (const k of COILS) {
    const on = coils[k];
    for (const c of ['m1', 'm2', 'x1', 'x2', 'x3'] as const) {
      edges.push({ a: `${k}.${c}.a`, b: `${k}.${c}.b`, closed: on });
    }
    for (const c of ['k1', 'k2'] as const) {
      edges.push({ a: `${k}.${c}.a`, b: `${k}.${c}.b`, closed: !on });
    }
  }

  // motor kesicisi (F3): R-S-T → e.m1-m3 giriş uçları
  if (s.breakers.motor) {
    edges.push({ a: 'sup.R', b: 'e.m1.a', closed: true });
    edges.push({ a: 'sup.S', b: 'e.m2.a', closed: true });
    edges.push({ a: 'sup.T', b: 'e.m3.a', closed: true });
  }

  return edges;
}

export function useSimLoop(): void {
  const engineRef = useRef<RelayEngine>(new RelayEngine());
  const sigRef = useRef<string>('');
  const epochRef = useRef<number>(-1);
  const stallRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const st = getState();

      // Doküman/preset yükleme, kabloları temizleme veya termik sıfırlama
      // simEpoch'u arttırdıysa: bobin + ZR iç durumunu sıfırla, imza önbelleğini boşalt
      // ve uğuldama sayacını da sıfırla (yoksa sıfırlama sonraki frame'de yeniden atar)
      if (epochRef.current !== st.simEpoch) {
        epochRef.current = st.simEpoch;
        engineRef.current.reset();
        sigRef.current = '';
        stallRef.current = 0;
      }

      // Doğalı dt (5 dk tavan): sekme gizliyken RAF donsa bile geçen gerçek
      // süre ZR sayacına işlenir; tavan yalnız bozuk/ileri zıplayan saate karşı korur.
      const dt = Math.min(300000, t - last);
      last = t;

      const out = engineRef.current.solve({
        wires: st.cables.map((w) => ({ a: w.a, b: w.b })),
        contacts: deviceContacts,
        termikArmed: st.termikArmed,
        sources: (() => {
          const list: { tid: string; pot: Pot }[] = [
            { tid: 'sup.R', pot: 'L1' },
            { tid: 'sup.S', pot: 'L2' },
            { tid: 'sup.T', pot: 'L3' },
            { tid: 'sup.Mp', pot: 'N' },
            { tid: 'sup.X', pot: 'L1' },
            { tid: 'sup.X2', pot: 'N' },
          ];
          if (st.breakers.control) list.push({ tid: 'sup.Rc', pot: 'L1' });
          return list;
        })(),
        dtMs: dt,
        zr: st.zr,
        probes: PROBES,
      });

      // kısa devre → termik hemen atar
      if (out.shorts.length > 0 && st.termikArmed) A.termikTrip();

      // sargı akımı (2+ farklı faz ama motor dönmüyor — uğuldama): ~5 sn sonra termik
      if (out.motor.overCurrent) stallRef.current += dt;
      else stallRef.current = 0;
      if (stallRef.current >= 5000 && st.termikArmed) A.termikTrip();

      // değişim imzası — aynıysa mağaza güncellenmez
      const potKey = [...out.pot].map(([k, v]) => `${k}:${v.join('')}`).join('|');
      const d = out.dev;
      const sig = [
        out.lamps.red, out.lamps.green, out.lamps.yellow, out.lamps.ctrl, out.lamps.white,
        out.ext.yellow, out.ext.red, out.ext.green,
        d.contactors.c1, d.contactors.c2, d.contactors.c3, d.contactors.c4,
        d.d1, d.zr.closed, d.zr.energized, Math.round(d.zr.elapsed),
        d.termik.armed, out.motor.running, out.motor.dir, out.motor.missingPhase,
        out.shorts.length,
        out.unstable,
        potKey,
      ].join(',');
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        A.setSim(out);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); engineRef.current.reset(); };
  }, []);
}
