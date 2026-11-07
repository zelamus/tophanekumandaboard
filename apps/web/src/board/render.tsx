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

/** Açık (NO) kontak baskısı: ──╱─ */
function PrNo({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} Q ${(a + PAD + m - DGAP) / 2} ${y + 1.8} ${m - DGAP} ${y}`} />
      <path d={`M ${m - DGAP} ${y} L ${m + 2} ${y - 12} L ${m + 2} ${y + 1}`} />
      <path d={`M ${m + DGAP} ${y} L ${b - PAD} ${y}`} />
      <path d={`M ${m - DGAP} ${y} L ${m - DGAP} ${y - 11}`} />
    </g>
  );
}

/** Kapalı (NC) kontak baskısı: elle çizilmiş gibi hafif inişli hat */
function PrNc({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <path d={`M ${a + PAD} ${y} Q ${m} ${y + 2.4} ${b - PAD} ${y}`} stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
  );
}

/** Termik normal kapı (tn): kapı + küçük köprü işareti */
function PrNcOpen({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} L ${m - 6} ${y}`} />
      <path d={`M ${m + 6} ${y} Q ${(m + 6 + b - PAD) / 2} ${y + 2} ${b - PAD} ${y}`} />
      <path d={`M ${m - 6} ${y - 5} L ${m - 6} ${y + 5} M ${m + 6} ${y - 5} L ${m + 6} ${y + 5}`} />
    </g>
  );
}

/** Termik gecikmeli kapı (tc): hafif kavisli köprü — gecikme işareti tepsinin üstünde ayrı çizilir */
function PrNcT({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <path d={`M ${a + PAD} ${y} Q ${m} ${y + 2.4} ${b - PAD} ${y}`} stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
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

/** el çizimi dalgalı köprü — iki yumuşak Q eğrisi, 3 soketten geçer */
function PrWave({ nc, com, no, y }: { nc: number; com: number; no: number; y: number }) {
  const a = nc, m = com, b = no;
  return (
    <path
      d={`M ${a} ${y} Q ${(a + m) / 2} ${y + 7} ${m} ${y} Q ${(m + b) / 2} ${y - 7} ${b} ${y}`}
      stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round"
    />
  );
}

/** d2 zamanlanmış NO: ⊤ işaretli hat */
function PrTimed({ a, b, y }: { a: number; b: number; y: number }) {
  const m = (a + b) / 2;
  return (
    <g stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round">
      <path d={`M ${a + PAD} ${y} Q ${m} ${y + 2.2} ${b - PAD} ${y}`} />
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
  const rPlate = Math.min(p.plate.w, p.plate.h) / 2;
  return (
    <g>
      {/* gerçek kart: yuvarlak sarı plaka + üzerinde yay boyunca EMERGENCY */}
      <circle cx={cx} cy={cy} r={rPlate} fill="#e7c93c" stroke="#8f7a17" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={rPlate - 7} fill="#ddb725" stroke="#d0b52c" strokeWidth={0.8} />
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r} fill="#b9321f" stroke="#5e1508" strokeWidth={2} />
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r - 9} fill="#d24433" />
      <circle cx={p.dome.x - 8} cy={p.dome.y - 9} r={7} fill="#e2614f" opacity={0.85} />
      {/* foto: yazı sol-alt yayı izler ve plaka alt kenarına hafif taşar */}
      <defs>
        <path id="emArc" d={`M ${cx - 50} ${cy + 24} Q ${cx - 6} ${cy + 70} ${cx + 48} ${cy + 40}`} />
      </defs>
      <text fontFamily={MS} fontSize={14} fontWeight={800} fill={INK} letterSpacing={1.2}>
        <textPath href="#emArc" startOffset="50%" textAnchor="middle">EMERGENCY</textPath>
      </text>
    </g>
  );
}

function Breakers() {
  const st = useStore();
  return (
    <g>
      {/* foto: siyah girinti yok — açık gri metal muhafaza içinde küçük DIN modülleri */}
      <rect x={G.RECESS.x} y={G.RECESS.y} width={G.RECESS.w} height={G.RECESS.h} rx={5} fill="#b9bcc1" stroke="#8f9296" strokeWidth={1.2} />
      {/* F3 — motor kesicisi (3P) */}
      <rect x={116} y={226} width={48} height={55} rx={2} fill="#d8d7d3" stroke="#8b8a86" strokeWidth={1} />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('motor'); }}>
        {[120, 131, 142].map((x) => (
          <g key={x}>
            <rect x={x} y={230} width={8} height={7} rx={1} fill="#efefec" />
            <rect x={x} y={st.breakers.motor ? 233 : 249} width={8} height={17} rx={1.5} fill="#23232a" stroke="#000" strokeWidth={0.8} />
            <rect x={x} y={271} width={8} height={7} rx={1} fill="#c5c4bf" />
          </g>
        ))}
        <rect x={116} y={226} width={48} height={55} rx={2} fill="transparent" />
        <title>F3 — motor kesicisi (3P)</title>
      </g>
      {/* F1 — kumanda kesicisi (1P); F3 ile arasında boşluk */}
      <rect x={172} y={226} width={22} height={55} rx={2} fill="#d8d7d3" stroke="#8b8a86" strokeWidth={1} />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('control'); }}>
        <rect x={178} y={230} width={8} height={7} rx={1} fill="#efefec" />
        <rect x={178} y={st.breakers.control ? 233 : 249} width={8} height={17} rx={1.5} fill="#23232a" stroke="#000" strokeWidth={0.8} />
        <rect x={178} y={271} width={8} height={7} rx={1} fill="#c5c4bf" />
        <title>F1 — kumanda kesicisi (1P)</title>
      </g>
    </g>
  );
}

function Selector() {
  const p = G.SELECTOR;
  return (
    <g>
      {/* gerçek kart: açık gri/beyaz plaka + siyah kol */}
      <rect x={p.plate.x} y={p.plate.y} width={p.plate.w} height={p.plate.h} rx={9} fill="#d8d7d3" stroke="#5d5f63" strokeWidth={1.5} />
      <rect x={p.plate.x + 5} y={p.plate.y + 5} width={p.plate.w - 10} height={p.plate.h - 10} rx={6} fill="#e7e6e2" stroke="#9a9c9f" strokeWidth={1} />
      <circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r} fill="#23252b" stroke="#111" strokeWidth={1.5} />
      {/* kol: fotoğrafta 45° sol-aşağı bakar */}
      <path d={`M ${p.knob.x} ${p.knob.y} L ${p.knob.x - 12} ${p.knob.y + 11}`} stroke="#e8e8e8" strokeWidth={3.2} strokeLinecap="round" />
      {/* 0/1 plakanın sağ kenarında üst/alt */}
      <text x={p.plate.x + p.plate.w - 9} y={p.plate.y + 14} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#2b2b2e">0</text>
      <text x={p.plate.x + p.plate.w - 9} y={p.plate.y + p.plate.h - 10} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#2b2b2e">1</text>
      {/* plaka altındaki küçük kazıma baskı (okunamıyor) — çok silik */}
      <g stroke={INK} strokeWidth={1} fill="none" opacity={0.16} strokeLinecap="round">
        <path d={`M ${p.plate.x + 5} ${p.plate.y + p.plate.h + 12} q 5 -4 10 0 t 10 0 t 10 0`} />
        <path d={`M ${p.plate.x + 12} ${p.plate.y + p.plate.h + 18} h 22`} />
      </g>
    </g>
  );
}

function SchoolText() {
  return (
    /* foto: damgalı stencil yazı — mono, %30 büyük, geniş aralıklı */
    <g fontFamily="Consolas, monospace" fontSize={21} fontWeight={900} letterSpacing={2.5} fill={INK}>
      <text x={G.SCHOOL.x} y={G.SCHOOL.y}>TOPHANE TEKNİK ve</text>
      <text x={G.SCHOOL.x} y={G.SCHOOL.y + G.SCHOOL.lineH}>ENDÜSTRİ MESLEK LİSESİ</text>
      {/* okul yazısının altındaki silik kurşun kalem imza (foto) */}
      <path d="M 132 362 c 5 -9 11 -9 15 -2 c 3 6 8 5 12 -2 c 4 -6 8 -2 9 3 q 6 4 14 2" stroke="#6e6a5e" strokeWidth={1.2} fill="none" opacity={0.2} />
    </g>
  );
}

function Lamps({ sim }: { sim: SimOutput | null }) {
  const first = G.LAMPS[0].x, last = G.LAMPS[G.LAMPS.length - 1].x;
  return (
    <g>
      {/* gerçek kartta lambalar tek metal şerit üzerinde */}
      <rect x={first - 40} y={G.LAMP_Y - 27} width={last - first + 80} height={54} rx={12} fill="#c9cbcf" stroke="#7f8287" strokeWidth={1.4} />
      <rect x={first - 34} y={G.LAMP_Y - 21} width={last - first + 68} height={42} rx={9} fill="#dfe0e2" stroke="#a8abaf" strokeWidth={1} />
      {G.LAMPS.map((l) => {
        const on = sim?.lamps[l.key] === true;
        return (
          <g key={l.key}>
            {/* foto: koyu bezel + dış gümüş ince çember */}
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 4} fill="none" stroke="#b9bcc1" strokeWidth={0.9} />
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 2.5} fill="#3f443e" stroke="#23261f" strokeWidth={1.4} />
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
      {/* gövde üstünden çıkan kablo halkaları (3UA biriminde teller yukarı fışkırır) */}
      <path d={`M ${u.body.x + 20} ${u.body.y + 5} Q ${u.body.x + 4} ${u.body.y - 22} ${u.body.x + 24} ${u.body.y - 38}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <path d={`M ${u.body.x + 44} ${u.body.y + 5} Q ${u.body.x + 34} ${u.body.y - 26} ${u.body.x + 52} ${u.body.y - 40}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <ellipse cx={u.body.x + 24} cy={u.body.y - 40} rx={7} ry={3} fill="#23231f" />
      <ellipse cx={u.body.x + 52} cy={u.body.y - 42} rx={7} ry={3} fill="#23231f" />
      {/* gövde altından sarkan kablo halkası */}
      <path d={`M ${u.body.x + 10} ${u.body.y + u.body.h - 8} Q ${u.body.x - 12} ${u.body.y + u.body.h + 24} ${u.body.x + 4} ${u.body.y + u.body.h + 18}`} stroke="#1a1a1c" strokeWidth={4} fill="none" strokeLinecap="round" />
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={7} fill="#b9bcc1" stroke="#5c5f64" strokeWidth={1.5} />
      <rect x={u.body.x + 4} y={u.face.y - 6} width={u.body.w - 8} height={(u.face.y - 6) - u.body.y} fill="#a3a6ab" />
      <rect x={u.face.x} y={u.face.y} width={u.face.w} height={u.face.h} rx={3} fill="#e9e9e6" stroke="#8f9296" strokeWidth={1.2} />
      <text x={u.face.x + 8} y={u.face.y + 16} fontFamily={MS} fontSize={9} fill="#6b6e72">3UA 250V~</text>
      {/* büyük yuvarlak ayar kadranı — yüzeyin sol-altında, reset düğmesi sağda kalır */}
      <g id="termik-kadran">
        <circle cx={u.face.x + 22} cy={u.face.y + 58} r={16} fill="#f4f4f1" stroke="#8f9296" strokeWidth={1.3} />
        <circle cx={u.face.x + 22} cy={u.face.y + 58} r={10.5} fill="#dddedb" stroke="#a5a8ab" strokeWidth={1} />
        <line x1={u.face.x + 22} y1={u.face.y + 58} x2={u.face.x + 30} y2={u.face.y + 50} stroke="#b9321f" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={u.face.x + 22} cy={u.face.y + 58} r={2} fill="#3c3f44" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={u.face.x + 22 + (i - 2) * 6.5} y1={u.face.y + 38.5} x2={u.face.x + 22 + (i - 2) * 6.5} y2={u.face.y + 41.5} stroke="#6b6e72" strokeWidth={1} />
        ))}
      </g>
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
      {/* gecikme işareti: siyah tn çiftinin ÜSTÜNDE (foto) */}
      <text x={(t.cols[0] + t.cols[1]) / 2} y={t.rows[0].y - 7} textAnchor="middle" fontFamily={MS} fontSize={11} fontWeight={700} fill={INK}>t~Z</text>
      {/* kenardaki silik kalem yazısı — gerçek kartta "Rm şah" */}
      <text x={t.box.x + t.box.w + 12} y={t.box.y + 74} fontFamily={MS} fontSize={13} fontStyle="italic" fontWeight={600} fill="#6b6350" opacity={0.4}>Rm şah</text>
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
      {/* gövde üstünden fışkıran İKİ SİYAH TEL halkası (foto; tepe ~y326) */}
      <path d={`M ${u.body.x + 12} ${u.body.y + 3} Q ${u.body.x - 2} ${u.body.y - 20} ${u.body.x + 14} ${u.body.y - 34}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <path d={`M ${u.body.x + 40} ${u.body.y + 3} Q ${u.body.x + 28} ${u.body.y - 22} ${u.body.x + 46} ${u.body.y - 36}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <ellipse cx={u.body.x + 14} cy={u.body.y - 35} rx={7} ry={3} fill="#23231f" />
      <ellipse cx={u.body.x + 46} cy={u.body.y - 37} rx={7} ry={3} fill="#23231f" />
      {/* ince-uzun gövde */}
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={5} fill="#cdd0d4" stroke="#585b60" strokeWidth={1.5} />
      {/* kırmızı takma bloğu (üst sağ; gövde genişliğine göre) */}
      <rect x={u.body.x + 32} y={u.body.y} width={24} height={26} rx={3} fill="#b9321f" stroke="#5e1508" strokeWidth={1.4} />
      <rect x={u.body.x + 37} y={u.body.y + 7} width={12} height={8} rx={2} fill="#d24433" />
      {/* beyaz ön yüz gövdeye yakın (x+4 / w-8) */}
      <rect x={u.body.x + 4} y={u.body.y + 30} width={u.body.w - 8} height={u.body.h - 38} rx={3} fill="#e9e9e6" stroke="#8f9296" strokeWidth={1.2} />
      {/* foto: yüzün alt bölgesinde teal bant (3UG4 etiket şeridi) */}
      <rect x={u.body.x + 4} y={448} width={u.body.w - 8} height={58} rx={2} fill="#7cb0ab" fillOpacity={0.92} stroke="#5d948f" strokeWidth={0.8} />
      <circle cx={u.body.x + 24} cy={u.body.y + 66} r={10} fill="#191a1d" stroke="#000" strokeWidth={1.5} />
      <text x={u.body.x + 6} y={u.body.y + 22} fontFamily={MS} fontSize={8} fontWeight={700} fill="#5c5f64">3UG4</text>
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
      <path d={`M ${u.cableStub.x - 10} ${u.cableStub.y - 16} Q ${u.cableStub.x - 20} ${u.cableStub.y + 12} ${u.body.x + 20} ${u.body.y + 6}`} stroke="#1a1a1c" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <ellipse cx={u.cableStub.x - 10} cy={u.cableStub.y - 18} rx={7} ry={3} fill="#23231f" />
      <rect x={u.body.x} y={u.body.y} width={u.body.w} height={u.body.h} rx={5} fill="#d7d9dc" stroke="#585b60" strokeWidth={1.5} />
      {/* dijital kronometre: gerçek kartta KIRMIZI 7-segment göstergesi */}
      <rect x={u.body.x + 10} y={u.body.y + 30} width={u.body.w - 20} height={110} rx={3} fill="#efefec" stroke="#9ea1a5" strokeWidth={1.2} />
      <rect x={u.lcd.x} y={u.lcd.y} width={u.lcd.w} height={u.lcd.h} rx={2} fill="#2a0b08" stroke="#180604" strokeWidth={1.2} />
      {/* gerçek kartta kırmızı 7-segment gösterge */}
      <SegDisplay x={u.lcd.x + 5} y={u.lcd.y + 1.5} h={u.lcd.h - 3} value={sec.toFixed(1)} />
      {/* foto: LCD altında 4 belirgin koyu tuş */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={u.lcd.x + 6 + i * 11.5} cy={u.lcd.y + u.lcd.h + 12} r={5} fill="#15151a" stroke="#000" strokeWidth={0.8} />
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
  const fill = b.color === 'red' ? '#b9321f' : '#2f9e4f';
  const press = pressed;
  return (
    <g className={press ? 'btn pressed' : 'btn'}>
      {/* yuva çifti arası baskı + ortak köprü (diğer baskılarla aynı mürekkep filtresi) */}
      <g filter="url(#handInk)">
      <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <path d={`M ${G.BTN_COL.red} ${b.y - G.BTN_COL.dy} L ${G.BTN_COL.red} ${b.y + G.BTN_COL.dy}`} />
        <path d={`M ${G.BTN_COL.red} ${b.y} L ${G.BTN_COL.black - 26} ${b.y}`} />
        <path d={`M ${G.BTN_COL.black - 26} ${b.y} L ${G.BTN_COL.black - 12} ${b.y - G.BTN_COL.dy + 4} L ${G.BTN_COL.black - 10} ${b.y - G.BTN_COL.dy + 3}`} />
        <path d={`M ${G.BTN_COL.black - 26} ${b.y} L ${G.BTN_COL.black - 12} ${b.y + G.BTN_COL.dy - 4} L ${G.BTN_COL.black - 10} ${b.y + G.BTN_COL.dy - 3}`} />
      </g>
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
  return (
    <g>
      {/* x sıralarının büyük yardımcı kutu baskısı */}
      <g filter="url(#handInk)">
        <rect x={left + 12} y={G.C_ROW_Y[5] - 20} width={right - left - 24} height={(G.C_ROW_Y[7] - G.C_ROW_Y[5]) + 28} fill="none" stroke={INK} strokeWidth={1.6} />
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
      </g>
      {/* kanca kablo (pabuç) */}
      <path d={`M ${f.x + 24} ${f.y + f.h - 3} Q ${f.x - 4} ${G.C_ROW_Y[0] + 6} ${left} ${G.C_ROW_Y[0]}`} stroke="#23231f" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* üst demet: fotoda dolgun, hafif sola yatık siyah kubbe */}
      <rect x={f.x} y={f.y} width={f.w} height={14} rx={4} fill="#1c1c1e" stroke="#0c0c0e" strokeWidth={1.2} />
      <path d={`M ${f.x + 3} ${f.y + 5} C ${f.x - 10} ${f.y - 26} ${f.x - 2} ${f.y - 52} ${f.x + 18} ${f.y - 58} C ${f.x + 38} ${f.y - 63} ${f.x + 58} ${f.y - 36} ${f.x + 70} ${f.y + 5}`} fill="#202124" stroke="#0f0f10" strokeWidth={1} />
      {/* kubbe içi tel dokusu — sola yatık kısa kıvrımlar */}
      {[12, 24, 36, 48, 60].map((o) => (
        <path key={o} d={`M ${f.x + o - 6} ${f.y - 6} Q ${f.x + o - 4} ${f.y - 32} ${f.x + o + 1} ${f.y - 50}`} stroke="#3a3b40" strokeWidth={1.1} fill="none" opacity={0.8} />
      ))}
      {/* tepe pabuç elipsleri — kubbe kenarına gömülü */}
      <ellipse cx={f.x + 16} cy={f.y - 53} rx={9} ry={3.2} fill="#23231f" />
      <ellipse cx={f.x + 34} cy={f.y - 57} rx={10} ry={3.4} fill="#23231f" />
      <ellipse cx={f.x + 52} cy={f.y - 54} rx={8.5} ry={3.2} fill="#23231f" />
      {/* gövde — gümüş gri (foto: Siemens gümüş gövde) */}
      <rect x={f.x} y={f.y + 12} width={f.w} height={f.h - 12} rx={6} fill="url(#silverBody)" stroke="#77797d" strokeWidth={1.5} />
      {/* foto: tepsi başında 2×4 sarı posta — kilitli a1/m1/m2 üstüne dekoratif 4. sarı sıra (tepsi sütunlarında) */}
      <FakeKnob x={left} y={G.C_ROW_Y[0] - 19.5} color={G.KNOB_COLOR.yellow} />
      <FakeKnob x={right} y={G.C_ROW_Y[0] - 19.5} color={G.KNOB_COLOR.yellow} />
      <rect x={f.x + 3} y={f.y + 70} width={f.w - 6} height={f.h - 76} rx={3} fill="#e9e9ec" stroke="#87888d" strokeWidth={1.2} />
      {/* siyah anahtar + plaka */}
      <rect x={f.x + 10} y={f.y + 70 + 26} width={11} height={17} rx={2} fill="#1d1d20" stroke="#000" strokeWidth={1} />
      <rect x={f.x + 17} y={f.y + 70 + 42} width={36} height={15} rx={2} fill="#fbfbf8" stroke="#a3a3a0" strokeWidth={0.9} />
      <text x={f.x + 35} y={f.y + 70 + 53} textAnchor="middle" fontFamily={MS} fontSize={8} fill="#54565a">{on ? 'IN' : '0'}</text>
      <text x={f.x + f.w / 2} y={f.y + f.h - 6} textAnchor="middle" fontFamily={MS} fontSize={9} fontWeight={700} fill="#6a6d72">SIEMENS</text>
      {/* etiket: fotoda kalın siyah harfler kontaktörlerin altına yakın */}
      <text x={f.x + f.w / 2} y={905} textAnchor="middle" fontFamily={MS} fontSize={21} fontWeight={800} fill={INK}>{k.id.toUpperCase()}</text>
      {/* foto: sütun en altta siyah soket çifti — dekoratif, x-kutusunun altında */}
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
      {G.BUTTONS.map((b) => (
        <text key={b.id} x={84} y={b.y + 7} textAnchor="middle" fontSize={21}>{b.id}</text>
      ))}
      <text x={500} y={552} textAnchor="middle" fontSize={21}>e</text>
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
      {/* foto: gövde altının koyu silisi — çan dibinde kama + ince taban, şaft hizasına uzanır */}
      <path d={`M ${b.x - 52} ${b.y + b.h - 4} L ${b.x + 58} ${b.y + b.h - 2} L ${b.x + 34} ${b.y + b.h + 9} L ${b.x - 44} ${b.y + b.h + 10} Z`} fill="#54575c" opacity={0.5} />
      <rect x={b.x - 6} y={b.y + b.h - 3} width={b.w + 6} height={13} rx={3} fill="#5d6065" opacity={0.4} />
      {/* mil (gerçek kartta sola bakan somunluk uç) */}
      <rect x={M.shaft.x} y={M.shaft.y} width={M.shaft.w} height={M.shaft.h} rx={3} fill="#4a4d52" stroke="#2b2d31" strokeWidth={1.2} />
      <rect x={M.shaft.x + 4} y={M.shaft.y - 1} width={6} height={M.shaft.h + 2} rx={3} fill="#43464c" />
      <circle cx={M.shaft.x + 3} cy={M.shaft.y + M.shaft.h / 2} r={9} fill="#9aa0a6" stroke="#3a3d42" strokeWidth={1.2} />
      {/* gövde — soğutma kanatçıklarını (yatay oluklar) tak */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={`url(#motorSkin)`} stroke="#7c7f84" strokeWidth={1.6} />
      {/* kanatçık olukları: tekdüze değil — ince/kalın dönüşümlü (foto ~8 sık oluk) */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={i} x1={b.x + 8} y1={b.y + i * (b.h - 16) / 9} x2={b.x + b.w - 12} y2={b.y + i * (b.h - 16) / 9}
          stroke={i % 2 ? '#929599' : '#85888c'} strokeWidth={i % 2 ? 2.2 : 1.5} opacity={0.45} />
      ))}
      {/* sağ üstte koyu isim plakası — fan kapağına binmeden */}
      <rect x={b.x + b.w - 120} y={b.y + 9} width={68} height={32} rx={2.5} fill="#33373c" stroke="#1d2024" strokeWidth={1} />
      <text x={b.x + b.w - 86} y={b.y + 22} textAnchor="middle" fontFamily={MS} fontSize={8.5} fontWeight={800} fill="#cfd2d6" letterSpacing={0.8}>SIEMENS</text>
      <line x1={b.x + b.w - 114} y1={b.y + 28} x2={b.x + b.w - 58} y2={b.y + 28} stroke="#8a8f95" strokeWidth={0.9} opacity={0.8} />
      <line x1={b.x + b.w - 114} y1={b.y + 33} x2={b.x + b.w - 66} y2={b.y + 33} stroke="#8a8f95" strokeWidth={0.9} opacity={0.6} />
      {/* sağ kapak (fan kapağı) + kabartma */}
      <rect x={b.x + b.w - 42} y={b.y + 4} width={38} height={b.h - 8} rx={8} fill="#a9adb2" stroke="#8d9095" strokeWidth={1} />
      {[1, 2, 3, 4].map((i) => (
        <line key={i} x1={b.x + b.w - 42 + i * 7.6} y1={b.y + 8} x2={b.x + b.w - 42 + i * 7.6} y2={b.y + b.h - 8} stroke="#7f8287" strokeWidth={1.6} opacity={0.5} />
      ))}
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
        <linearGradient id="silverBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9dbde" />
          <stop offset="45%" stopColor="#c2c5c9" />
          <stop offset="100%" stopColor="#a5a8ad" />
        </linearGradient>
        <radialGradient id="panelSkin" cx="50%" cy="22%" r="115%">
          <stop offset="0%" stopColor="#eee3bd" />
          <stop offset="70%" stopColor="#e4d7ac" />
          <stop offset="100%" stopColor="#d3c394" />
        </radialGradient>
        {/* elle çizilmiş mürekkep: hafif dağınıklık — CAD düzlüğünü kırar */}
        <filter id="handInk" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* arka plan (duvar) */}
      <rect x={-400} y={-300} width={2200} height={2000} fill="#e9e7e2" />

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
        <g stroke="#8a754c" opacity={0.06} strokeLinecap="round" fill="none">
          <path d={`M ${G.PANEL.x + 40} ${G.PANEL.y + 130} L ${G.PANEL.x + 30} ${G.PANEL.y + 950}`} strokeWidth={9} />
          <path d={`M ${G.PANEL.x + G.PANEL.w - 60} ${G.PANEL.y + 200} L ${G.PANEL.x + G.PANEL.w - 48} ${G.PANEL.y + 750}`} strokeWidth={7} />
        </g>
        {/* köşe montaj vidası delikleri */}
        <g fill="#3b3122" opacity={0.35}>
          {[
            [G.PANEL.x + 18, G.PANEL.y + 16], [G.PANEL.x + G.PANEL.w - 18, G.PANEL.y + 16],
            [G.PANEL.x + 18, G.PANEL.y + G.PANEL.h - 16], [G.PANEL.x + G.PANEL.w - 18, G.PANEL.y + G.PANEL.h - 16],
          ].map(([sx, sy]) => <circle key={`${sx}-${sy}`} cx={sx} cy={sy} r={3.4} />)}
        </g>
        {/* kurşun kalem notları: C2-C3 arası rakamlar + b4 üstü işaret */}
        <g fill="#8b8172" opacity={0.65} fontStyle="italic">
          <text x={517} y={1006} fontFamily={MS} fontSize={11}>44</text>
          <text x={524} y={1032} fontFamily={MS} fontSize={10}>9</text>
          <text x={122} y={622} fontFamily={MS} fontSize={11}>11</text>
          <path d="M 100 612 Q 108 606 116 613" stroke="#8b8172" strokeWidth={1.2} fill="none" opacity={0.65} />
        </g>
      </g>

      {/* üst bölge */}
      <Emergency />
      <Selector />
      <Breakers />
      <SchoolText />

      {/* cihaz gövdeleri (kabloların altında) — baskı katmanı elle-çizilmiş mürekkep */}
      <EUnit sim={sim} />
      <g filter="url(#handInk)"><ETrayPrints /></g>
      <D1Unit />
      <g filter="url(#handInk)"><D1TrayPrints /></g>
      {G.BUTTONS.map((b) => <ButtonUnit key={b.id} b={b} pressed={st.pressed[b.id as 'b1']} />)}
      {/* kontaktörler d2 tepsi katmanından ÖNCE: c4 kubbesi d2 baskılarının altında kalsın */}
      {G.CONTACTORS.map((k) => <ContactorUnit key={k.id} k={k} on={sim?.dev.contactors[k.id as 'c1'] === true} />)}
      <D2Unit sim={sim} />
      <g filter="url(#handInk)"><D2TrayPrints /></g>

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
