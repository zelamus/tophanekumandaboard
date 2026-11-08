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
      {/* metal somun gölgesi */}
      <ellipse cx={s.x} cy={s.y + 1.8} rx={r + 1.2} ry={r - 0.4} fill="rgba(0,0,0,0.28)" />
      <circle cx={s.x} cy={s.y - 1} r={r + 1.8} fill="#8c8f93" />
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
      /* foto: ⊗ lamba işareti soketin sağ-alt komşuluğunda durur (altında değil) */
      items.push(
        <g key={s.id}>
          <circle cx={s.x + 16} cy={s.y + 14} r={6.5} fill="none" stroke={INK} strokeWidth={1.5} />
          <path d={`M ${s.x + 11.4} ${s.y + 9.4} L ${s.x + 20.6} ${s.y + 18.6} M ${s.x + 20.6} ${s.y + 9.4} L ${s.x + 11.4} ${s.y + 18.6}`} stroke={INK} strokeWidth={1.5} fill="none" />
        </g>,
      );
    } else {
      items.push(
        <text key={s.id} x={s.x} y={y} textAnchor="middle" fontFamily={MS} fontSize={16} fontWeight={700} fill={INK}>{s.label}</text>,
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

/** Açık (NO) kontak baskısı: ──╱─ (dağlama — düz hatlar) */
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

/** Kapalı (NC) kontak baskısı: düz yatay hat */
function PrNc({ a, b, y }: { a: number; b: number; y: number }) {
  return (
    <path d={`M ${a + PAD} ${y} L ${b - PAD} ${y}`} stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
  );
}

/** Termik normal kapı (tn): kapı + küçük köprü işareti — düz */
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

/** Termik gecikmeli kapı (tc): gecikme işareti tepsinin üstünde ayrı çizilir — düz */
function PrNcT({ a, b, y }: { a: number; b: number; y: number }) {
  return (
    <path d={`M ${a + PAD} ${y} L ${b - PAD} ${y}`} stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
  );
}

/** Termik köprü (sarı e satırları): dik zigzag termik çentiği ortada (foto R4) */
function PrNotch({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <path
      d={`M ${a + PAD} ${y} L ${m - 7} ${y} L ${m - 3.5} ${y - 5} L ${m - 0.5} ${y + 5} L ${m + 2.5} ${y - 5} L ${m + 3.5} ${y + 0.5} L ${m + 7} ${y} L ${b - PAD} ${y}`}
      stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
  );
}

/** Bobin baskısı: foto R4 — DIK dikdörtgen (~24×50) içinde X; d2'de "ZR" etiketi X'in yerini alır */
function PrCoil({ a, b, y, label, showX = true }: { a: number; b: number; y: number; label?: string; showX?: boolean }) {
  const m = Math.round((a + b) / 2);
  const w = 24, h = 50;
  const x = m - w / 2, top = y - h / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${a + PAD} ${y} L ${x} ${y}`} />
      <rect x={x} y={top} width={w} height={h} fill="none" />
      {showX && <path d={`M ${x + 4} ${top + 8} L ${x + w - 4} ${top + h - 8} M ${x + w - 4} ${top + 8} L ${x + 4} ${top + h - 8}`} />}
      {label && <text x={m} y={y + 3.5} textAnchor="middle" fontFamily={MS} fontSize={11} fontWeight={700} fill={INK} stroke="none">{label}</text>}
      <path d={`M ${x + w} ${y} L ${b - PAD} ${y}`} />
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

/** atlama köprüsü (d2 alt sıra): dağlama — köşeli kırılım, eğri YOK */
function PrWave({ nc, com, no, y }: { nc: number; com: number; no: number; y: number }) {
  const a = nc, m = com, b = no;
  return (
    <path
      d={`M ${a} ${y} L ${m - 13} ${y} L ${m} ${y + 11} L ${m + 13} ${y} L ${b} ${y}`}
      stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="miter"
    />
  );
}

/** d2 zamanlanmış NO: ⊤ işaretli hat — düz */
function PrTimed({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} L ${b - PAD} ${y}`} />
      <path d={`M ${m} ${y} L ${m} ${y - 13} M ${m - 6} ${y - 13} L ${m + 6} ${y - 13}`} />
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
  const cx = p.plate.x + p.plate.w / 2;
  const cy = p.plate.y + p.plate.h / 2;
  const r = p.plate.w / 2;
  return (
    <g>
      {/* foto: hardal-mustard TEK plaka + ince koyu dış çember (çift sarı YOK) */}
      <circle cx={cx} cy={cy} r={r} fill="url(#emPlate)" stroke="#6e6212" strokeWidth={1.6} />
      {/* kırmızı dome — plaka merkezi; üst-solda focal highlight */}
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r} fill="#8f2b2c" stroke="#4b1207" strokeWidth={2} />
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r - 6} fill="#a03d42" />
      <circle cx={p.dome.x - 9} cy={p.dome.y - 10} r={7.5} fill="#e2614f" opacity={0.85} />
      {/* foto: EMERGENCY sol-ALT yayda, plaka kenarına taşmaz */}
      <defs>
        <path id="emArc" d={`M ${cx - 44} ${cy + 12} Q ${cx - 2} ${cy + 46} ${cx + 42} ${cy + 22}`} />
      </defs>
      <text fontFamily={MS} fontSize={13} fontWeight={800} fill="#241d10" letterSpacing={1.1}>
        <textPath href="#emArc" startOffset="50%" textAnchor="middle">EMERGENCY</textPath>
      </text>
    </g>
  );
}

function Breakers() {
  const st = useStore();
  const R = G.RECESS;
  return (
    <g>
      {/* foto: açık muhafaza içinde KOYU iç kavite */}
      <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={5} fill="#efeeea" stroke="#8f9296" strokeWidth={1.2} />
      {/* foto: muhafazanın iki yanında panel vidaları */}
      <circle cx={R.x + 4} cy={R.y + R.h / 2} r={2.4} fill="#c9cbce" stroke="#7d8085" strokeWidth={0.8} />
      <circle cx={R.x + R.w - 4} cy={R.y + R.h / 2} r={2.4} fill="#c9cbce" stroke="#7d8085" strokeWidth={0.8} />
      {/* ust.md: İÇ KAVİTE KOYU */}
      <rect x={R.x + 5} y={R.y + 4} width={R.w - 10} height={R.h - 8} rx={3} fill="#33342e" stroke="#23241f" strokeWidth={0.8} />
      {/* F3 — motor kesicisi (3P): 3 siyah kol, açık gövde */}
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('motor'); }}>
        {[118, 129, 140].map((x) => (
          <g key={x}>
            <rect x={x} y={218} width={10} height={7} rx={1} fill="#efefec" />
            <rect x={x - 1} y={222} width={12} height={22} rx={1.5} fill="#33363a" stroke="#0c0c0e" strokeWidth={0.8} />
            <rect x={x} y={st.breakers.motor ? 224 : 238} width={10} height={17} rx={2} fill="#e6e6e2" stroke="#9a9c9f" strokeWidth={0.7} />
            <rect x={x - 1} y={251} width={10} height={7} rx={1} fill="#c5c4bf" />
          </g>
        ))}
        <rect x={114} y={214} width={48} height={52} rx={2} fill="transparent" />
        <title>F3 — motor kesicisi (3P)</title>
      </g>
      {/* F1 — kumanda kesicisi (1P); F3 ile arasında boşluk */}
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('control'); }}>
        <rect x={172} y={218} width={10} height={7} rx={1} fill="#efefec" />
        <rect x={171} y={222} width={12} height={22} rx={1.5} fill="#33363a" stroke="#0c0c0e" strokeWidth={0.8} />
        <rect x={172} y={st.breakers.control ? 224 : 238} width={10} height={17} rx={2} fill="#e6e6e2" stroke="#9a9c9f" strokeWidth={0.7} />
        <rect x={171} y={251} width={10} height={7} rx={1} fill="#c5c4bf" />
        <rect x={168} y={214} width={22} height={52} rx={2} fill="transparent" />
        <title>F1 — kumanda kesicisi (1P)</title>
      </g>
    </g>
  );
}

function Selector() {
  const p = G.SELECTOR;
  return (
    <g>
      {/* foto: plaka yüzü soluk MAVİ-GRİ metal */}
      <rect x={p.plate.x} y={p.plate.y} width={p.plate.w} height={p.plate.h} rx={8} fill="url(#selPlate)" stroke="#5d5f63" strokeWidth={1.5} />
      {/* foto y≈113: koyu işlenmiş slit bandı */}
      <rect x={p.plate.x + 7} y={112} width={p.plate.w - 14} height={7} rx={2} fill="#3c3e42" opacity={0.75} />
      <text x={p.plate.x + p.plate.w - 11} y={124} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#23262c">0</text>
      <text x={p.plate.x + p.plate.w - 8} y={172} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#23262c">1</text>
      {/* göbek + dolgun kol SOL-AŞAĞI */}
      <circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r} fill="#23252b" stroke="#101114" strokeWidth={1.5} />
      <path d={`M ${p.knob.x} ${p.knob.y} L ${p.knob.x - 13} ${p.knob.y + 19}`} stroke="#17171b" strokeWidth={9} strokeLinecap="round" />
      <text x={p.plate.x + 6} y={p.plate.y + p.plate.h - 6} fontFamily={MS} fontSize={6.5} fontWeight={700} fill="#70747a">SIEMENS</text>
      {/* plaka altındaki silik kazıma baskı */}
      <g stroke={INK} strokeWidth={1} fill="none" opacity={0.16} strokeLinecap="round">
        <path d={`M ${p.plate.x + 5} ${p.plate.y + p.plate.h + 12} q 5 -4 10 0 t 10 0 t 10 0`} />
        <path d={`M ${p.plate.x + 12} ${p.plate.y + p.plate.h + 18} h 22`} />
      </g>
    </g>
  );
}

function SchoolText() {
  return (
    /* adj8: damgalı stencil — mono, ORTA hizalı (ink x136..292 merkezi ~214), satır baselines y331/350.5 */
    <g fontFamily="Consolas, monospace" fontSize={19} fontWeight={900} letterSpacing={0.5} fill={INK} textAnchor="middle">
      <text x={G.SCHOOL.cx} y={G.SCHOOL.y}>TOPHANE TEKNİK ve</text>
      <text x={G.SCHOOL.cx} y={G.SCHOOL.y + G.SCHOOL.lineH}>ENDÜSTRİ MESLEK LİSESİ</text>
      {/* okul yazısının altındaki silik kurşun kalem imza (foto, sol taraf altı) */}
      <g textAnchor="start">
        <path d="M 138 372 c 5 -9 11 -9 15 -2 c 3 6 8 5 12 -2 c 4 -6 8 -2 9 3 q 6 4 14 2" stroke="#6e6a5e" strokeWidth={1.2} fill="none" opacity={0.22} />
      </g>
    </g>
  );
}

function Lamps({ sim }: { sim: SimOutput | null }) {
  return (
    <g>
      {/* adj7: koyu KIZIL-KAHVE bezel ikili — gümüş çember YOK, arada bej panel görünür */}
      {G.LAMPS.map((l) => {
        const on = sim?.lamps[l.key] === true;
        return (
          <g key={l.key}>
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 3.4} fill="#472b24" stroke="#2c170f" strokeWidth={1.2} />
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 1.2} fill="none" stroke="rgba(230,220,200,0.28)" strokeWidth={1} />
            {/* OFF hali: lens RENKLERİ doygun (GetPixel #A82C37 vb.) — koyulaştırma yok */}
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R} fill={on ? shade(l.color, 0.3) : l.color} stroke="rgba(0,0,0,0.55)" strokeWidth={1} />
            {!on && <ellipse cx={l.x - 5} cy={G.LAMP_Y - 6} rx={7} ry={4} fill="rgba(255,255,255,0.10)" />}
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
  const bx = u.body.x, by = u.body.y, bw = u.body.w, bh = u.body.h;
  return (
    <g>
      {/* foto: üç üst terminal pimi (koyu) — tel çifti bunlardan yukarı kıvrılır */}
      {[bx + 16, bx + 38, bx + 60].map((x, i) => (
        <g key={`tp${i}`}>
          <circle cx={x} cy={by + 13} r={6} fill="#17171a" stroke="#000" strokeWidth={1} />
          <circle cx={x - 2} cy={by + 11} r={1.8} fill="#5f6469" opacity={0.7} />
        </g>
      ))}
      {/* koyu DIN gövde (foto ~#232327) */}
      <rect x={bx} y={by} width={bw} height={bh} rx={4} fill="#232327" stroke="#0f0f12" strokeWidth={1.5} />
      {/* üst terminal bandı */}
      <rect x={bx + 3} y={by + 3} width={bw - 6} height={26} rx={2} fill="#1c1c20" stroke="#0c0c0e" strokeWidth={0.8} />
      {/* ayar kadranı: foto — YÜZÜN SOLUNDA koyu halka + kırmızı iğne (id korunur) */}
      <g id="termik-kadran">
        <circle cx={u.topDial.x} cy={u.topDial.y} r={u.topDial.r} fill="#33353a" stroke="#101114" strokeWidth={2} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a}
            x1={u.topDial.x + Math.cos((a * Math.PI) / 180) * (u.topDial.r - 2.5)}
            y1={u.topDial.y + Math.sin((a * Math.PI) / 180) * (u.topDial.r - 2.5)}
            x2={u.topDial.x + Math.cos((a * Math.PI) / 180) * (u.topDial.r - 5.5)}
            y2={u.topDial.y + Math.sin((a * Math.PI) / 180) * (u.topDial.r - 5.5)}
            stroke="#c8ccd2" strokeWidth={1} opacity={0.75} />
        ))}
        <line x1={u.topDial.x} y1={u.topDial.y} x2={u.topDial.x + 4} y2={u.topDial.y - 7} stroke="#b9321f" strokeWidth={2} strokeLinecap="round" />
        <circle cx={u.topDial.x} cy={u.topDial.y} r={2} fill="#17181b" />
      </g>
      {/* soluk MAVİ-GRİ etiket yüzü */}
      <rect x={u.face.x} y={u.face.y} width={u.face.w} height={u.face.h} rx={2.5} fill="#c3cfdd" stroke="#9aa6b4" strokeWidth={1} />
      <text x={u.face.x + u.face.w / 2} y={u.face.y + 10} textAnchor="middle" fontFamily={MS} fontSize={6.5} fontWeight={700} fill="#5c6572">SIEMENS</text>
      {/* kırmızı reset + üstündeki koyu yuva (foto) */}
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.termikArm(); }}>
        <rect x={u.reset.x - 4} y={u.face.y + 11} width={9} height={10} rx={1.5} fill="rgba(16,20,28,0.85)" />
        <circle cx={u.reset.x} cy={u.reset.y + (tripped ? -2.5 : 0)} r={u.reset.r} fill="#a8333b" stroke="#4e1310" strokeWidth={1.4} />
        <circle cx={u.reset.x - 1.6} cy={u.reset.y - 1.8 + (tripped ? -2.5 : 0)} r={1.7} fill="#e2614f" />
        <title>Termik sıfırla (e.tc kapatır)</title>
      </g>
      {/* koyu MAVİ düğme + üstündeki yuva */}
      <rect x={u.blueK.x - 4.5} y={u.face.y + 11} width={9} height={10} rx={1.5} fill="rgba(10,16,26,0.85)" />
      <circle cx={u.blueK.x} cy={u.blueK.y} r={u.blueK.r} fill="#2d5b99" stroke="#11294e" strokeWidth={1.3} />
      {/* alt terminal bandı + 3 pim */}
      <rect x={bx + 3} y={by + 82} width={bw - 6} height={44} rx={2} fill="#1a1a1d" stroke="#0c0c0e" strokeWidth={0.8} />
      {[bx + 16, bx + 38, bx + 60].map((x, i) => (
        <g key={`bt${i}`}>
          <circle cx={x} cy={by + 106} r={6.2} fill="#141417" stroke="#000" strokeWidth={1} />
          <circle cx={x - 2} cy={by + 104} r={1.8} fill="#565b60" opacity={0.7} />
        </g>
      ))}
    </g>
  );
}

/** e tepsi baskıları + kutu */
function ETrayPrints() {
  const t = G.E_TRAY;
  return (
    <g>
      <rect x={t.box.x} y={t.box.y} width={t.box.w} height={t.box.h} fill="none" stroke={INK} strokeWidth={1.6} />
      {/* foto: siyah/kırmızı satırlar ARASINDA solda dikey ayırıcı (bıçak ağzı) + altında t~Z işareti */}
      <path d={`M 356 551 L 356 583`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <text x={404} y={579} textAnchor="middle" fontFamily={MS} fontSize={11} fontWeight={700} fill={INK}>t~Z</text>
      {/* kenardaki silik kalem yazısı — gerçek kartta "Rm şah" */}
      <text x={t.box.x + t.box.w + 12} y={t.box.y + 74} fontFamily={MS} fontSize={13} fontStyle="italic" fontWeight={600} fill="#6b6350" opacity={0.4}>Rm şah</text>
      {t.rows.map((row) => {
        const a = t.cols[0], b = t.cols[1], y = row.y;
        if (row.kind === 'ncOpen') return <PrNcOpen key={row.id} a={a} b={b} y={y} />;
        if (row.kind === 'ncT')    return <PrNcT key={row.id} a={a} b={b} y={y} />;
        if (row.kind === 'bridge') return <PrNotch key={row.id} a={a} b={b} y={y} />;
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
  const bx = u.body.x, by = u.body.y, bw = u.body.w, bh = u.body.h;
  return (
    <g>
      {/* İKİ siyah tel gümüşü kaldırıldı — cihaz kablosu yok */}
      {/* beyaz kısa-dolgun gövde (596..654 × 364..508) */}
      <rect x={bx} y={by} width={bw} height={bh} rx={5} fill="#f4f5f2" stroke="#8f9296" strokeWidth={1.5} />
      {/* sol DIN kıskaçı */}
      <path d={`M ${bx - 3} ${by + 26} L ${bx - 3} ${by + 52}`} stroke="#a3a8ad" strokeWidth={5} strokeLinecap="round" />
      {/* yüz: 3 koyu mini terminal (üst) */}
      {[bx + 20, bx + 34, bx + 48].map((x, i) => (
        <circle key={`t${i}`} cx={x} cy={by + 16} r={5} fill="#1d2634" stroke="#0c1420" strokeWidth={1} />
      ))}
      {/* ön yüz beyaz + sağ kenara soluk MAVİ-GRİ silke */}
      <rect x={bx + 3} y={by + 28} width={bw - 6} height={bh - 44} rx={3} fill="#eef0f4" stroke="#d8dad6" strokeWidth={1} />
      <rect x={bx + bw - 20} y={by + 30} width={17} height={bh - 48} rx={2} fill="rgba(120,140,170,0.25)" />
      <text x={bx + 5} y={by + 38} fontFamily={MS} fontSize={8} fontWeight={700} fill="#5c5f64">3UG4</text>
      <text x={bx + 5} y={by + 48} fontFamily={MS} fontSize={7} fontWeight={700} fill="#8a8e93">SIEMENS</text>
      {/* siyah göbek / döndürme başı — foto merkez-sol (~616,429) */}
      <circle cx={bx + 20} cy={by + 65} r={9} fill="#1a1b1f" stroke="#000" strokeWidth={1.4} />
      {/* teal-mavi seçim bandı (foto #6591AC..#779AB6, y≈455..495) */}
      <rect x={bx + 4} y={by + 91} width={bw - 8} height={40} rx={2} fill="#6b96ae" fillOpacity={0.96} stroke="#4f7d97" strokeWidth={0.8} />
      <path d={`M ${bx + 12} ${by + 99} q 14 5 34 0 M ${bx + 12} ${by + 121} q 14 5 34 0`} stroke="#9fc2d8" strokeWidth={1.1} fill="none" opacity={0.25} />
      {/* alt siyah terminal bloğu */}
      <rect x={bx + 6} y={by + bh - 13} width={bw - 12} height={11} rx={2} fill="#222226" stroke="#0c0c0e" strokeWidth={1} />
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
   küçük 7-segment kronometre ekranı (d2)
   ================================================================ */

const SEGMAP: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'f', 'g'],
};

/** Tek rakam: 7 segment bar — sığın dolduran dikdörtgenler */
function SegDigit({ ch, ox, oy, s }: { ch: string; ox: number; oy: number; s: number }) {
  const seg = SEGMAP[ch] ?? [];
  const w = s * 0.62, h = s, t = s * 0.185;
  const bars: Array<[string, number, number, number, number]> = [
    ['a', ox + t / 2, oy, w - t, t],
    ['f', ox, oy + t / 2, t, h / 2 - t * 0.85],
    ['b', ox + w - t, oy + t / 2, t, h / 2 - t * 0.85],
    ['g', ox + t / 2, oy + h / 2 - t / 2, w - t, t],
    ['e', ox, oy + h / 2 + t * 0.35, t, h / 2 - t * 0.85],
    ['c', ox + w - t, oy + h / 2 + t * 0.35, t, h / 2 - t * 0.85],
    ['d', ox + t / 2, oy + h - t, w - t, t],
  ];
  return (
    <g>
      {bars.map(([k, x, y, bw, bh]) => (
        <rect key={k} x={x + 3} y={y} width={bw} height={bh} fill={seg.includes(k) ? '#ff5040' : 'rgba(255,80,64,0.08)'} stroke="none" />
      ))}
    </g>
  );
}

function SegDisplay({ x, y, h, value }: { x: number; y: number; h: number; value: string }) {
  const s = h * 0.86;
  const digitW = s * 0.62 + 1.5;
  let cx = x;
  const nodes: React.ReactNode[] = [];
  for (const ch of value) {
    if (ch === '.') {
      nodes.push(<circle key={`dot-${cx}`} cx={cx + 2.5} cy={y + h - 2.5} r={1.5} fill="#ff5040" />);
      cx += 4.5;
    } else {
      nodes.push(<SegDigit key={`d-${cx}`} ch={ch} ox={cx} oy={y} s={s} />);
      cx += digitW;
    }
  }
  return <g>{nodes}</g>;
}

/* ================================================================
   d2 (zaman rölesi ZR) gövdesi + tepsi
   ================================================================ */

function D2Unit({ sim }: { sim: SimOutput | null }) {
  const u = G.D2_UNIT;
  const sec = sim ? (sim.dev.zr.elapsed / 1000) : 0;
  return (
    <g>
      {/* gövde sol-üstündeki kablo stipü kaldırıldı — cihaz kablosu yok */}
      {/* üst gri terminal kapağı (gövdeden geniş) */}
      <rect x={u.capT.x} y={u.capT.y} width={u.capT.w} height={u.capT.h} rx={3} fill="#8e9396" stroke="#6f7478" strokeWidth={1.2} />
      {[815, 827, 839, 851].map((x, i) => (
        <circle key={`t${i}`} cx={x} cy={u.capT.y + 6} r={2.2} fill="#5a5e62" />
      ))}
      {/* dar kolon: soluk MAVİ face */}
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={4} fill="url(#d2Face)" stroke="#5f6a80" strokeWidth={1.4} />
      {/* LCD — koyu bezel (#101D25); KIRMIZI segmentler foto'da GÖRÜNÜR */}
      <rect x={u.lcd.x - 3} y={u.lcd.y - 3} width={u.lcd.w + 6} height={u.lcd.h + 6} rx={3} fill="#101d25" stroke="#060c12" strokeWidth={1} />
      <rect x={u.lcd.x} y={u.lcd.y} width={u.lcd.w} height={u.lcd.h} rx={2} fill="#22303c" />
      <SegDisplay x={u.lcd.x + 4} y={u.lcd.y + 3} h={u.lcd.h - 6} value={sec.toFixed(1)} />
      {/* ZR mini etiketi sağ-üst */}
      <text x={u.body.x + u.body.w - 3} y={u.body.y + 13} textAnchor="end" fontFamily={MS} fontSize={6.5} fontWeight={700} fill="#46506a">ZR</text>
      {/* keypad: 4 koyu yuvarlak tuş (r≈3, lokal y≈496) */}
      {[818, 827, 836, 845].map((x, i) => (
        <circle key={`b${i}`} cx={x} cy={u.btnY} r={3.2} fill="#15151a" stroke="#000" strokeWidth={0.8} />
      ))}
      {/* alt koyu terminal bandı (gövdeden sola taşkın, foto ~x795..843) */}
      <rect x={u.bandB.x} y={u.bandB.y} width={u.bandB.w} height={u.bandB.h} rx={2} fill="#262624" stroke="#141412" strokeWidth={1} />
      {[806, 817, 828, 839].map((x, i) => (
        <circle key={`bt${i}`} cx={x} cy={u.bandB.y + 6.5} r={2.2} fill="#4c4c48" />
      ))}
    </g>
  );
}

function D2TrayPrints() {
  const t = G.D2_TRAY;
  return (
    <g>
      <PrTimed a={t.timed.a.x} b={t.timed.b.x} y={t.timed.a.y} />
      {/* foto: dik bobin dikdörtgeni İÇİNDE "ZR" */}
      <PrCoil a={t.coil.a.x} b={t.coil.b.x} y={(t.coil.a.y + t.coil.b.y) / 2} label="ZR" showX={false} />
      {/* foto: iki köprüden biri DÜZ (paysız hat), biri dalgalı */}
      <path d={`M ${t.rowX.nc} ${t.rows[0].y} L ${t.rowX.no} ${t.rows[0].y}`} stroke={INK} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <PrWave nc={t.rowX.nc} com={t.rowX.com} no={t.rowX.no} y={t.rows[1].y} />
    </g>
  );
}

/* ================================================================
   butonlar b1–b4
   ================================================================ */

function ButtonUnit({ b, pressed }: { b: G.ButtonDef; pressed: boolean }) {
  const press = pressed;
  return (
    <g className={press ? 'btn pressed' : 'btn'}>
      {/* yuva çifti arası baskı + ortak köprü — dağlama, DÜZ hatlar */}
      <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="miter">
        <path d={`M ${G.BTN_COL.red} ${b.y - G.BTN_COL.dy} L ${G.BTN_COL.red} ${b.y + G.BTN_COL.dy}`} />
        <path d={`M ${G.BTN_COL.red} ${b.y} L ${G.BTN_COL.black - 26} ${b.y}`} />
        <path d={`M ${G.BTN_COL.black - 26} ${b.y} L ${G.BTN_COL.black - 12} ${b.y - G.BTN_COL.dy + 4} L ${G.BTN_COL.black - 10} ${b.y - G.BTN_COL.dy + 3}`} />
        <path d={`M ${G.BTN_COL.black - 26} ${b.y} L ${G.BTN_COL.black - 12} ${b.y + G.BTN_COL.dy - 4} L ${G.BTN_COL.black - 10} ${b.y + G.BTN_COL.dy - 3}`} />
      </g>
      {/* düğme gövdesi: etek + açık metal rim + KOYU DİŞLİ yaka + cap gradient (bas-r13/boş-r17) */}
      <g className="bhit"
        onPointerDown={(e) => { e.stopPropagation(); A.pressButton(b.id as 'b1'); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sentetik olay */ } }}
        onPointerUp={(e) => { e.stopPropagation(); A.releaseButton(b.id as 'b1'); }}
        onPointerCancel={() => A.releaseButton(b.id as 'b1')}
        onClick={(e) => e.stopPropagation()}
      >
        <circle cx={b.x} cy={b.y} r={26} fill="#2c2620" stroke="#191512" strokeWidth={1.4} />
        <circle cx={b.x} cy={b.y} r={22.6} fill="none" stroke="rgba(196,198,190,0.55)" strokeWidth={1.1} />
        <circle cx={b.x} cy={b.y} r={21.7} fill="#17120e" />
        <circle cx={b.x} cy={b.y} r={20.4} fill="none" stroke="#0e0a07" strokeWidth={3.4} strokeDasharray="2.2 2.1" />
        <circle cx={b.x} cy={b.y} r={press ? 13 : 17} fill={`url(#cap-${b.id})`} stroke="#140a06" strokeWidth={1.4} />
        {/* cap dome gloss (sol-üst) */}
        <path d={`M ${b.x - 9} ${b.y - 5} Q ${b.x - 2} ${b.y - 12} ${b.x + 6} ${b.y - 8}`} stroke="rgba(255,255,255,0.30)" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <title>{b.id.toUpperCase()} — bas-tut</title>
      </g>
    </g>
  );
}

/* ================================================================
   kontaktörler c1–c4: tepsi + gövde
   ================================================================ */

/** dekoratif soket — gerçek kart düzenini tamamlar; sim ucu DEĞİL (tıklanmaz, kabloya girmez) */
function FakeKnob({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g pointerEvents="none">
      <ellipse cx={x} cy={y + 1.6} rx={10.4} ry={7.6} fill="rgba(0,0,0,0.28)" />
      <circle cx={x} cy={y - 1} r={9.6} fill="#8c8f93" />
      <circle cx={x} cy={y} r={8} fill={color} stroke="#100f12" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={5} fill="none" stroke="#0c0c10" strokeOpacity={0.6} strokeWidth={1} />
      <circle cx={x} cy={y} r={2.2} fill="#101014" />
    </g>
  );
}

function ContactorUnit({ k, on }: { k: G.ContactorDef; on: boolean }) {
  const f = k.front;
  const left = k.trayL, right = k.trayR;
  const m = Math.round((left + right) / 2);
  const bandY = f.y + 55; // koyu terminal bandı üstü (gövde İÇİNDE rel +55)
  return (
    <g>
      {/* x sıralarının büyük yardımcı kutu baskısı — kilit (c1 foto-ink: 168..257 × 1047..1152) — DÜZ */}
      <rect x={left + 12} y={G.C_ROW_Y[5] - 20} width={right - left - 36} height={(G.C_ROW_Y[7] - G.C_ROW_Y[5]) + 28} fill="none" stroke={INK} strokeWidth={1.6} />
      {/* sıra baskıları (dağlama — düz) */}
      <PrCoil a={left} b={right} y={G.C_ROW_Y[0]} />
      <PrNo a={left} b={right} y={G.C_ROW_Y[1]} />
      <PrNo a={left} b={right} y={G.C_ROW_Y[2]} />
      <PrNc a={left} b={right} y={G.C_ROW_Y[3]} />
      <PrNc a={left} b={right} y={G.C_ROW_Y[4]} />
      <PrAux a={left} b={right} y={G.C_ROW_Y[5]} />
      <PrAux a={left} b={right} y={G.C_ROW_Y[6]} />
      <PrAux a={left} b={right} y={G.C_ROW_Y[7]} />
      {/* tepsi→gövde bağlantı baskısı — keskin DÜZ kanca */}
      <path d={`M ${left + 6} ${G.C_ROW_Y[0] - 16} L ${f.x + 24} ${f.y + f.h}`} stroke={INK} strokeWidth={1.5} fill="none" strokeLinejoin="miter" />
      <path d={`M ${right - 6} ${G.C_ROW_Y[0] - 16} L ${f.x + 66} ${f.y + f.h}`} stroke={INK} strokeWidth={1.5} fill="none" strokeLinejoin="miter" />
      {/* gövde — KOYU taban (94×155, y737) */}
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={4} fill="url(#darkBody)" stroke="#23221f" strokeWidth={1.5} />
      {/* tel dome/gri teller kaldırıldı — cihaz kablosu yok; üst gövde düz koyu kalır */}
      {/* koyu terminal bandı (66×13, rel +55..+68) + bandın üstünde 3 pabuç elips */}
      <rect x={f.x + 4} y={bandY} width={66} height={13} rx={1.5} fill="#191917" stroke="#0c0c0a" strokeWidth={0.8} />
      {[14, 32, 50].map((o) => (
        <ellipse key={o} cx={f.x + o} cy={bandY} rx={5.5} ry={2.6} fill="#31302c" stroke="#0e0e0c" strokeWidth={0.7} />
      ))}
      {/* dar (48px) bızbuz-beyaz yüz + sağ koyu perde (#41403B) — ünite-köşeleri içinde */}
      <rect x={f.x + 1.5} y={f.y + 68} width={46} height={f.h - 70} fill="#ecebe8" stroke="#8a8a84" strokeWidth={1} />
      <rect x={f.x + 48} y={f.y + 68} width={f.w - 49.5} height={f.h - 70} fill="#41403b" />
      {/* yüz: siyah anahtar + IN/0 plakası + SIEMENS */}
      <rect x={f.x + 7} y={f.y + 92} width={9} height={15} rx={1.5} fill="#1d1d20" stroke="#000" strokeWidth={0.8} />
      <rect x={f.x + 6} y={f.y + 112} width={36} height={15} rx={2} fill="#fbfbf8" stroke="#a3a3a0" strokeWidth={0.9} />
      <text x={f.x + 24} y={f.y + 123} textAnchor="middle" fontFamily={MS} fontSize={8} fill="#54565a">{on ? 'IN' : '0'}</text>
      <text x={f.x + 24} y={f.y + 148} textAnchor="middle" fontFamily={MS} fontSize={7} fontWeight={700} fill="#6a6d72">SIEMENS</text>
      {/* foto: tepsi ortasından geçen merkezî dikey hat — DÜZ */}
      <line x1={m} y1={915} x2={m} y2={1132} stroke={INK} strokeWidth={1.6} opacity={0.85} />
      {G.C_ROW_Y.map((ry) => (
        <circle key={ry} cx={m} cy={ry} r={3.2} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.85} />
      ))}
      {/* kanca kablosu kaldırıldı — cihaz kablosu yok */}
      {/* etiket: KOYU kalın, gövdenin alt-sağ kenarında */}
      <text x={f.x + 64} y={868} textAnchor="middle" fontFamily={MS} fontSize={24} fontWeight={800} fill={INK}>{k.id.toUpperCase()}</text>
      {/* foto: sütun en altta siyah soket çifti — dekoratif */}
      <FakeKnob x={k.trayL} y={G.C_ROW_Y[7] + 19} color={G.KNOB_COLOR.black} />
      <FakeKnob x={k.trayR} y={G.C_ROW_Y[7] + 19} color={G.KNOB_COLOR.black} />
      <title>{k.id.toUpperCase()} — kontaktör</title>
    </g>
  );
}

/** Pano üzerindeki basılı cihaz etiketleri (b1..b4, e, d1, d2) */
function BoardLabels() {
  return (
    <g pointerEvents="none" fontFamily={MS} fontWeight={800} fill={INK}>
      {/* cihaz etiketleri — foto: b etiketleri merkez x≈108, fontSize≈23 */}
      {G.BUTTONS.map((b) => (
        <text key={b.id} x={108} y={b.y + 8} textAnchor="middle" fontSize={23}>{b.id}</text>
      ))}
      <text x={446} y={529} textAnchor="middle" fontSize={21}>e</text>
      <text x={G.D1_TRAY.label.x} y={G.D1_TRAY.label.y} textAnchor="middle" fontSize={21}>d1</text>
      <text x={G.D2_TRAY.label.x} y={G.D2_TRAY.label.y} textAnchor="middle" fontSize={21}>d2</text>
    </g>
  );
}

/* ================================================================
   motor
   ================================================================ */

function Motor({ running }: { running: boolean }) {
  const M = G.MOTOR;
  const b = M.body;
  return (
    <g data-running={running ? '1' : '0'}>
      <title>Motor {running ? '(çalışıyor)' : '(duruyor)'}</title>
      {/* zemin gölgesi (cihaz kablosu yok — kablo + delik kaldırıldı) */}
      <rect x={b.x + 10} y={b.y + b.h - 6} width={b.w - 22} height={12} rx={6} fill="#56585c" opacity={0.38} />
      {/* gövde + yatay oluklar (plaka/fan z sırası onları örter) */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill="url(#motorSkin)" stroke="#7c7f84" strokeWidth={1.6} />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={i} x1={b.x + 6} x2={b.x + b.w - 6} y1={b.y + 31 + (i - 1) * 27} y2={b.y + 31 + (i - 1) * 27}
          stroke="#828589" strokeWidth={3} opacity={0.6} />
      ))}
      {/* kabartma plaka (780..905 × 60..190, açık gri) + 4 köşe hex vida */}
      <rect x={M.plate.x} y={M.plate.y} width={M.plate.w} height={M.plate.h} rx={3} fill="#c8cccf" stroke="#8b8e93" strokeWidth={1.3} />
      {M.bolts.map(([hx, hy], i) => (
        <polygon key={i} points={[0, 60, 120, 180, 240, 300].map((a) =>
          `${(hx + 7.5 * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(hy + 7.5 * Math.sin((a * Math.PI) / 180)).toFixed(1)}`).join(' ')}
          fill="#7d8a99" stroke="#4c5765" strokeWidth={1} />
      ))}
      {/* kabartma SIEMENS — koyu harfler + açık bevel (photo fs18 dar blok) */}
      <text x={M.label.x} y={M.label.y} textAnchor="middle" fontFamily={MS} fontSize={18} fontWeight={800} letterSpacing={2}
        fill="#4b4e53" stroke="#b9c0c9" strokeWidth={1.1} paintOrder="stroke">SIEMENS</text>
      {/* yuvarlak zil diski (kapsül değil — plakanın sol-alt köşesini örter) */}
      <circle cx={M.bell.x} cy={M.bell.y} r={M.bell.r} fill="#b9c3cf" stroke="#8b95a1" strokeWidth={2} />
      {/* KOYU çelik mil: pu uç → mil → bevel → collar; HUB en üstte, mil ucu altına girer */}
      <rect x={M.shaft.x} y={M.shaft.y + 2} width={18} height={28} rx={5} fill="#b6b4a8" stroke="#8f8d82" strokeWidth={1.2} />
      <rect x={M.shaft.x + 16} y={M.shaft.y} width={M.shaft.w - 16} height={30} rx={4} fill="#383c43" stroke="#191c20" strokeWidth={1.2} />
      <line x1={M.shaft.x + 24} y1={M.shaft.y + 6} x2={M.shaft.x + 78} y2={M.shaft.y + 6} stroke="#6b7078" strokeWidth={1.7} opacity={0.75} />
      <rect x={M.shaft.x + 50} y={M.shaft.y - 4} width={16} height={38} rx={3} fill="#23262b" stroke="#101215" strokeWidth={1.2} />
      <circle cx={M.hub.x} cy={M.hub.y} r={M.hub.r} fill="#596169" stroke="#3c4148" strokeWidth={1.4} />
      {/* fan kapağı (gövdeyi ~5 taşar, rx10) + 4 dikey panjur */}
      <rect x={M.fan.x} y={M.fan.y} width={M.fan.w} height={M.fan.h} rx={10} fill="#9dabbe" stroke="#7e8a9a" strokeWidth={1.2} />
      {M.fan.louvers.map((lx) => (
        <line key={lx} x1={lx} x2={lx} y1={M.fan.y + 12} y2={M.fan.y + M.fan.h - 12} stroke="#6f7a8b" strokeWidth={3} opacity={0.6} />
      ))}
      {/* klemens kutusu (800..874 × 229..286) + lid derzi — kablo altından çıkar */}
      <rect x={M.tBox.x} y={M.tBox.y} width={M.tBox.w} height={M.tBox.h} rx={5} fill="#bcbfc4" stroke="#84878d" strokeWidth={1.4} />
      <line x1={M.tBox.x + 10} y1={M.tBox.y + 18} x2={M.tBox.x + M.tBox.w - 10} y2={M.tBox.y + 18} stroke="#85888d" strokeWidth={1.2} />
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
        {/* motor gövdesi: soluk LEYLAK (GetPixel #C3D3F0 kümesi) */}
        <radialGradient id="motorSkin" cx="50%" cy="24%" r="85%">
          <stop offset="0%" stopColor="#cdd8f2" />
          <stop offset="55%" stopColor="#b4c1dd" />
          <stop offset="100%" stopColor="#929ebc" />
        </radialGradient>
        {/* acil-stop: hardal-mustard TEK plaka (foto #B2AD1B..#A29F06 kümesi) */}
        <radialGradient id="emPlate" cx="45%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#c3b838" />
          <stop offset="60%" stopColor="#aca21b" />
          <stop offset="100%" stopColor="#7f7a12" />
        </radialGradient>
        {/* seçici plaka: soluk MAVİ-GRİ metal (foto #A5B8D4..#B6C5E6) */}
        <linearGradient id="selPlate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6c3d4" />
          <stop offset="50%" stopColor="#c3cfe0" />
          <stop offset="100%" stopColor="#a7b5c8" />
        </linearGradient>
        {/* buton cap gradient'leri — b1/b3 KIRMIZI (aşağı aydınlanan), b2/b4 TEAL (çapraz) */}
        <linearGradient id="cap-b1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8e2a34" />
          <stop offset="46%" stopColor="#a0353f" />
          <stop offset="100%" stopColor="#b34450" />
        </linearGradient>
        <linearGradient id="cap-b3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8e2a34" />
          <stop offset="46%" stopColor="#a0353f" />
          <stop offset="100%" stopColor="#b34450" />
        </linearGradient>
        <linearGradient id="cap-b2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#026260" />
          <stop offset="52%" stopColor="#006f69" />
          <stop offset="100%" stopColor="#147d76" />
        </linearGradient>
        <linearGradient id="cap-b4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#026260" />
          <stop offset="52%" stopColor="#006f69" />
          <stop offset="100%" stopColor="#147d76" />
        </linearGradient>
        {/* kontaktör gövdesi: koyu gri duvar (foto #41403B) */}
        <linearGradient id="darkBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4d4c46" />
          <stop offset="55%" stopColor="#41403b" />
          <stop offset="100%" stopColor="#383731" />
        </linearGradient>
        {/* d2: soluk MAVİ yüz (foto #8DA4C4..#98ABCB) */}
        <linearGradient id="d2Face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a6b6d2" />
          <stop offset="55%" stopColor="#93a7c8" />
          <stop offset="100%" stopColor="#7e93b8" />
        </linearGradient>
        {/* tekrar-verified beige: #B4AD90..#C0BA9E */}
        <radialGradient id="panelSkin" cx="50%" cy="24%" r="115%">
          <stop offset="0%" stopColor="#c9c2a4" />
          <stop offset="60%" stopColor="#bcb597" />
          <stop offset="100%" stopColor="#a69c7b" />
        </radialGradient>
      </defs>

      {/* arka plan (duvar — foto: soluk MAVİ-BEYAZ #BCCDE9) */}
      <rect x={-400} y={-300} width={2200} height={2000} fill="#bccce9" />

      {/* pano gölgesi + çerçeve + yüzey */}
      <rect x={G.FRAME.x + 6} y={G.FRAME.y + 10} width={G.FRAME.w} height={G.FRAME.h} rx={10} fill="rgba(0,0,0,0.18)" />
      <rect x={G.FRAME.x} y={G.FRAME.y} width={G.FRAME.w} height={G.FRAME.h} rx={10} fill={G.FRAME_COLOR} stroke="#0e0b08" strokeWidth={3} />
      <rect x={G.PANEL.x} y={G.PANEL.y} width={G.PANEL.w} height={G.PANEL.h} rx={4} fill="url(#panelSkin)" stroke={G.PANEL_EDGE} strokeWidth={2} />
      {/* kullanma izleri: leke, çizik — gerçek kart boyası yıpranmış */}
      <g pointerEvents="none">
        {/* leke izleri: gerçekte yok denecek kadar silik */}
        <g fill="#6f5b34" opacity={0.02}>
          <ellipse cx={300} cy={760} rx={55} ry={16} />
          <ellipse cx={540} cy={330} rx={36} ry={11} />
          <ellipse cx={880} cy={1100} rx={62} ry={17} />
          <ellipse cx={150} cy={480} rx={24} ry={40} />
          <ellipse cx={1010} cy={620} rx={30} ry={13} />
          <ellipse cx={640} cy={880} rx={80} ry={15} />
        </g>
        {/* foto R5: boy boy DÜZ çizik YOK — yalnız hafif yüzey leke izleri (üstteki elipsler) */}
        {/* köşe montaj vidası delikleri */}
        <g fill="#3b3122" opacity={0.35}>
          {[
            [G.PANEL.x + 18, G.PANEL.y + 16], [G.PANEL.x + G.PANEL.w - 18, G.PANEL.y + 16],
            [G.PANEL.x + 18, G.PANEL.y + G.PANEL.h - 16], [G.PANEL.x + G.PANEL.w - 18, G.PANEL.y + G.PANEL.h - 16],
          ].map(([sx, sy]) => <circle key={`${sx}-${sy}`} cx={sx} cy={sy} r={3.4} />)}
        </g>
        {/* kurşun kalem notları: C2-C3 arası rakamlar */}
        <g fill="#8b8172" opacity={0.65} fontStyle="italic">
          <text x={517} y={1006} fontFamily={MS} fontSize={11}>44</text>
          <text x={524} y={1032} fontFamily={MS} fontSize={10}>9</text>
        </g>
        {/* b3–b4 arası kurşun garabeti (foto local x128..165 / y604..630) — kalem izi, elle bırakılır */}
        <g stroke="#8f8776" strokeWidth={1.4} fill="none" opacity={0.55} strokeLinecap="round">
          <path d="M 132 608 q 8 -6 14 1 q 6 7 12 0 q 5 -6 10 2" />
          <path d="M 136 618 q 10 -5 17 2 q 7 6 11 -1" />
          <path d="M 131 626 h 26" />
        </g>
      </g>

      {/* üst bölge */}
      <Emergency />
      <Selector />
      <Breakers />
      <SchoolText />

      {/* cihaz gövdeleri (kabloların altında) — baskı katmanı elle-çizilmiş mürekkep */}
      <EUnit sim={sim} />
      <ETrayPrints />
      <D1Unit />
      <D1TrayPrints />
      {G.BUTTONS.map((b) => <ButtonUnit key={b.id} b={b} pressed={st.pressed[b.id as 'b1']} />)}
      {/* kontaktörler d2 tepsi katmanından ÖNCE: c4 kubbesi d2 baskılarının altında kalsın */}
      {G.CONTACTORS.map((k) => <ContactorUnit key={k.id} k={k} on={sim?.dev.contactors[k.id as 'c1'] === true} />)}
      <D2Unit sim={sim} />
      <D2TrayPrints />

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
      <Motor running={sim?.motor.running === true} />

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
