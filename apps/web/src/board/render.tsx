// Pano çizimi — fotoğraftaki pano birebir SVG olarak yeniden üretilir.
// Öğrenci kabloları yuvarlak, istiflenen kablolar olarak panonun üstüne
// çizilir; dübel soketler kabloların ucunu örtecek şekilde en sonda çizilir.

import { useEffect, useRef, useState } from 'react';
import * as G from './geometry';
import type { SocketDef } from './geometry';
import { A, useStore } from '../store';
import type { Cable } from '../store';
import type { SimOutput } from '../sim/model';

const INK = G.INK;
const MS = 'Arial, "Segoe UI", sans-serif';

/** Hex rengi karart / aydınlat (k: -1..1) */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ================================================================
   soket (dübel) çizimi
   ================================================================ */

interface KnobProps { s: SocketDef; selected?: boolean; }

function Knob({ s, selected }: KnobProps) {
  const r = s.r ?? G.R_KNOB;
  return (
    <g className="term" onClick={(e) => { e.stopPropagation(); A.clickTerminal(s.id); }}>
      <circle cx={s.x} cy={s.y} r={r + 3.5} fill="transparent" />
      <circle cx={s.x} cy={s.y} r={r} fill={s.color} stroke="#100f12" strokeWidth={1.6} />
      <circle cx={s.x} cy={s.y} r={r * 0.6} fill="none" stroke="#0c0c10" strokeOpacity={0.6} strokeWidth={1.1} />
      <circle cx={s.x} cy={s.y} r={2.6} fill={selected ? '#6b5113' : '#101014'} />
      {selected && <circle cx={s.x} cy={s.y} r={r + 5} fill="none" stroke="#8a6d1f" strokeWidth={2.4} />}
      <title>{s.id}</title>
    </g>
  );
}

/** Soket etiketleri — yalnız uç bloğunda baskı vardır */
function SocketLabels() {
  const items: React.ReactNode[] = [];
  for (const s of G.TERMINALS) {
    if (!s.label && !s.glyph) continue;
    const y = s.y + (s.r ?? G.R_KNOB) + 15;
    if (s.glyph === 'lamp') {
      items.push(
        <g key={s.id}>
          <circle cx={s.x} cy={y - 3} r={6.5} fill="none" stroke={INK} strokeWidth={1.5} />
          <path d={`M ${s.x - 4.6} ${y - 7.6} L ${s.x + 4.6} ${y + 1.6} M ${s.x + 4.6} ${y - 7.6} L ${s.x - 4.6} ${y + 1.6}`} stroke={INK} strokeWidth={1.5} fill="none" />
        </g>,
      );
    } else {
      items.push(
        <text key={s.id} x={s.x} y={y} textAnchor="middle" fontFamily={MS} fontSize={13} fontWeight={700} fill={INK}>{s.label}</text>,
      );
    }
  }
  return <g pointerEvents="none">{items}</g>;
}

/* ================================================================
   baskı (print) yardımcıları — tepsi hat огезiası
   ================================================================ */

const PAD = 13;   // soketten baskı başlangıç payı
const DGAP = 12;  // açık kontak boşluğu

/** Açık (NO) kontak baskısı: ──╱─ */
function PrNo({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} L ${m - DGAP} ${y}`} />
      <path d={`M ${m - DGAP} ${y} L ${m + 2} ${y - 12} L ${m + 2} ${y + 1}`} />
      <path d={`M ${m + DGAP} ${y} L ${b - PAD} ${y}`} />
      <path d={`M ${m - DGAP} ${y} L ${m - DGAP} ${y - 11}`} />
    </g>
  );
}

/** Kapalı (NC) kontak baskısı: düz hat */
function PrNc({ a, b, y }: { a: number; b: number; y: number }) {
  return (
    <path d={`M ${a + PAD} ${y} L ${b - PAD} ${y}`} stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
  );
}

/** Termik normal kapı (tn): kapı + küçük köprü işareti */
function PrNcOpen({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} L ${m - 6} ${y}`} />
      <path d={`M ${m + 6} ${y} L ${b - PAD} ${y}`} />
      <path d={`M ${m - 6} ${y - 5} L ${m - 6} ${y + 5} M ${m + 6} ${y - 5} L ${m + 6} ${y + 5}`} />
    </g>
  );
}

/** Termik gecikmeli kapı (tc): kapı + t→ işareti */
function PrNcT({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g>
      <path d={`M ${a + PAD} ${y} L ${b - PAD} ${y}`} stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      <text x={m} y={y - 6} textAnchor="middle" fontFamily={MS} fontSize={11} fontWeight={700} fill={INK}>t→</text>
    </g>
  );
}

/** Bobin baskısı: kutu + armatür çaprazı */
function PrCoil({ a, b, y }: { a: number; b: number; y: number }) {
  const x1 = a + PAD, x2 = b - PAD;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${a + PAD} ${y} L ${x1} ${y}`} />
      <rect x={x1} y={y - 13} width={x2 - x1} height={26} fill="none" />
      <path d={`M ${x1} ${y + 8} L ${x2} ${y - 8}`} />
      <path d={`M ${x2} ${y} L ${b - PAD} ${y}`} />
    </g>
  );
}

/** yardımcı (aux) NO baskısı — kutu içinde */
function PrAux({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
      <rect x={m - 26} y={y - 11} width={52} height={22} fill="none" />
      <path d={`M ${m - 26} ${y} L ${m - 6} ${y}`} />
      <path d={`M ${m - 6} ${y} L ${m + 8} ${y - 9} L ${m + 8} ${y + 1}`} />
      <path d={`M ${m + 6} ${y} L ${m + 26} ${y}`} />
    </g>
  );
}

/** SPDT (kapalısız) baskısı: Λ biçimli com→nc/no dalları */
function PrSpdt({ nc, com, no, y }: { nc: number; com: number; no: number; y: number }) {
  return (
    <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
      <path d={`M ${com} ${y + 2} L ${com} ${y - 12}`} />
      <path d={`M ${com} ${y - 12} L ${nc + 8} ${y - 24} L ${nc + 10} ${y + 1}`} />
      <path d={`M ${com} ${y - 12} L ${no - 8} ${y - 24} L ${no - 10} ${y + 1}`} />
      <path d={`M ${nc - PAD} ${y} L ${nc - 4} ${y}`} />
      <path d={`M ${no + PAD} ${y} L ${no + 4} ${y}`} />
    </g>
  );
}

/** d2 zamanlanmış NO: ⊤ işaretli hat */
function PrTimed({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} L ${b - PAD} ${y}`} />
      <path d={`M ${m} ${y} L ${m} ${y - 13} M ${m - 5} ${y - 9} L ${m} ${y - 13} L ${m + 5} ${y - 9}`} />
    </g>
  );
}

/* ================================================================
   kablo katmanı — istiflenen yuvarlak kablolar
   ================================================================ */

function cablePath(aId: string, bId: string, ia: number, ib: number): string {
  const A0 = G.socketPos(aId), B0 = G.socketPos(bId);
  const dist = Math.hypot(B0.x - A0.x, B0.y - A0.y);
  const sag = Math.min(135, 24 + dist * 0.20) + Math.max(ia, ib) * 12;
  const cx = (A0.x + B0.x) / 2;
  const cy = Math.max(A0.y, B0.y) + sag;
  return `M ${A0.x} ${A0.y} Q ${cx} ${cy} ${B0.x} ${B0.y}`;
}

function Cables({ cables }: { cables: Cable[] }) {
  const counts = new Map<string, number>();
  const nodes: React.ReactNode[] = [];
  cables.forEach((w) => {
    const ia = counts.get(w.a) ?? 0; counts.set(w.a, ia + 1);
    const ib = counts.get(w.b) ?? 0; counts.set(w.b, ib + 1);
    const d = cablePath(w.a, w.b, ia, ib);
    nodes.push(
      <g key={w.id} className={'cable'}
        onClick={(e) => { e.stopPropagation(); A.clickCable(w.id); }}>
        <path d={d} stroke="transparent" strokeWidth={15} fill="none" />
        <path className="cLine" d={d} stroke={shade(w.color, -0.55)} strokeWidth={6.6} fill="none" strokeLinecap="round" />
        <path className="cCore" d={d} stroke={w.color} strokeWidth={4.4} fill="none" strokeLinecap="round" />
        <path className="cGlint" d={d} stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <title>Kabloyu silmek için tıkla — {w.color}</title>
      </g>,
    );
  });
  return <g className="cables">{nodes}</g>;
}

/* ================================================================
   üst bölge: acil stop, seçici, kesici yuvası, okul yazısı, lambalar
   ================================================================ */

function Emergency() {
  const p = G.EMERGENCY;
  return (
    <g>
      <rect x={p.plate.x} y={p.plate.y} width={p.plate.w} height={p.plate.h} rx={26} fill="#e7c93c" stroke="#8f7a17" strokeWidth={1.5} />
      <text x={p.dome.x} y={p.plate.y + 19} textAnchor="middle" fontFamily={MS} fontSize={13} fontWeight={800} fill={INK}>S</text>
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r} fill="#b9321f" stroke="#5e1508" strokeWidth={2} />
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r - 9} fill="#d24433" />
      <circle cx={p.dome.x - 8} cy={p.dome.y - 9} r={7} fill="#e2614f" opacity={0.85} />
      <text
        x={p.dome.x} y={p.plate.y + p.plate.h - 6} textAnchor="middle" fontFamily={MS}
        fontSize={11.5} fontWeight={800} fill={INK} transform={`rotate(-6 ${p.dome.x} ${p.plate.y + p.plate.h - 10})`}
      >EMERGENCY</text>
    </g>
  );
}

function Breakers() {
  const st = useStore();
  return (
    <g>
      <rect x={G.RECESS.x} y={G.RECESS.y} width={G.RECESS.w} height={G.RECESS.h} rx={5} fill="#17130f" stroke="#000" strokeWidth={1.5} />
      {/* F3 — motor kesicisi (3P) */}
      <rect x={117} y={G.RECESS.y + 8} width={66} height={G.RECESS.h - 16} rx={3} fill="#d8d7d3" stroke="#8b8a86" strokeWidth={1} />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('motor'); }}>
        {[129, 147, 165].map((x) => (
          <g key={x}>
            <rect x={x} y={222} width={11} height={11} rx={1.5} fill="#efefec" />
            <rect x={x} y={st.breakers.motor ? 226 : 251} width={11} height={26} rx={2} fill="#23232a" stroke="#000" strokeWidth={1} />
            <rect x={x} y={265} width={11} height={11} rx={1.5} fill="#c5c4bf" />
          </g>
        ))}
        <rect x={117} y={G.RECESS.y + 8} width={66} height={G.RECESS.h - 16} rx={3} fill="transparent" />
        <title>F3 — motor kesicisi (3P)</title>
      </g>
      {/* F1 — kumanda kesicisi (1P) */}
      <rect x={190} y={G.RECESS.y + 8} width={22} height={G.RECESS.h - 16} rx={3} fill="#e4e3df" stroke="#8b8a86" strokeWidth={1} />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('control'); }}>
        <rect x={195.5} y={222} width={11} height={11} rx={1.5} fill="#f6f6f3" />
        <rect x={195.5} y={st.breakers.control ? 226 : 251} width={11} height={26} rx={2} fill="#f9f9f6" stroke="#9a9a95" strokeWidth={1} />
        <rect x={195.5} y={265} width={11} height={11} rx={1.5} fill="#cfcfce" />
        <title>F1 — kumanda kesicisi (1P)</title>
      </g>
    </g>
  );
}

function Selector() {
  const p = G.SELECTOR;
  return (
    <g>
      <rect x={p.plate.x} y={p.plate.y} width={p.plate.w} height={p.plate.h} rx={9} fill="#3a3a40" stroke="#191a1e" strokeWidth={1.5} />
      <circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r} fill="#23252b" stroke="#111" strokeWidth={1.5} />
      <path d={`M ${p.knob.x} ${p.knob.y} L ${p.knob.x} ${p.knob.y - 16}`} stroke="#e8e8e8" strokeWidth={3} strokeLinecap="round" />
      <text x={p.knob.x} y={p.plate.y + 12} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#d8d8d8">0</text>
      <text x={p.knob.x} y={p.plate.y + p.plate.h - 2} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#d8d8d8">1</text>
    </g>
  );
}

function SchoolText() {
  return (
    <g fontFamily={MS} fontWeight={800} fill={INK}>
      <text x={G.SCHOOL.x} y={G.SCHOOL.y}>TOPHANE TEKNİK ve</text>
      <text x={G.SCHOOL.x} y={G.SCHOOL.y + G.SCHOOL.lineH}>ENDÜSTRİ MESLEK LİSESİ</text>
    </g>
  );
}

function Lamps({ sim }: { sim: SimOutput | null }) {
  return (
    <g>
      {G.LAMPS.map((l) => {
        const on = sim?.lamps[l.key] === true;
        return (
          <g key={l.key}>
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 2.5} fill="#9ba191" stroke="#3d4237" strokeWidth={1.4} />
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R} fill={on ? shade(l.color, 0.25) : shade(l.color, -0.35)} stroke="#2a2c26" strokeWidth={1} />
            {on && (
              <>
                <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R - 6} fill="rgba(255,255,255,0.55)" />
                <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 5} fill="none" stroke={l.color} strokeWidth={4} opacity={0.35} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ================================================================
   e (termik röle) gövdesi
   ================================================================ */

function EUnit({ sim }: { sim: SimOutput | null }) {
  const u = G.E_UNIT;
  const tripped = sim?.dev.termik.armed === false;
  return (
    <g>
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={7} fill="#b9bcc1" stroke="#5c5f64" strokeWidth={1.5} />
      <rect x={u.body.x + 4} y={u.face.y - 6} width={u.body.w - 8} height={(u.face.y - 6) - u.body.y} fill="#a3a6ab" />
      <rect x={u.face.x} y={u.face.y} width={u.face.w} height={u.face.h} rx={3} fill="#e9e9e6" stroke="#8f9296" strokeWidth={1.2} />
      <text x={u.face.x + 8} y={u.face.y + 16} fontFamily={MS} fontSize={9} fill="#6b6e72">3VA 250V~</text>
      {/* kırmızı sıfırlama düğmesi — attığında dışarı çıkar */}
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.termikArm(); }}>
        <circle cx={u.reset.x} cy={u.reset.y + (tripped ? -3 : 0)} r={u.reset.r} fill="#b9321f" stroke="#5e1508" strokeWidth={1.8} />
        <circle cx={u.reset.x - 2.5} cy={u.reset.y - 3 + (tripped ? -3 : 0)} r={2.5} fill="#e2614f" />
        <title>Termik sıfırla (e.tc kapatır)</title>
      </g>
      {/* mavi ayar düğmesi */}
      <circle cx={u.blueK.x} cy={u.blueK.y} r={u.blueK.r} fill="#2a5fa8" stroke="#173a66" strokeWidth={1.4} />
      <text x={u.body.x + 4} y={u.body.y + u.body.h - 8} fontFamily={MS} fontSize={10} fontWeight={700} fill="#3c3f44">1.6</text>
    </g>
  );
}

/** e tepsi baskıları + kutu */
function ETrayPrints() {
  const t = G.E_TRAY;
  return (
    <g>
      <rect x={t.box.x} y={t.box.y} width={t.box.w} height={t.box.h} fill="none" stroke={INK} strokeWidth={1.6} />
      {t.rows.map((row) => {
        const a = t.cols[0], b = t.cols[1], y = row.y;
        if (row.kind === 'ncOpen') return <PrNcOpen key={row.id} a={a} b={b} y={y} />;
        if (row.kind === 'ncT')    return <PrNcT key={row.id} a={a} b={b} y={y} />;
        return <PrNc key={row.id} a={a} b={b} y={y} />;
      })}
    </g>
  );
}

/* ================================================================
   d1 (takma röle) gövdesi + tepsi
   ================================================================ */

function D1Unit() {
  const u = G.D1_UNIT;
  return (
    <g>
      {/* gövde üstünden panel girişine kablolar */}
      <path d={`M ${u.cableStub.x - 12} 366 Q ${u.cableStub.x - 24} 400 ${u.body.x + 22} ${u.body.y + 4}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <path d={`M ${u.cableStub.x + 10} 366 Q ${u.cableStub.x + 16} 396 ${u.body.x + 48} ${u.body.y + 4}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <ellipse cx={u.cableStub.x - 12} cy={364} rx={7} ry={3} fill="#23231f" />
      <ellipse cx={u.cableStub.x + 10} cy={364} rx={7} ry={3} fill="#23231f" />
      {/* gövde */}
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={5} fill="#cdd0d4" stroke="#585b60" strokeWidth={1.5} />
      {/* kırmızı takma bloğu (üst sağ) */}
      <rect x={u.body.x + u.body.w - 32} y={u.body.y} width={32} height={27} rx={3} fill="#b9321f" stroke="#5e1508" strokeWidth={1.4} />
      <rect x={u.body.x + u.body.w - 24} y={u.body.y + 8} width={16} height={8} rx={2} fill="#d24433" />
      {/* beyaz ön yüz + soket deliği */}
      <rect x={u.body.x + 6} y={u.body.y + 30} width={u.body.w - 44} height={u.body.h - 38} rx={3} fill="#e9e9e6" stroke="#8f9296" strokeWidth={1.2} />
      <circle cx={u.body.x + 42} cy={u.body.y + 62} r={12} fill="#191a1d" stroke="#000" strokeWidth={1.5} />
      <text x={u.body.x + 14} y={u.body.y + 20} fontFamily={MS} fontSize={9} fontWeight={700} fill="#5c5f64">3UG4</text>
    </g>
  );
}

function D1TrayPrints() {
  const t = G.D1_TRAY;
  return (
    <g>
      <PrCoil a={t.coil.a.x} b={t.coil.b.x} y={(t.coil.a.y + t.coil.b.y) / 2} />
      <PrSpdt nc={t.spdt.nc.x} com={t.spdt.com.x} no={t.spdt.no.x} y={t.spdt.y} />
    </g>
  );
}

/* ================================================================
   d2 (zaman rölesi ZR) gövdesi + tepsi
   ================================================================ */

function D2Unit({ sim }: { sim: SimOutput | null }) {
  const u = G.D2_UNIT;
  const sec = sim ? (sim.dev.zr.elapsed / 1000) : 0;
  return (
    <g>
      <path d={`M ${u.cableStub.x - 10} ${u.cableStub.y - 16} Q ${u.cableStub.x - 20} ${u.cableStub.y + 12} ${u.body.x + 20} ${u.body.y + 6}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <ellipse cx={u.cableStub.x - 10} cy={u.cableStub.y - 18} rx={7} ry={3} fill="#23231f" />
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={5} fill="#d7d9dc" stroke="#585b60" strokeWidth={1.5} />
      {/* beyaz etiket + ekran */}
      <rect x={u.body.x + 10} y={u.body.y + 30} width={u.body.w - 20} height={110} rx={3} fill="#efefec" stroke="#9ea1a5" strokeWidth={1.2} />
      <rect x={u.lcd.x} y={u.lcd.y} width={u.lcd.w} height={u.lcd.h} rx={2} fill="#1d2b1f" stroke="#000" strokeWidth={1.2} />
      <text x={u.lcd.x + u.lcd.w / 2} y={u.lcd.y + 15} textAnchor="middle" fontFamily="'Consolas', monospace" fontSize={12} fill="#7fe08a">{sec.toFixed(1)}</text>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={u.lcd.x + 8 + i * 14} cy={u.lcd.y + u.lcd.h + 12} r={4.5} fill="#4b4e53" stroke="#2c2e31" strokeWidth={1} />
      ))}
      <text x={u.body.x + u.body.w - 14} y={u.body.y + 18} textAnchor="end" fontFamily={MS} fontSize={9} fontWeight={700} fill="#5c5f64">ZR</text>
    </g>
  );
}

function D2TrayPrints() {
  const t = G.D2_TRAY;
  return (
    <g>
      <PrTimed a={t.timed.a.x} b={t.timed.b.x} y={t.timed.a.y} />
      <PrCoil a={t.coil.a.x} b={t.coil.b.x} y={(t.coil.a.y + t.coil.b.y) / 2} />
      <g>
        <rect x={t.zrBox.x} y={t.zrBox.y} width={t.zrBox.w} height={t.zrBox.h} fill="none" stroke={INK} strokeWidth={1.4} />
        <text x={t.zrBox.x + t.zrBox.w / 2} y={t.zrBox.y + 14} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill={INK}>ZR</text>
      </g>
      {t.rows.map((row) => (
        <PrSpdt key={row.prefix} nc={t.rowX.nc} com={t.rowX.com} no={t.rowX.no} y={row.y} />
      ))}
    </g>
  );
}

/* ================================================================
   butonlar b1–b4
   ================================================================ */

function ButtonUnit({ b, pressed }: { b: G.ButtonDef; pressed: boolean }) {
  const fill = b.color === 'red' ? '#b9321f' : '#2f9e4f';
  const press = pressed;
  return (
    <g className={press ? 'btn pressed' : 'btn'}>
      {/* yuva çifti arası baskı + ortak köprü */}
      <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <path d={`M ${G.BTN_COL.red} ${b.y - G.BTN_COL.dy} L ${G.BTN_COL.red} ${b.y + G.BTN_COL.dy}`} />
        <path d={`M ${G.BTN_COL.red} ${b.y} L ${G.BTN_COL.black - 26} ${b.y}`} />
        <path d={`M ${G.BTN_COL.black - 26} ${b.y} L ${G.BTN_COL.black - 12} ${b.y - G.BTN_COL.dy + 4} L ${G.BTN_COL.black - 10} ${b.y - G.BTN_COL.dy + 3}`} />
        <path d={`M ${G.BTN_COL.black - 26} ${b.y} L ${G.BTN_COL.black - 12} ${b.y + G.BTN_COL.dy - 4} L ${G.BTN_COL.black - 10} ${b.y + G.BTN_COL.dy - 3}`} />
      </g>
      {/* düğme gövdesi */}
      <g className="bhit"
        onPointerDown={(e) => { e.stopPropagation(); A.pressButton(b.id as 'b1'); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sentetik olay */ } }}
        onPointerUp={(e) => { e.stopPropagation(); A.releaseButton(b.id as 'b1'); }}
        onPointerCancel={() => A.releaseButton(b.id as 'b1')}
        onClick={(e) => e.stopPropagation()}
      >
        <circle cx={b.x} cy={b.y} r={26} fill="#2c2620" stroke="#191512" strokeWidth={1.4} />
        <circle cx={b.x} cy={b.y} r={press ? 13 : 17} fill={fill} stroke="#1c0d08" strokeWidth={1.6} />
        <circle cx={b.x - 5} cy={b.y - 5} r={4.5} fill="rgba(255,255,255,0.35)" />
        <title>{b.id.toUpperCase()} — bas-tut</title>
      </g>
    </g>
  );
}

/* ================================================================
   kontaktörler c1–c4: tepsi + gövde
   ================================================================ */

function ContactorUnit({ k, on }: { k: G.ContactorDef; on: boolean }) {
  const f = k.front;
  const left = k.trayL, right = k.trayR;
  const screwsY = [818, 869];
  const screwsX = [f.x + 10, f.x + 27, f.x + 44, f.x + 61];
  return (
    <g>
      {/* x sıralarının büyük yardımcı kutu baskısı */}
      <rect x={left + 12} y={G.C_ROW_Y[5] - 20} width={right - left - 24} height={(G.C_ROW_Y[7] - G.C_ROW_Y[5]) + 40} fill="none" stroke={INK} strokeWidth={1.6} />
      {/* sıra baskıları */}
      <PrCoil a={left} b={right} y={G.C_ROW_Y[0]} />
      <PrNo a={left} b={right} y={G.C_ROW_Y[1]} />
      <PrNo a={left} b={right} y={G.C_ROW_Y[2]} />
      <PrNc a={left} b={right} y={G.C_ROW_Y[3]} />
      <PrNc a={left} b={right} y={G.C_ROW_Y[4]} />
      <PrAux a={left} b={right} y={G.C_ROW_Y[5]} />
      <PrAux a={left} b={right} y={G.C_ROW_Y[6]} />
      <PrAux a={left} b={right} y={G.C_ROW_Y[7]} />
      {/* tepsi→gövde bağlantı baskısı */}
      <path d={`M ${left + 4} ${G.C_ROW_Y[0] - 14} Q ${left + 30} ${G.C_ROW_Y[0] - 34} ${f.x + 30} ${f.y + f.h}`} stroke={INK} strokeWidth={1.5} fill="none" />
      <path d={`M ${right - 4} ${G.C_ROW_Y[0] - 14} Q ${right - 26} ${G.C_ROW_Y[0] - 34} ${f.x + 52} ${f.y + f.h}`} stroke={INK} strokeWidth={1.5} fill="none" />
      {/* kanca kablo (pabuç) */}
      <path d={`M ${f.x + 24} ${f.y + f.h - 3} Q ${f.x - 4} ${G.C_ROW_Y[0] + 6} ${left} ${G.C_ROW_Y[0]}`} stroke="#23231f" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* üst kablo girişleri */}
      {[f.x + 14, f.x + 38, f.x + 62].map((x) => (
        <path key={x} d={`M ${x - 2} ${f.y - 22} Q ${x + 4} ${f.y - 10} ${x} ${f.y}`} stroke="#1f1f21" strokeWidth={4.4} fill="none" strokeLinecap="round" />
      ))}
      {[f.x + 18, f.x + 40, f.x + 62].map((x) => (
        <ellipse key={x} cx={x} cy={f.y - 24} rx={7.5} ry={3} fill="#23231f" />
      ))}
      {/* gövde */}
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={6} fill="#2c2c30" stroke="#161618" strokeWidth={1.5} />
      <rect x={f.x + 3} y={f.y + 70} width={f.w - 6} height={f.h - 76} rx={3} fill="#e9e9ec" stroke="#87888d" strokeWidth={1.2} />
      {screwsY.map((sy) => screwsX.map((sx) => (
        <g key={`${sx}-${sy}`}>
          <circle cx={sx} cy={sy} r={3.2} fill="#a9aaae" stroke="#5e5f63" strokeWidth={1} />
          <path d={`M ${sx - 2.2} ${sy} L ${sx + 2.2} ${sy}`} stroke="#5e5f63" strokeWidth={0.9} />
        </g>
      )))}
      {/* siyah anahtar + plaka */}
      <rect x={f.x + 10} y={f.y + 70 + 26} width={11} height={17} rx={2} fill="#1d1d20" stroke="#000" strokeWidth={1} />
      <rect x={f.x + 17} y={f.y + 70 + 42} width={36} height={15} rx={2} fill="#fbfbf8" stroke="#a3a3a0" strokeWidth={0.9} />
      <text x={f.x + 35} y={f.y + 70 + 53} textAnchor="middle" fontFamily={MS} fontSize={8} fill="#54565a">{on ? 'IN' : '0'}</text>
      {/* etiket */}
      <text x={f.x + f.w + 16} y={f.y + f.h - 22} fontFamily={MS} fontSize={15} fontWeight={800} fill={INK}>{k.id.toUpperCase()}</text>
      <title>{k.id.toUpperCase()} — kontaktör</title>
    </g>
  );
}

/** Pano üzerindeki basılı cihaz etiketleri (b1..b4, e, d1, d2) */
function BoardLabels() {
  return (
    <g pointerEvents="none" fontFamily={MS} fontWeight={800} fill={INK}>
      {G.BUTTONS.map((b) => (
        <text key={b.id} x={84} y={b.y + 6} textAnchor="middle" fontSize={15}>{b.id}</text>
      ))}
      <text x={502} y={562} textAnchor="middle" fontSize={15}>e</text>
      <text x={G.D1_TRAY.label.x} y={G.D1_TRAY.label.y} textAnchor="middle" fontSize={15}>d1</text>
      <text x={G.D2_TRAY.label.x} y={G.D2_TRAY.label.y} textAnchor="middle" fontSize={15}>d2</text>
    </g>
  );
}

/* ================================================================
   motor
   ================================================================ */

function Motor({ running, dir }: { running: boolean; dir: 1 | 0 | -1 }) {
  const M = G.MOTOR;
  const b = M.body;
  return (
    <g>
      {/* mil */}
      <rect x={M.shaft.x} y={M.shaft.y} width={M.shaft.w} height={M.shaft.h} rx={3} fill="#4a4d52" stroke="#2b2d31" strokeWidth={1.2} />
      {/* dönen kaspnak görüntüsü */}
      <g className={running ? (dir === -1 ? 'spin running reverse' : 'spin running') : 'spin'}>
        <circle cx={M.pulley.x} cy={M.pulley.y} r={M.pulley.r} fill="#70747a" stroke="#3a3d42" strokeWidth={1.6} />
        <path d={`M ${M.pulley.x - M.pulley.r + 3} ${M.pulley.y} L ${M.pulley.x + M.pulley.r - 3} ${M.pulley.y}`} stroke="#3a3d42" strokeWidth={2.4} />
        <path d={`M ${M.pulley.x} ${M.pulley.y - M.pulley.r + 3} L ${M.pulley.x} ${M.pulley.y + M.pulley.r - 3}`} stroke="#3a3d42" strokeWidth={2.4} />
      </g>
      {/* gövde */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={`url(#motorSkin)`} stroke="#7c7f84" strokeWidth={1.6} />
      {/* sağ kapak gölgesi */}
      <rect x={b.x + b.w - 42} y={b.y + 4} width={38} height={b.h - 8} rx={8} fill="#a9adb2" stroke="#8d9095" strokeWidth={1} />
      <text x={M.label.x} y={M.label.y} textAnchor="middle" fontFamily={MS} fontSize={20} fontWeight={800} fill="#6d7075" letterSpacing={2}>SIEMENS</text>
      {/* klemens kutusu + çıkış kablosu */}
      <rect x={M.tBox.x} y={M.tBox.y} width={M.tBox.w} height={M.tBox.h} rx={4} fill="#b6b9be" stroke="#84878c" strokeWidth={1.4} />
      <path d={`M ${M.tBox.x} ${M.tBox.y + 26} L ${M.tBox.x + M.tBox.w} ${M.tBox.y + 26}`} stroke="#84878c" strokeWidth={1.2} />
      <path d={`M ${M.hole.x + 26} ${M.tBox.y + M.tBox.h} Q ${M.hole.x + 44} ${M.hole.y - 16} ${M.hole.x} ${M.hole.y}`} stroke="#23231f" strokeWidth={5.5} fill="none" strokeLinecap="round" />
      <ellipse cx={M.hole.x} cy={M.hole.y} rx={10} ry={4.5} fill="#23231f" />
    </g>
  );
}

/* ================================================================
   harici sinyal lambası (pano dışında)
   ================================================================ */

function ExtLamp({ sim }: { sim: SimOutput | null }) {
  const E = G.EXT_LAMP;
  const ext = sim?.ext;
  return (
    <g>
      <rect x={E.housing.x} y={E.housing.y} width={E.housing.w} height={E.housing.h} rx={10} fill="#23241f" stroke="#0f0f0d" strokeWidth={2} />
      <text x={E.housing.x + E.housing.w / 2} y={E.housing.y + 16} textAnchor="middle" fontFamily={MS} fontSize={10.5} fontWeight={800} fill="#d8d5c8">SİNYAL LAMBASI</text>
      {E.lenses.map((l, i) => {
        const key = i === 0 ? 'yellow' : i === 1 ? 'red' : 'green';
        const on = ext ? ext[key as 'red'] === true : false;
        return (
          <g key={l.color}>
            <circle cx={l.x} cy={E.lensY} r={E.lensR + 2} fill="#111" />
            <circle cx={l.x} cy={E.lensY} r={E.lensR} fill={on ? shade(l.color, 0.3) : shade(l.color, -0.5)} stroke="#000" strokeWidth={1.2} />
            {on && <circle cx={l.x} cy={E.lensY} r={E.lensR + 4.5} fill={l.color} opacity={0.28} />}
          </g>
        );
      })}
      <text x={E.housing.x + 8} y={E.housing.y + E.housing.h - 6} fontFamily={MS} fontSize={9} fill="#8d8a7d">fuş: Y · R · G + toprak</text>
    </g>
  );
}

/* ================================================================
   ANA PANO
   ================================================================ */

interface Vb { x: number; y: number; w: number; h: number; }
const VB0: Vb = { x: -20, y: -25, w: 1220, h: 1320 };

export function Board() {
  const st = useStore();
  const sim = st.sim;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<Vb>(VB0);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ on: boolean; moved: boolean; px: number; py: number; vb: Vb } | null>(null);

  /* tekerlek ile yakınlaştır */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ct = svg.getScreenCTM();
      if (!ct) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ct.inverse());
      setVb((v) => {
        const f = Math.exp(e.deltaY * 0.0012);
        const w = Math.min(2000, Math.max(480, v.w * f));
        const h = w * (v.h / v.w);
        return { x: p.x - (p.x - v.x) * (w / v.w), y: p.y - (p.y - v.y) * (h / v.h), w, h };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const toLocal = (e: React.PointerEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ct = svg.getScreenCTM();
    if (!ct) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ct.inverse());
    return { x: p.x, y: p.y };
  };

  return (
    <svg
      ref={svgRef}
      className={`boardSvg mode-${st.mode}`}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={(e) => {
        if (e.target !== svgRef.current) return;
        drag.current = { on: true, moved: false, px: e.clientX, py: e.clientY, vb };
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d?.on) {
          const k = e.currentTarget.viewBox.baseVal;
          const dx = ((e.clientX - d.px) / e.currentTarget.clientWidth) * k.width;
          const dy = ((e.clientY - d.py) / e.currentTarget.clientHeight) * k.height;
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
          if (d.moved) setVb({ x: d.vb.x - dx, y: d.vb.y - dy, w: d.vb.w, h: d.vb.h });
        }
        if (st.selTerminal) setDraft(toLocal(e));
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (d && !d.moved) A.cancelSel();
      }}
    >
      <defs>
        <radialGradient id="motorSkin" cx="50%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#cdd0d4" />
          <stop offset="55%" stopColor="#b2b5b9" />
          <stop offset="100%" stopColor="#8f9297" />
        </radialGradient>
        <radialGradient id="panelSkin" cx="50%" cy="22%" r="105%">
          <stop offset="0%" stopColor="#eadfae" />
          <stop offset="70%" stopColor="#e2d19b" />
          <stop offset="100%" stopColor="#d3c088" />
        </radialGradient>
      </defs>

      {/* arka plan (duvar) */}
      <rect x={-400} y={-300} width={2200} height={2000} fill="#e9e7e2" />

      {/* pano gölgesi + çerçeve + yüzey */}
      <rect x={G.FRAME.x + 6} y={G.FRAME.y + 10} width={G.FRAME.w} height={G.FRAME.h} rx={10} fill="rgba(0,0,0,0.18)" />
      <rect x={G.FRAME.x} y={G.FRAME.y} width={G.FRAME.w} height={G.FRAME.h} rx={10} fill={G.FRAME_COLOR} stroke="#0e0b08" strokeWidth={3} />
      <rect x={G.PANEL.x} y={G.PANEL.y} width={G.PANEL.w} height={G.PANEL.h} rx={4} fill="url(#panelSkin)" stroke={G.PANEL_EDGE} strokeWidth={2} />

      {/* üst bölge */}
      <Emergency />
      <Selector />
      <Breakers />
      <SchoolText />

      {/* cihaz gövdeleri (kabloların altında) */}
      <EUnit sim={sim} />
      <ETrayPrints />
      <D1Unit />
      <D1TrayPrints />
      <D2Unit sim={sim} />
      <D2TrayPrints />
      {G.BUTTONS.map((b) => <ButtonUnit key={b.id} b={b} pressed={st.pressed[b.id as 'b1']} />)}
      {G.CONTACTORS.map((k) => <ContactorUnit key={k.id} k={k} on={sim?.dev.contactors[k.id as 'c1'] === true} />)}

      {/* kablolar */}
      <Cables cables={st.cables} />

      {/* lambalar */}
      <Lamps sim={sim} />

      {/* soketler (kabloların ucunu örter) */}
      <g className="sockets">
        {G.TERMINALS.map((s) => <Knob key={s.id} s={s} selected={st.selTerminal === s.id} />)}
      </g>
      <SocketLabels />
      <BoardLabels />

      {/* motor en üstte */}
      <Motor running={sim?.motor.running === true} dir={sim?.motor.dir ?? 0} />

      {/* harici sinyal lambası */}
      <ExtLamp sim={sim} />

      {/* seçili soketten imlece kablo önizlemesi */}
      {st.selTerminal && draft && (
        <g pointerEvents="none">
          {(() => {
            const A0 = G.socketPos(st.selTerminal);
            const d = `M ${A0.x} ${A0.y} Q ${(A0.x + draft.x) / 2} ${Math.max(A0.y, draft.y) + 40} ${draft.x} ${draft.y}`;
            return <path d={d} stroke={st.cableColor} strokeWidth={4} strokeDasharray="9 7" fill="none" strokeLinecap="round" opacity={0.85} />;
          })()}
        </g>
      )}
    </svg>
  );
}
