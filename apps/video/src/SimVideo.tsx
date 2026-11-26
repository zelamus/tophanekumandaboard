// Simülasyon kompozisyonu — GERÇEK pano bileşeni (Board) + GERÇEK mağaza
// (store) + GERÇEK çözücü çıktısı render edilir; burada pano çizimi
// taklit edilmez. Her karede simulateAt(frame) hesaplanır ve durum
// delayRender/continueRender el sıkışmasıyla mağazaya yazılır.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Board } from '../../web/src/board/render';
import { A } from '../../web/src/store';
import type { SimOutput } from '../../web/src/sim/model';
import { T5, WIRE_START, WIRE_STEP, WIRING_END, BTN, TOTAL } from './timeline';
import { simulateAt } from './driver';

const AMBER = '#c9a227';
const INK = '#f5f5f7';
const SUB = '#a1a1a6';

/* ------------------------------------------------------------------
   mağaza köprüsü — kare durumunu gerçek mağazaya yazar
   ------------------------------------------------------------------ */

function useStoreBridge(
  st: ReturnType<typeof simulateAt>,
): void {
  const frame = useCurrentFrame();
  // her kare için bir handle: mağaza yazımı bitmeden kare çekilmesin
  const handle = useMemo(() => delayRender(`kare-${frame}`), [frame]);
  const lastPressed = useRef({ b1: false, b2: false, b3: false, b4: false });

  useEffect(() => {
    A.loadDoc({
      v: 1,
      cables: st.cables,
      breakers: st.breakers,
      zr: st.zr,
      termikArmed: st.termikArmed,
      ayar: {
        sfx: { on: false, vol: 0 },
        theme: 'dark',
        sag: 100,
        cableType: 'normal',
        vurgula: false,
      },
    });
    for (const id of ['b1', 'b2', 'b3', 'b4'] as const) {
      if (st.pressed[id] !== lastPressed.current[id]) {
        if (st.pressed[id]) A.pressButton(id);
        else A.releaseButton(id);
      }
    }
    lastPressed.current = st.pressed;
    A.setSim(st.sim);

    // store güncellemesinin React commit'i bitirmesi için iki kare bekle
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => continueRender(handle));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [st, handle]);
}

/* ------------------------------------------------------------------
   kaplamalar
   ------------------------------------------------------------------ */

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 18px',
  borderRadius: 12,
  background: 'rgba(13, 14, 17, 0.82)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(10px)',
  color: INK,
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 700,
};

function TitleCard(): React.ReactNode {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const out = interpolate(frame, [55, 75], [1, 0], { extrapolateRight: 'clamp' });
  const scrim = interpolate(frame, [0, 12, 58, 75], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* koyu perde — başlık bembeyaz panonun üstünde okunur olsun */}
      <AbsoluteFill style={{ background: 'rgba(13, 14, 17, 0.78)', opacity: scrim }} />
      <div
        style={{
          opacity: inn * out,
          transform: `translateY(${interpolate(inn, [0, 1], [26, 0])}px)`,
          textAlign: 'center',
          color: INK,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 6, color: AMBER, fontWeight: 700, marginBottom: 14 }}>
          MEB · KUMANDA VE KONTROL ATÖLYESİ 10
        </div>
        <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -1 }}>
          TEMRİN 5 — Bastıkça Çalıştırmalı
        </div>
        <div style={{ fontSize: 28, color: SUB, marginTop: 16 }}>
          Devre tek tek kurulur, sonra çalıştırılır
        </div>
      </div>
    </AbsoluteFill>
  );
}

function WireCaption({ frame }: { frame: number }): React.ReactNode {
  if (frame < WIRE_START || frame >= WIRING_END) return null;
  const idx = Math.min(T5.wires.length - 1, Math.floor((frame - WIRE_START) / WIRE_STEP));
  const w = T5.wires[idx];
  const inn = spring({ frame: frame - WIRE_START - idx * WIRE_STEP, fps: 30, config: { damping: 16, stiffness: 120 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 34,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          ...chipStyle,
          fontSize: 26,
          opacity: inn,
          transform: `translateY(${interpolate(inn, [0, 1], [14, 0])}px)`,
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 999, background: w.color, display: 'inline-block' }} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{w.a}</span>
        <span style={{ color: AMBER }}>⇄</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{w.b}</span>
        <span style={{ color: SUB, fontSize: 20 }}>{idx + 1} / {T5.wires.length}</span>
      </div>
    </div>
  );
}

function StatusChips({ sim, frame }: { sim: SimOutput; frame: number }): React.ReactNode {
  if (frame < WIRING_END || frame >= TOTAL - 12) return null;
  const inn = spring({ frame: frame - WIRING_END, fps: 30, config: { damping: 16, stiffness: 120 } });
  const chip = (label: string, value: string, color: string): React.ReactNode => (
    <div style={{ ...chipStyle, fontSize: 22 }}>
      <span style={{ color: SUB, fontWeight: 700 }}>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
  const GRAY = '#98989d';
  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        right: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        opacity: inn,
      }}
    >
      {chip('Motor', sim.motor.running ? (sim.motor.dir === 1 ? 'İLERİ' : 'GERİ') : 'DURDU', sim.motor.running ? '#52d66a' : GRAY)}
      {chip('K1', sim.dev.contactors.c1 ? 'ÇEKTİ' : 'DÜŞTÜ', sim.dev.contactors.c1 ? '#52d66a' : GRAY)}
      {chip('H1 kırmızı', sim.ext.red ? 'YANIYOR' : '—', sim.ext.red ? '#ff8a80' : GRAY)}
      {chip('H2 yeşil', sim.ext.green ? 'YANIYOR' : '—', sim.ext.green ? '#52d66a' : GRAY)}
    </div>
  );
}

function EndCard(): React.ReactNode {
  const frame = useCurrentFrame();
  if (frame < TOTAL - 30) return null;
  const inn = interpolate(frame, [TOTAL - 30, TOTAL - 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          opacity: inn,
          textAlign: 'center',
          color: INK,
          fontFamily: 'Arial, Helvetica, sans-serif',
          background: 'rgba(13, 14, 17, 0.86)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 18,
          padding: '34px 52px',
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 900 }}>Pano Simülatörü</div>
        <div style={{ fontSize: 26, color: AMBER, marginTop: 10, fontWeight: 700 }}>
          Kumanda ve Kontrol Atölyesi 10 · Tophane
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------
   ana kompozisyon
   ------------------------------------------------------------------ */

export const SimVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const st = useMemo(() => simulateAt(frame), [frame]);
  useStoreBridge(st);

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, #1a1c22 0%, #0d0e11 100%)' }}>
      {/* gerçek pano — uygulama bileşeni aynen; kap, viewBox oranıyla
          aynı en-boy oranında: çerçeveleme belirleyici, taşma kırpmalı */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          aspectRatio: '1240 / 1180',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Board />
      </div>
      <TitleCard />
      <WireCaption frame={frame} />
      <StatusChips sim={st.sim} frame={frame} />
      <EndCard />
    </AbsoluteFill>
  );
};
