// Pano çizimi — "Siemens motor control training board" sanatı (ek pano) temel
// katman olarak birebir render edilir; simülasyon durumları üstüne uygulanır:
// lamba yanması, kesici kolları, buton basma, ZR canlı göstergesi, termik
// sıfırlama, kontaktör IN/0 yüzü. Öğrenci kabloları yuvarlak istiflenen
// kablolar olarak çizilir; soketler (düğler) kabloların UCUNU örter şekilde
// en sonda çizilir.

import { Fragment, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import * as G from './geometry';
import type { SocketDef } from './geometry';
import { A, useStore } from '../store';
import type { BreakerState, Cable, Carry } from '../store';
import type { SimOutput } from '../sim/model';
import { sfx } from '../audio/sfx';

/** Hex rengi karart / aydınlat (k: -1..1) */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ================================================================
   sanat sembolleri — ek HTML'deki defs bloğu (soket düğleri strip edildi,
   düğler Knob katmanında interaktif çizilir)
   ================================================================ */

function ArtDefs(): ReactNode {
  return (
    <defs>
      <linearGradient id="pan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eddfa6" /><stop offset="1" stopColor="#e6d595" />
      </linearGradient>
      <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d4d4cf" /><stop offset=".5" stopColor="#b3b3ae" /><stop offset="1" stopColor="#8d8d89" />
      </linearGradient>
      <radialGradient id="gl" cx=".5" cy=".55" r=".6">
        <stop offset=".55" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".28" />
      </radialGradient>
      <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity=".05" />
      </linearGradient>
      <linearGradient id="fn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dcdcd7" /><stop offset="1" stopColor="#9c9c97" />
      </linearGradient>
      {/* silindirik şaft gölgesi — yatay çubuk yuvarlak okunsun */}
      <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4e4b44" />
        <stop offset=".3" stopColor="#b9b6ac" />
        <stop offset=".55" stopColor="#8d8a80" />
        <stop offset="1" stopColor="#3f3c36" />
      </linearGradient>

      {/* yuvarlak terminal düğü — interaktif katmandan ÖNCE görünmez (strip) */}
      <g id="j">
        <circle r={12} fill="#0d0d0d" /><circle r={8.5} fill="currentColor" /><circle r={4} fill="#000" opacity={0.55} />
      </g>

      {/* sinyal lambası */}
      <g id="lp">
        <circle r={27} fill="currentColor" />
        <circle r={24.5} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={5} />
        <circle r={22} fill="currentColor" /><circle r={22} fill="url(#gl)" />
        <ellipse cy={-12} rx={14} ry={8} fill="url(#gh)" opacity={0.8} />
        <ellipse cx={-10} cy={-15} rx={4} ry={2} fill="#fff" transform="rotate(-30 -10 -15)" />
        <ellipse cy={14} rx={11} ry={4.5} fill="#fff" opacity={0.18} />
      </g>

      {/* itici buton kafası */}
      <g id="bt"><circle r={26} fill="#161616" /><circle r={21} fill="currentColor" /></g>

      {/* buton yuva köprüsü baskısı (soket #j'leri Knob katmanında) */}
      <g id="bs">
        <path className="bw" stroke="#111" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" d="M256 0H335M277-26V-10.7M277-4.3V4.3M277 10.7V26M340-26V-10.7M340 10.7V26M338.1 4.7L330 -7" />
        <path d="M259-6L273 0L259 6Z" fill="#111" />
        <rect className="bw" x={246} y={-9} width={10} height={18} stroke="#111" strokeWidth={3} fill="none" />
        <g className="bw" stroke="#111" strokeWidth={2.4} fill="none">
          <circle cx={277} cy={-7.5} r={3.2} /><circle cx={277} cy={7.5} r={3.2} />
          <circle cx={340} cy={-7.5} r={3.2} /><circle cx={340} cy={7.5} r={3.2} />
        </g>
      </g>

      {/* köşe montaj vidası (termik plakası 4 köşede kullanır) */}
      <g id="sk">
        <circle r={3.6} fill="#b8bab6" stroke="#555" strokeWidth={0.6} />
        <path d="M-2.4 0H2.4" stroke="#2a2a2a" strokeWidth={1} transform="rotate(30)" />
      </g>

      {/* kontaktör bağlantı vidası */}
      <g id="sc">
        <circle r={7} fill="#232323" /><circle r={5.3} fill="#6a7e5f" /><circle r={3.2} fill="#55684b" />
        <path d="M-3.4 0H3.4M0-3.4V3.4" stroke="#1a1a1a" strokeWidth={1.3} transform="rotate(25)" />
      </g>

      {/* kontaktör gövdesi */}
      <g id="ct">
        <rect width={96} height={131} fill="#222225" />
        <rect x={7} y={8} width={82} height={107} fill="#f2f1ea" />
        <use href="#sc" x={17.3} y={25} /><use href="#sc" x={37.8} y={25} /><use href="#sc" x={58.3} y={25} /><use href="#sc" x={78.8} y={25} />
        <use href="#sc" x={17.3} y={96} /><use href="#sc" x={37.8} y={96} /><use href="#sc" x={58.3} y={96} /><use href="#sc" x={78.8} y={96} />
        <g fontFamily="Arial" fontSize={5.3} fontWeight={900} fill="#222" textAnchor="middle">
          <text x={17.3} y={16}>13NO</text><text x={37.8} y={16}>23NO</text><text x={58.3} y={16}>33NO</text><text x={78.8} y={16}>43NO</text>
          <text x={17.3} y={40}>51NC</text><text x={37.8} y={40}>61NC</text><text x={58.3} y={40}>71NC</text><text x={78.8} y={40}>81NC</text>
          <text x={17.3} y={87}>52NC</text><text x={37.8} y={87}>62NC</text><text x={58.3} y={87}>72NC</text><text x={78.8} y={87}>82NC</text>
          <text x={17.3} y={111}>14NO</text><text x={37.8} y={111}>24NO</text><text x={58.3} y={111}>34NO</text><text x={78.8} y={111}>44NO</text>
        </g>
        <rect x={10} y={49} width={9} height={20} rx={1.5} fill="#161616" />
        <rect x={12} y={51} width={5} height={7} fill="#3a3a3a" />
        <text x={23} y={61} fontFamily="Arial" fontSize={9.5} fontWeight={900} fill="#222">44E</text>
        <rect x={44} y={51} width={42} height={16} fill="#fcfcf8" stroke="#d6d4c8" />
        <text x={10} y={76} fontFamily="Arial" fontSize={6.5} fontWeight={900} fill="#222">3TH82</text>
        <use href="#sk" x={10} y={4} /><use href="#sk" x={10} y={123} /><use href="#sk" x={86} y={4} /><use href="#sk" x={86} y={123} />
      </g>

      {/* kontaktör tepsi baskısı (soket kullanımları Knob katmanında) */}
      <g id="col">
        <path className="aw" stroke="#111" strokeWidth={2} fill="none" d="M0 1258H47M73 1258H120M60 1278V1490M0 1288H44.5M120 1288H75.5M68.8 1289.4L45 1300M0 1318H44.5M120 1318H75.5M68.8 1319.4L45 1330M0 1348H44.5M120 1348H75.5M51.5 1348H68.5M0 1378H44.5M120 1378H75.5M51.5 1378H68.5M0 1408H44.5M120 1408H75.5M68.8 1409.4L45 1420M0 1438H44.5M120 1438H75.5M68.8 1439.4L45 1450M0 1468H44.5M120 1468H75.5M68.8 1469.4L45 1480" />
        <g className="aw" stroke="#111" strokeWidth={2} fill="none">
          {[1288, 1318, 1348, 1378, 1408, 1438, 1468].map((y) => (
            <g key={y}>
              <circle cx={48} cy={y} r={3.5} /><circle cx={72} cy={y} r={3.5} />
            </g>
          ))}
        </g>
        <rect className="aw" x={47} y={1244} width={26} height={34} stroke="#111" strokeWidth={2} fill="none" />
        <path className="aw" stroke="#111" strokeWidth={2} fill="none" d="M47 1276L73 1246" />
        <rect className="aw" x={25} y={1395} width={70} height={95} stroke="#111" strokeWidth={2} fill="none" />
      </g>

      {/* d1 mini terminal */}
      <g id="ts">
        <circle r={3.7} fill="#2b2b2b" /><circle r={3} fill="#a9aaa8" />
        <path d="M-2.4 0H2.4" stroke="#222" strokeWidth={1} transform="rotate(-35)" />
      </g>

      {/* SPDT kontak baskısı */}
      <g id="cp">
        <path className="aw" stroke="#111" strokeWidth={1.8} fill="none" d="M-66 0V24H-24.8M66 0V24H24.8M0 0V21.2M-2.5 25.2L-19 33M-19 33L-21.1 26.7M19.6 25.4L6 33" />
        <g className="aw" stroke="#111" strokeWidth={1.8} fill="none">
          <circle cx={-22} cy={24} r={2.8} /><circle cx={0} cy={24} r={2.8} /><circle cx={22} cy={24} r={2.8} />
        </g>
      </g>
      <g id="cq">
        <path className="aw" stroke="#111" strokeWidth={1.8} fill="none" d="M-59 0V24H-24.8M59 0V24H24.8M0 0V21.2M-2.5 25.2L-19 33M-19 33L-21.1 26.7M19.6 25.4L6 33" />
        <g className="aw" stroke="#111" strokeWidth={1.8} fill="none">
          <circle cx={-22} cy={24} r={2.8} /><circle cx={0} cy={24} r={2.8} /><circle cx={22} cy={24} r={2.8} />
        </g>
      </g>

      <g id="ts2">
        <circle r={5.4} fill="#3b3b3d" stroke="#222" strokeWidth={0.8} /><circle r={4} fill="#5a5a5d" />
        <path d="M-3.2 0H3.2" stroke="#1a1a1a" strokeWidth={1.3} transform="rotate(30)" />
      </g>
    </defs>
  );
}

/* ================================================================
   soket (düğ) çizimi — interaktif katman
   ================================================================ */

interface KnobProps { s: SocketDef; selected?: boolean; ring?: boolean; snapP?: boolean; }

function Knob({ s, selected, ring, snapP }: KnobProps) {
  const r = s.r ?? G.R_KNOB;
  // güç yakalama: hedef çevresinde geniş görünmez vurma alanı — imleç yakınsa
  // uzaktan tık da uca düşer (snap)
  return (
    <g className={'term' + (snapP ? ' snap' : '')} onClick={(e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      // hareket modunda soket tıkı uç alır/bırakır; kablo modunda çekim yapar
      A.socketTap(s.id, e.shiftKey);
    }}>
      {snapP && <circle cx={s.x} cy={s.y} r={r + 22} fill="transparent" pointerEvents="all" />}
      <circle cx={s.x} cy={s.y} r={r + 3.5} fill="transparent" />
      {/* metal somun gölgesi */}
      <ellipse cx={s.x} cy={s.y + 1.8} rx={r + 1.2} ry={r - 0.4} fill="rgba(0,0,0,0.28)" />
      <circle cx={s.x} cy={s.y - 1} r={r + 1.8} fill="#8c8f93" />
      <circle cx={s.x} cy={s.y} r={r} fill={s.color} stroke="#100f12" strokeWidth={1.6} />
      <circle cx={s.x} cy={s.y} r={r * 0.6} fill="none" stroke="#0c0c10" strokeOpacity={0.6} strokeWidth={1.1} />
      <circle cx={s.x} cy={s.y} r={2.6} fill={selected ? '#6b5113' : '#101014'} />
      {selected && <circle cx={s.x} cy={s.y} r={r + 5} fill="none" stroke="#8a6d1f" strokeWidth={2.4} />}
      {ring && !selected && <circle cx={s.x} cy={s.y} r={r + 6.5} fill="none" className="endRing" />}
      {snapP && <circle cx={s.x} cy={s.y} r={r + 10} fill="none" className="snapRing" />}
      <title>{G.socketTitle(s.id)}{snapP ? ' — yakalandı' : ''}</title>
    </g>
  );
}

/* ================================================================
   kablo katmanı — istiflenen yuvarlak kablolar
   Sarkma mağazadan sürekli sag (0..100) gelir:
   0   → iki uç arasında düz hat (paralel ofsetli, eski 'düz')
   ~35 → hafif sarkma (eski 'yumuşak')
   100 → gerçek kart görseli, birebir eski 'asılı' yolu (varsayılan)
   Tüm uçlar (buton yuvaları dahil) aynı doğal eğriyi kullanır: dik saplama yok.
   ================================================================ */

function cablePath(
  aId: string, bId: string, ia: number, ib: number,
  sag = 100,
  aPos?: { x: number; y: number }, bPos?: { x: number; y: number },
): string {
  const A0 = aPos ?? G.socketPos(aId), B0 = bPos ?? G.socketPos(bId);
  const t = Math.min(1, Math.max(0, sag / 100));
  const dx = B0.x - A0.x, dy = B0.y - A0.y;
  const dist = Math.hypot(dx, dy) || 1;
  const perp = (ia + ib) * 2.6 * (1 - t);
  // sarkma yerçekimlidir: çukur derinliği düşey açıklım (|dx|) ile ölçeklenir —
  // kısa DİKEY bağlantılar artık derin U çizmez, yatay koşular "asılı" sarkar.
  // Q kontrol noktası kirişin ORTASINA konur: eğri uçların üstüne hiç çıkamaz
  // (konveks örtü) → rocketer/aşırı salınım şekli imkânsız.
  const dip = t * Math.min(96, Math.max(0, Math.abs(dx)) * 0.38) + Math.max(ia, ib) * 9 * t;

  if (t < 0.02) {
    // istif çakışmasını önlemek için yöne dik küçük ofset
    const ux = dx / dist, uy = dy / dist;
    return `M ${A0.x + uy * perp} ${A0.y - ux * perp} L ${B0.x + uy * perp} ${B0.y - ux * perp}`;
  }
  const cx = (A0.x + B0.x) / 2;
  const cy = (A0.y + B0.y) / 2 + dip;
  return `M ${A0.x} ${A0.y} Q ${cx} ${cy} ${B0.x} ${B0.y}`;
}

/** Cables'ın imperative arayüzü — pointermove'da React render OLMADAN
 *  taslak/taşıma yollarını günceller (N4: "kablo çekerken takılıyor") */
export interface CablesApi {
  update: (p: { x: number; y: number }) => void;
}

function Cables({ cables, sag, focusId, selId, carry, draft, onHover, apiRef }: {
  cables: Cable[];
  sag: number;
  focusId: string | null;
  selId: string | null;
  carry: Carry | null;
  /** kablo modunda yeni kablo önizlemesi: seçili soketten imlece */
  draft: { from: string; snap: string | null; color: string; güç: boolean } | null;
  onHover: (id: string | null) => void;
  apiRef: RefObject<CablesApi | null>;
}) {
  const counts = new Map<string, number>();

  // --- imperative üst katman (N4) ---
  const carryGRef = useRef<SVGGElement | null>(null);
  const draftGRef = useRef<SVGGElement | null>(null);
  const carryGeo = useRef<((p: { x: number; y: number }) => string) | null>(null);
  const draftGhost = useRef<((p: { x: number; y: number }) => string) | null>(null);
  const draftReal = useRef('');

  // seçili soketten imlece kılavuz çizgi + çekim varken gerçek yol
  if (draft) {
    const A0 = G.socketPos(draft.from);
    draftGhost.current = (p) => `M ${A0.x} ${A0.y} Q ${(A0.x + p.x) / 2} ${Math.max(A0.y, p.y) + 40} ${p.x} ${p.y}`;
    draftReal.current = draft.snap
      ? cablePath(draft.from, draft.snap, 0, 0, sag, undefined, G.socketPos(draft.snap))
      : '';
  } else {
    draftGhost.current = null;
    draftReal.current = '';
  }

  /** görünmez vurma kopyası — hover'lı elemanı yeniden mound etmeden
   *  hover'ı sabit tutar (üst kopya görseli taşır, pointer olayı burada) */
  const ghost = (w: Cable, d: string, sel: boolean): ReactNode => (
    <g className={'cable ghost' + (sel ? ' sel' : '') + (focusId === w.id ? ' hov' : '')}
      onPointerEnter={() => onHover(w.id)}
      onPointerLeave={() => onHover(null)}
      onClick={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const svg = e.currentTarget.ownerSVGElement;
        const ct = svg?.getScreenCTM();
        const pt = ct ? (() => {
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ct.inverse());
          return { x: p.x, y: p.y };
        })() : undefined;
        A.clickCable(w.id, pt);
      }}>
      <path d={d} stroke="transparent" strokeWidth={15} fill="none" />
      <title>{G.socketTitle(w.a)} ⇄ {G.socketTitle(w.b)}{w.güç ? ' — TTR güç' : ''}</title>
    </g>
  );

  const visual = (w: Cable, d: string, sel: boolean, cls: string): ReactNode => (
    <g className={'cable ' + cls + (sel ? ' sel' : '') + (focusId === w.id ? ' hov' : '')}>
      <path className="cLine" d={d} stroke={shade(w.color, -0.55)} strokeWidth={w.güç ? 8.6 : 6.6} fill="none" strokeLinecap="round" />
      <path className="cCore" d={d} stroke={w.color} strokeWidth={w.güç ? 6.0 : 4.4} fill="none" strokeLinecap="round" />
      {w.güç && <path className="cPwr" d={d} stroke="rgba(255,255,255,0.42)" strokeWidth={1.15} fill="none" strokeLinecap="round" strokeDasharray="8 6" />}
      <path className="cGlint" d={d} stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {sel && <path className="cSel" d={d} stroke="#8a6d1f" strokeWidth={11.5} fill="none" strokeLinecap="round" opacity={0.35} />}
      <title>{G.socketTitle(w.a)} ⇄ {G.socketTitle(w.b)}{w.güç ? ' — TTR güç' : ''}</title>
    </g>
  );

  // uç vurgusu (vurgula açıkken): hovered/seçili kablonun GÖRSELİ en üst
  // katmanda çizilir; yerinde yalnız görünmez vurma kopyası kalır —
  // böylece hover'da eleman taşınmaz, olay döngüsü oluşmaz (R7 #4)
  const main: ReactNode[] = [];
  let top: ReactNode = null;
  let carryW: Cable | undefined;
  cables.forEach((w) => {
    const ia = counts.get(w.a) ?? 0; counts.set(w.a, ia + 1);
    const ib = counts.get(w.b) ?? 0; counts.set(w.b, ib + 1);
    // taşınan kablo ana katmanda ÇİZİLMEZ (uç elde) — üst katmanda imleci
    // imperative izler. İstif sayacı yine de artar: diğer kablolar kaymasın.
    if (carry && w.id === carry.cableId) {
      carryW = w;
      carryGeo.current = carry.end === 'a'
        ? (p) => cablePath('', w.b, 0, ib, sag, p, undefined)
        : (p) => cablePath(w.a, '', ia, 0, sag, undefined, p);
      return;
    }
    const d = cablePath(w.a, w.b, ia, ib, sag);
    const sel = selId === w.id;
    if (focusId && w.id === focusId) {
      main.push(<Fragment key={`g${w.id}`}>{ghost(w, d, sel)}</Fragment>);
      top = visual(w, d, sel, 'topCable');
    } else {
      main.push(
        <g key={w.id} className={'cable' + (sel ? ' sel' : '')}
          onPointerEnter={() => onHover(w.id)}
          onPointerLeave={() => onHover(null)}
          onClick={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            const svg = e.currentTarget.ownerSVGElement;
            const ct = svg?.getScreenCTM();
            const pt = ct ? (() => {
              const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ct.inverse());
              return { x: p.x, y: p.y };
            })() : undefined;
            A.clickCable(w.id, pt);
          }}>
          <path d={d} stroke="transparent" strokeWidth={15} fill="none" />
          <path className="cLine" d={d} stroke={shade(w.color, -0.55)} strokeWidth={w.güç ? 8.6 : 6.6} fill="none" strokeLinecap="round" />
          <path className="cCore" d={d} stroke={w.color} strokeWidth={w.güç ? 6.0 : 4.4} fill="none" strokeLinecap="round" />
          {w.güç && <path className="cPwr" d={d} stroke="rgba(255,255,255,0.42)" strokeWidth={1.15} fill="none" strokeLinecap="round" strokeDasharray="8 6" />}
          <path className="cGlint" d={d} stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          {sel && <path className="cSel" d={d} stroke="#8a6d1f" strokeWidth={11.5} fill="none" strokeLinecap="round" opacity={0.35} />}
          <title>{G.socketTitle(w.a)} ⇄ {G.socketTitle(w.b)}{w.güç ? ' — TTR güç' : ''}</title>
        </g>,
      );
    }
  });
  if (!carry) carryGeo.current = null;

  // pointermove'da çağrılır: yolları imperative yazar, React render tetiklemez
  useEffect(() => {
    apiRef.current = {
      update(p) {
        const cg = carryGRef.current;
        if (cg) {
          const d = carryGeo.current ? carryGeo.current(p) : '';
          for (let i = 0; i < cg.children.length; i++) {
            const el = cg.children[i];
            if (el instanceof SVGPathElement) el.setAttribute('d', d);
          }
        }
        const dg = draftGRef.current;
        if (dg) {
          const kids = dg.children;
          if (kids[0] instanceof SVGPathElement && draftGhost.current) kids[0].setAttribute('d', draftGhost.current(p));
          if (kids[1] instanceof SVGPathElement) kids[1].setAttribute('d', draftReal.current);
        }
      },
    };
  });

  return (
    <>
      <g className={'cables' + (focusId ? ' focus' : '')}>{main}</g>
      <g className="cablesTop" pointerEvents="none">
        {top}
        {/* taşıma görseli: uç eldeyken sabit soketten imlece (imperative) */}
        <g ref={carryGRef} className="cable topCable" style={{ display: carryW ? undefined : 'none' }}>
          <path className="cLine" d="" stroke={carryW ? shade(carryW.color, -0.55) : '#000'} strokeWidth={carryW?.güç ? 8.6 : 6.6} fill="none" strokeLinecap="round" />
          <path className="cCore" d="" stroke={carryW?.color ?? '#000'} strokeWidth={carryW?.güç ? 6.0 : 4.4} fill="none" strokeLinecap="round" />
          {carryW?.güç && <path className="cPwr" d="" stroke="rgba(255,255,255,0.42)" strokeWidth={1.15} fill="none" strokeLinecap="round" strokeDasharray="8 6" />}
          <path className="cGlint" d="" stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </g>
        {/* taslak önizleme: seçili soketten imlece kılavuz + çekim yolu */}
        <g ref={draftGRef} style={{ display: draft ? undefined : 'none' }}>
          <path d="" stroke={draft?.color ?? '#000'} strokeWidth={2} strokeDasharray="4 6" fill="none" strokeLinecap="round" opacity={0.3} />
          <path d="" stroke={draft?.color ?? '#000'} strokeWidth={draft?.güç ? 5.6 : 4} strokeDasharray="9 7" fill="none" strokeLinecap="round" opacity={0.9} />
        </g>
      </g>
    </>
  );
}

/* ================================================================
   durumlu cihaz katmanları (sanat + sim)
   ================================================================ */

/** 5 CNC lamba — sanat #lp sembolü; sönük lens koyu, yanınca hale + tam renk */
function LampsArt({ sim }: { sim: SimOutput | null }) {
  return (
    <g>
      {G.LAMPS.map((l) => {
        const on = sim?.lamps[l.key] === true;
        const c = on ? l.color : shade(l.color, -0.52);
        return (
          <g key={l.key}>
            {on && <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 8} fill={l.color} opacity={0.3} />}
            <use href="#lp" x={l.x} y={G.LAMP_Y} color={c} />
          </g>
        );
      })}
    </g>
  );
}

/** Kesici: sanat muhafaza + beyaz kolonlar; kollar F3 (3P) / F1 (1P) durumuna göre */
function BreakerArt({ breakers }: { breakers: BreakerState }) {
  const B = G.BREAKER;
  const pole = (i: number, on: boolean) => {
    const x = B.colX[i];
    const y = on ? B.yOn : B.yOff;
    return (
      <g key={i}>
        <rect x={x} y={B.colY} width={B.colW} height={B.colH} fill="#dededa" stroke="#b3b3ad" />
        <rect x={x + 5} y={B.colY + 3} width={14} height={7} fill="#fafaf7" stroke="#aaa" />
        <path d={`M ${x + 6} ${B.colY + 29} H ${x + 18} M ${x + 6} ${B.colY + 35} H ${x + 18}`} stroke="#34343a" />
        <rect x={x + B.leverInset} y={y} width={B.leverW} height={B.leverH} rx={2} fill="#17171a" />
        <rect x={x + B.leverInset} y={y} width={B.leverW} height={6} rx={2} fill="#3c3c40" />
      </g>
    );
  };
  return (
    <g>
      <circle cx={146} cy={591} r={3} fill="#444" />
      <circle cx={302} cy={591} r={3} fill="#444" />
      <rect x={B.housing.x} y={B.housing.y} width={B.housing.w} height={B.housing.h} fill="#25252a" />
      <rect x={B.inner.x} y={B.inner.y} width={B.inner.w} height={B.inner.h} fill="#ecece8" />
      {[0, 1, 2].map((i) => pole(i, breakers.motor))}
      {pole(3, breakers.control)}
      {/* F3 ortak terminal barı + alt şerit (sanat) */}
      <rect x={176.5} y={611} width={69} height={8} rx={1.5} fill="#17171a" />
      <rect x={168} y={623} width={112} height={6} fill="#cfcfca" />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); sfx.breaker(!breakers.motor); A.toggleBreaker('motor'); }}>
        <rect x={B.colX[0]} y={B.colY} width={76} height={B.colH} fill="transparent" />
        <title>F3 — motor sigortası (3P)</title>
      </g>
      <g className="clickable" onClick={(e) => { e.stopPropagation(); sfx.breaker(!breakers.control); A.toggleBreaker('control'); }}>
        <rect x={B.colX[3]} y={B.colY} width={B.colW} height={B.colH} fill="transparent" />
        <title>F1 — kumanda sigortası (1P)</title>
      </g>
    </g>
  );
}

/** itici butonlar b1-b4 — sanat köprü baskısı + kafa; basınca kafa küçülür */
function ButtonsArt({ pressed }: { pressed: { b1: boolean; b2: boolean; b3: boolean; b4: boolean } }) {
  return (
    <g>
      {G.BUTTONS.map((b) => {
        const on = pressed[b.id as 'b1'];
        return (
          <g key={b.id}>
            <use href="#bs" y={b.y} />
            <g className="t" style={{ fontSize: 24 }}>
              <text x={G.BTN_POS.label} y={b.y + 8} textAnchor="middle">{b.id}</text>
            </g>
            <g className={on ? 'btn pressed' : 'btn'}>
              <g className="bhit"
                onPointerDown={(e) => { e.stopPropagation(); sfx.button(true); A.pressButton(b.id as 'b1'); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sentetik olay */ } }}
                onPointerUp={(e) => { e.stopPropagation(); sfx.button(false); A.releaseButton(b.id as 'b1'); }}
                onPointerCancel={() => A.releaseButton(b.id as 'b1')}
                onClick={(e) => e.stopPropagation()}
              >
                <use href="#bt" transform={`translate(${G.BTN_POS.cap} ${b.y}) scale(${on ? 0.78 : 0.9})`} color={b.color} />
                <circle cx={G.BTN_POS.cap} cy={b.y} r={30} fill="transparent" />
                <title>{b.id.toUpperCase()} — bas-tut</title>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** e (termik röle) ünitesi — sanat gövde; kırmızı Test düğmesi tıklanır (sıfırla) */
function EArt({ armed }: { armed: boolean }) {
  const tripped = !armed;
  return (
    <g transform="translate(440 712)" fontFamily="Arial" fontWeight={900} fill="#222">
      <rect width={80} height={136} rx={3} fill="#1d1d20" />
      <rect x={3} y={20} width={74} height={63} rx={1.5} fill="#eeeeea" />
      <rect x={3} y={9} width={30} height={14} fill="#f4f4f0" />
      <circle cx={14.5} cy={16} r={5.2} fill="#c3c5c2" stroke="#6e706c" strokeWidth={0.8} />
      <path d="M11 16H18" stroke="#444" strokeWidth={1.2} transform="rotate(-30 14.5 16)" />
      <text x={23} y={18.5} textAnchor="start" fontSize={4.6}>A2</text>
      <use href="#ts2" x={46} y={35} /><use href="#ts2" x={65.5} y={35} />
      <use href="#ts2" x={46} y={66} /><use href="#ts2" x={65.5} y={66} />
      <text x={56.4} y={31} textAnchor="middle" fontSize={3.6}>95</text>
      <text x={56.4} y={36.8} textAnchor="middle" fontSize={3.6}>NC</text>
      <text x={74} y={31} textAnchor="middle" fontSize={3.6}>97</text>
      <text x={74} y={36.8} textAnchor="middle" fontSize={3.6}>NO</text>
      <text x={56.4} y={63} textAnchor="middle" fontSize={3.6}>NC</text>
      <text x={56.4} y={69} textAnchor="middle" fontSize={3.6}>96</text>
      <text x={74} y={63} textAnchor="middle" fontSize={3.6}>NO</text>
      <text x={74} y={69} textAnchor="middle" fontSize={3.6}>98</text>
      <text x={39.5} y={45.5} textAnchor="end" fontSize={3.6}>Test</text>
      <g className="clickable" onClick={(e) => { e.stopPropagation(); sfx.button(true); A.termikArm(); }}>
        <rect x={36} y={43} width={20} height={19} fill="transparent" />
        <rect x={41} y={47} width={11.5} height={11.5} fill={tripped ? '#5f1210' : '#d1161d'} />
        <title>Termik sıfırla (e.tc kapatır)</title>
      </g>
      <circle cx={25} cy={62} r={13} fill="#131315" stroke="#3c3c3f" />
      <circle cx={25} cy={62} r={9.5} fill="none" stroke="#2a2a2c" />
      <circle cx={25} cy={62} r={4.2} fill="#2d2d30" />
      <path d="M21.5 62H28.5" stroke="#aaa" strokeWidth={1.2} transform="rotate(-35 25 62)" />
      <g fill="#ddd">
        <text x={31} y={54} textAnchor="middle" fontSize={3}>3</text>
        <text x={35.5} y={60} textAnchor="middle" fontSize={3}>6</text>
      </g>
      <circle cx={68.2} cy={53.5} r={6.8} fill="#2c63d8" stroke="#1a3f94" />
      <path d="M-3.5 0H3.5" stroke="#102a66" strokeWidth={1.3} transform="translate(68.2 53.5) rotate(-40)" />
      <circle cx={75.5} cy={46.5} r={1.4} fill="#2fbf57" />
      <text x={15} y={79} textAnchor="middle" fontSize={3.8}>2 T1</text>
      <text x={40} y={79} textAnchor="middle" fontSize={3.8}>4 T2</text>
      <text x={65} y={79} textAnchor="middle" fontSize={3.8}>6 T3</text>
      <g fill="#08080a">
        <circle cx={15} cy={112} r={7} /><circle cx={40} cy={112} r={7} /><circle cx={65} cy={112} r={7} />
      </g>
      <g fill="#85a050" stroke="#4f6330" strokeWidth={0.8}>
        <circle cx={15} cy={112} r={5} /><circle cx={40} cy={112} r={5} /><circle cx={65} cy={112} r={5} />
      </g>
      <path d="M11.5 112H18.5" stroke="#2b3a14" strokeWidth={1.3} transform="rotate(-25 15 112)" />
      <path d="M36.5 112H43.5" stroke="#2b3a14" strokeWidth={1.3} transform="rotate(-25 40 112)" />
      <path d="M61.5 112H68.5" stroke="#2b3a14" strokeWidth={1.3} transform="rotate(-25 65 112)" />
    </g>
  );
}

/** e tepsi baskıları (sanat, soket ululleri stripsiz) */
function ETrayArt(): ReactNode {
  return (
    <g>
      <path className="aw" d="M418 896H462.5M495.5 896H540M488.8 897.3L468 906M418 925H462.5M469.5 925H488.5M495.5 925H540M418 955H448.5M455.5 955H462V960H496V955H502.5M509.5 955H540M418 988H448.5M455.5 988H462V993H496V988H502.5M509.5 988H540M418 1021H448.5M455.5 1021H462V1026H496V1021H502.5M509.5 1021H540" />
      <g className="aw">
        <circle cx={466} cy={896} r={3.5} /><circle cx={492} cy={896} r={3.5} />
        <circle cx={466} cy={925} r={3.5} /><circle cx={492} cy={925} r={3.5} />
        <circle cx={452} cy={955} r={3.5} /><circle cx={506} cy={955} r={3.5} />
        <circle cx={452} cy={988} r={3.5} /><circle cx={506} cy={988} r={3.5} />
        <circle cx={452} cy={1021} r={3.5} /><circle cx={506} cy={1021} r={3.5} />
      </g>
      <rect className="aw" x={440} y={943} width={78} height={91} />
      <path className="aw" strokeDasharray="3 3" d="M479 901.4V943" />
    </g>
  );
}

/** d1 (takma röle) gövdesi — sanat */
function D1Art(): ReactNode {
  return (
    <g transform="translate(654 712)" fontFamily="Arial" fontWeight={900} fill="#222">
      <rect width={45} height={136} rx={2.5} fill="#dcdcd8" stroke="#9a9a96" />
      <rect x={2} y={2} width={41} height={13} rx={1.5} fill="#cfcfca" />
      <use href="#ts" x={8.5} y={8.5} /><use href="#ts" x={22.5} y={8.5} /><use href="#ts" x={36.5} y={8.5} />
      <text x={22.5} y={25} textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif" fontSize={6.2} textLength={38} lengthAdjust="spacingAndGlyphs" fill="#111">SIEMENS</text>
      <text x={4} y={30.5} textAnchor="start" fontSize={3.2}>SIMIREL</text>
      <rect x={3} y={43} width={3.5} height={5} fill="#222" /><rect x={3} y={51} width={3.5} height={5} fill="#222" />
      <circle cx={24} cy={50} r={11} fill="#141416" stroke="#3a3a3c" />
      <circle cx={24} cy={50} r={6} fill="#262628" />
      <path d="M24 50V41.5" stroke="#eee" strokeWidth={1.3} />
      <g fontSize={3.2}>
        <text x={16} y={36} textAnchor="middle" fontSize={3.2}>12</text>
        <text x={32} y={36} textAnchor="middle" fontSize={3.2}>18</text>
        <text x={39.5} y={46} textAnchor="middle" fontSize={3.2}>24</text>
        <text x={40} y={58} textAnchor="middle" fontSize={3.2}>30s</text>
        <text x={9} y={42} textAnchor="middle" fontSize={3.2}>6</text>
        <text x={8} y={52} textAnchor="middle" fontSize={3.2}>3</text>
        <text x={11} y={63} textAnchor="middle" fontSize={3.2}>1.5</text>
      </g>
      <g transform="translate(0 11)">
        <g fill="none" stroke="#333" strokeWidth={0.6}>
          <rect x={6} y={73} width={7} height={4} />
          <path d="M9.5 70V73M9.5 77V80M20 72V80M20 80L27 73M27 80V72" />
        </g>
        <rect x={4} y={91} width={37} height={12} fill="#f3f3f0" stroke="#bbb" />
        <text x={22.5} y={98} textAnchor="middle" fontSize={3}>3RP1512-1AP30</text>
        <text x={8.5} y={110} textAnchor="middle" fontSize={2.8}>15</text>
        <text x={22.5} y={110} textAnchor="middle" fontSize={2.8}>16</text>
        <text x={36.5} y={110} textAnchor="middle" fontSize={2.8}>18</text>
        <use href="#ts" x={8.5} y={116} /><use href="#ts" x={22.5} y={116} /><use href="#ts" x={36.5} y={116} />
      </g>
    </g>
  );
}

/* ---------------- d2 ekranı — canlı 7 segment ---------------- */

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

function SegDigit({ ch, ox, oy, s, lit, dim }: { ch: string; ox: number; oy: number; s: number; lit: string; dim: string }) {
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
        <rect key={k} x={x + 3} y={y} width={bw} height={bh} fill={seg.includes(k) ? lit : dim} stroke="none" />
      ))}
    </g>
  );
}

/** h= rakam yüksekliği; boxW verilirse kutuya ortalanır */
function SegDisplay({ x, y, h, value, boxW, lit, dim }: { x: number; y: number; h: number; value: string; boxW?: number; lit: string; dim: string }) {
  const s = h * 0.86;
  const digitW = s * 0.62 + 1.5;
  let cx0 = x;
  if (boxW != null) {
    let total = 0;
    for (const ch of value) total += ch === '.' ? 4.5 : digitW;
    cx0 = x + Math.max(0, (boxW - total) / 2);
  }
  let cx = cx0;
  const nodes: ReactNode[] = [];
  for (const ch of value) {
    if (ch === '.') {
      nodes.push(<circle key={`dot-${cx}`} cx={cx + 2.5} cy={y + h - 2.5} r={1.5} fill={lit} />);
      cx += 4.5;
    } else {
      nodes.push(<SegDigit key={`d-${cx}`} ch={ch} ox={cx} oy={y} s={s} lit={lit} dim={dim} />);
      cx += digitW;
    }
  }
  return <g>{nodes}</g>;
}

/** d2 (zaman rölesi ZR) gövdesi — sanat; LCD canlı saniye gösterir */
function D2Art({ sim }: { sim: SimOutput | null }) {
  const sec = sim ? sim.dev.zr.elapsed / 1000 : 0;
  const value = sec.toFixed(1);
  return (
    <g>
      <g transform="translate(836 712)">
        <rect x={28} y={-3} width={20} height={4} rx={1} fill="#222" />
        <rect width={76} height={136} rx={3} fill="#eeeeea" stroke="#9c9c98" />
        <rect y={33} width={76} height={14} fill="#f5f5f2" stroke="#b9b9b5" />
        <use href="#ts" x={15.6} y={24} /><use href="#ts" x={24.6} y={24} /><use href="#ts" x={33.5} y={24} />
        <use href="#ts" x={42.5} y={24} /><use href="#ts" x={51.4} y={24} /><use href="#ts" x={60.4} y={24} />
        <use href="#ts" x={15.6} y={126} /><use href="#ts" x={24.6} y={126} /><use href="#ts" x={33.5} y={126} />
        <use href="#ts" x={42.5} y={126} /><use href="#ts" x={51.4} y={126} /><use href="#ts" x={60.4} y={126} />
        <g fontFamily="Arial" fontSize={4.2} fontWeight={900} fill="#555" textAnchor="middle">
          <text x={15.6} y={18}>L1</text><text x={24.6} y={18}>Gnd</text><text x={33.5} y={18}>N</text>
          <text x={42.5} y={18}>Gnd</text><text x={51.4} y={18}>S</text><text x={60.4} y={18}>+12</text>
          <text x={15.6} y={134.5}>18</text><text x={24.6} y={134.5}>15</text><text x={33.5} y={134.5}>16</text>
          <text x={42.5} y={134.5}>28</text><text x={51.4} y={134.5}>25</text><text x={60.4} y={134.5}>26</text>
        </g>
        <rect x={8} y={48} width={60} height={70} fill="#f3f3f0" stroke="#111" strokeWidth={1.8} />
        {[14.0, 20.9, 27.8, 34.7, 41.6, 48.5, 55.4, 62.3].map((x) => (
          <circle key={x} cx={x} cy={54.5} r={2.1} fill="#b8301f" stroke="#6b1a10" strokeWidth={0.4} />
        ))}
        <g fontFamily="Arial" fontSize={3.1} fontWeight={900} fill="#333" textAnchor="middle">
          <text x={14.0} y={61.8}>min</text><text x={20.9} y={61.8}>sec</text><text x={27.8} y={61.8}>set</text>
          <text x={34.7} y={61.8}>t</text><text x={41.6} y={61.8}>t2</text><text x={48.5} y={61.8}>S</text>
          <text x={55.4} y={61.8}>1</text><text x={62.3} y={61.8}>2</text>
        </g>
        <rect x={12} y={64.5} width={52} height={16.5} fill="#7d1a12" stroke="#2b0a06" strokeWidth={0.6} />
        <text x={13} y={88.5} fontFamily="Arial" fontSize={4} fontWeight={900} fill="#333">prg no.</text>
        <rect x={13} y={91} width={8} height={8} rx={1} fill="#4a4b4d" />
        <path d="M25 98H31L28 92Z" fill="#5b7d90" />
        <rect x={13} y={102.5} width={8} height={8} rx={1} fill="#4a4b4d" />
        <path d="M25 104H31L28 109.5Z" fill="#5b7d90" />
        <rect x={33} y={102.5} width={8} height={8} rx={1} fill="#4a4b4d" />
        <path d="M52 102L58.5 106.5L52 111L45.5 106.5Z" fill="none" stroke="#222" strokeWidth={0.8} />
        <text x={51.5} y={107.7} textAnchor="middle" fontFamily="Arial" fontSize={3} fontWeight={900} fill="#222">SET</text>
        <rect x={9} y={112} width={58} height={5} fill="#5c7b8d" />
        <text x={11} y={115.6} fontFamily="Arial" fontSize={3} fontWeight={900} fill="#fff">Ke-ZRXX (D)</text>
        <text x={65.5} y={115.7} textAnchor="end" fontFamily="serif" fontSize={3.6} fontWeight={900} fill="#fff">KAEL</text>
      </g>
      {/* canlı süre — dark red LCD (sanattaki sabit "0060" yerine) */}
      <SegDisplay x={G.D2_UNIT.lcd.x} y={G.D2_UNIT.lcd.y + 1.2} h={G.D2_UNIT.lcd.h - 2.8}
        value={value} boxW={G.D2_UNIT.lcd.w} lit="#ff3a1c" dim="rgba(255,58,28,0.12)" />
    </g>
  );
}

/** d2 tepsi baskıları (sanat: ⊤ satır + ZR kutusundan geçen bobin sırası + 2 kontak) */
function D2TrayArt(): ReactNode {
  return (
    <g>
      <path className="aw" d="M808 896H940M808 925H863M885 925H940" />
      <rect className="aw" x={863} y={901} width={22} height={32} />
      <path className="aw" d="M863 917H885" />
      <text x={874} y={928.6} textAnchor="middle" fontFamily="Arial" fontSize={9} fontWeight={900}>ZR</text>
      <use href="#cp" x={874} y={988} />
      <use href="#cp" x={874} y={1048} />
    </g>
  );
}

/** kontaktörler: gövde + etiket + tepsi + bobinin enerji yüzü (IN / 0) */
function ContactorsArt({ sim }: { sim: SimOutput | null }) {
  return (
    <g>
      {G.CONTACTORS.map((k) => <use key={k.id} href="#ct" transform={`translate(${k.use} 1103)`} />)}
      <g className="t" style={{ fontSize: 24 }}>
        {G.CONTACTORS.map((k) => (
          <text key={`l${k.id}`} x={k.labelX} y={1230}>{k.id.toUpperCase()}</text>
        ))}
      </g>
      {G.CONTACTORS.map((k) => <use key={`col${k.id}`} href="#col" x={k.trayL} />)}
      {G.CONTACTORS.map((k) => {
        const on = sim?.dev.contactors[k.id as 'c1'] === true;
        return (
          <text key={`io${k.id}`} x={k.use + 65} y={1103 + 63} textAnchor="middle"
            fontFamily="Arial" fontSize={9.5} fontWeight={900} fill="#222">{on ? 'IN' : '0'}</text>
        );
      })}
    </g>
  );
}

/** d1 tepsi baskıları (sanat: X'li dik bobin çerçevesi + SPDT kontak) */
function D1TrayArt(): ReactNode {
  return (
    <g>
      <rect className="aw" x={665} y={901} width={22} height={32} />
      <path className="aw" d="M665 917H687M665 917L687 933M687 917L665 933M617 925H665M687 925H735" />
      <use href="#cq" x={676} y={988} />
    </g>
  );
}

/* ================================================================
   harici sinyal lambası (pano dışında) — öğrenci kabloları besler
   ================================================================ */

function ExtLamp({ sim }: { sim: SimOutput | null }) {
  const E = G.EXT_LAMP;
  const ext = sim?.ext;
  return (
    <g>
      <rect x={E.housing.x} y={E.housing.y} width={E.housing.w} height={E.housing.h} rx={10} fill="#23241f" stroke="#0f0f0d" strokeWidth={2} />
      <text x={E.housing.x + E.housing.w / 2} y={E.housing.y + 16} textAnchor="middle" fontFamily="Arial, 'Segoe UI', sans-serif" fontSize={10.5} fontWeight={800} fill="#d8d5c8">SİNYAL LAMBASI</text>
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
      <text x={E.housing.x + 8} y={E.housing.y + E.housing.h - 6} fontFamily="Arial, 'Segoe UI', sans-serif" fontSize={9} fill="#8d8a7d">fuş: Y · R · G + toprak</text>
    </g>
  );
}

/* ================================================================
   ANA PANO
   ================================================================ */

interface Vb { x: number; y: number; w: number; h: number; }
const VB0: Vb = { x: 30, y: 378, w: 1240, h: 1180 };

export function Board() {
  const st = useStore();
  const sim = st.sim;
  const paket = st.paket;
  const estop = st.estop;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<Vb>(VB0);
  const [snapTgt, setSnapTgt] = useState<string | null>(null);
  const snapRef = useRef<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const cablesApi = useRef<CablesApi | null>(null);
  const drag = useRef<{ on: boolean; moved: boolean; px: number; py: number; vb: Vb } | null>(null);
  /** Dokunmatik: basılı işaretçiler — iki tanesi pinch yakınlaştırma başlatır */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mx: number; my: number; vb: Vb; anchor: { x: number; y: number }; cw: number; ch: number } | null>(null);
  /** Pinch sonrası tarayıcının sentetik tıkını yut (yanlışlıkla soket seçilmesin) */
  const suppressClick = useRef(false);

  /** İki parmak ölçeğini o anki viewBox'a göre yeniden kur */
  const pinchBaseline = () => {
    const svg = svgRef.current;
    const ct = svg?.getScreenCTM();
    const pts = [...pointers.current.values()];
    if (!svg || !ct || pts.length < 2) return;
    const [a, b] = pts;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const anchor = new DOMPoint(mx, my).matrixTransform(ct.inverse());
    pinch.current = {
      dist: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      mx, my,
      vb,
      anchor: { x: anchor.x, y: anchor.y },
      cw: svg.clientWidth || 1,
      ch: svg.clientHeight || 1,
    };
  };

  // seçim/çizim tipi değişince çekim hedefi bayatlar
  useEffect(() => { snapRef.current = null; setSnapTgt(null); }, [st.selTerminal, st.mode, st.settings.cableType]);

  /** TTR (güç) modunda: imlecin yakalayacağı en yakın güç uçu (snap hedefi) */
  const nearestPower = (p: { x: number; y: number }): string | null => {
    if (st.settings.cableType !== 'güç' || !st.selTerminal) return null;
    let best: string | null = null;
    let bd = 120;
    for (const t of G.TERMINALS) {
      if (!G.POWER_SOCKETS.has(t.id) || t.id === st.selTerminal) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bd) { bd = d; best = t.id; }
    }
    return best;
  };

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
        const w = Math.min(2400, Math.max(380, v.w * f));
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

  // uç vurgusu: hovered kablonun / seçili kablonun uçları
  const focusSel = hoverId ?? st.selCable;
  const focusCable = st.settings.vurgula ? st.cables.find((c) => c.id === focusSel) : undefined;
  const ringFocus = new Set<string>();
  if (focusCable) { ringFocus.add(focusCable.a); ringFocus.add(focusCable.b); }
  const pwDraft = st.settings.cableType === 'güç' && st.selTerminal !== null;
  const snapId = pwDraft ? snapTgt : null;

  return (
    <svg
      ref={svgRef}
      className={`boardSvg mode-${st.mode}${st.carry ? ' carrying' : ''}`}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDownCapture={(e) => {
        const wasEmpty = pointers.current.size === 0;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (wasEmpty) suppressClick.current = false;
        if (pointers.current.size === 2) {
          // İki parmak: tek parmak pan/çekimi bırak, pinch başlat. İkinci
          // parmağın altındaki düğme/soket kendi işleyicisini görmesin.
          drag.current = null;
          suppressClick.current = true;
          pinchBaseline();
          try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* sentetik olay */ }
          e.stopPropagation();
        }
      }}
      onPointerDown={(e) => {
        // pinch sürerken alt katman işleyicileri çalışmasın
        if (pinch.current) return;
        // orta tuş (buton 1): her yerden pan — hedef kablo/soket olsa da (R7 #9)
        if (e.button === 1) {
          e.preventDefault();
          drag.current = { on: true, moved: false, px: e.clientX, py: e.clientY, vb };
          try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* sentetik olay */ }
          return;
        }
        // uç eldeyken boş zemine sol tık = ucu geri koy (R7 #5). İnteraktif
        // sanatlara (soket/kablo/estop/şalter/kesici/buton) denk gelmeyen
        // her tık boş zemin sayılır; düşme sürükleme başlamadan olur
        if (st.carry && e.button === 0
          && !(e.target as Element).closest('.term, .cable, .clickable, .estop, .paketSel, .btn')) {
          A.dropCarry(null);
        }
        if (e.target !== svgRef.current) return;
        drag.current = { on: true, moved: false, px: e.clientX, py: e.clientY, vb };
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const pt = pointers.current.get(e.pointerId);
        if (pt) { pt.x = e.clientX; pt.y = e.clientY; }
        // İki parmak: mesafe = ölçek, orta nokta = kaydırma
        const pz = pinch.current;
        if (pz && pointers.current.size >= 2) {
          const [a, b] = [...pointers.current.values()];
          const dist = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
          const w = Math.min(2400, Math.max(380, pz.vb.w * (pz.dist / dist)));
          const h = w * (pz.vb.h / pz.vb.w);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const kx = pz.vb.w / pz.cw;
          const ky = pz.vb.h / pz.ch;
          setVb({
            x: pz.anchor.x - (pz.anchor.x - pz.vb.x) * (w / pz.vb.w) - (mx - pz.mx) * kx,
            y: pz.anchor.y - (pz.anchor.y - pz.vb.y) * (h / pz.vb.h) - (my - pz.my) * ky,
            w, h,
          });
          return;
        }
        const d = drag.current;
        if (d?.on) {
          const k = e.currentTarget.viewBox.baseVal;
          const dx = ((e.clientX - d.px) / e.currentTarget.clientWidth) * k.width;
          const dy = ((e.clientY - d.py) / e.currentTarget.clientHeight) * k.height;
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
          if (d.moved) setVb({ x: d.vb.x - dx, y: d.vb.y - dy, w: d.vb.w, h: d.vb.h });
        }
        if (st.carry || st.selTerminal) {
          const p = toLocal(e);
          if (p) {
            // sürekli konum imperative yazılır — her hareket için React
            // render YOK (N4: kablolama fare hareketini takip eder)
            cablesApi.current?.update(p);
            // güç çekimi: yalnız çekim HEDEFİ değişince render edilir
            if (st.selTerminal && st.settings.cableType === 'güç') {
              const np = nearestPower(p);
              if (np !== snapRef.current) { snapRef.current = np; setSnapTgt(np); }
            }
          }
        }
      }}
      onPointerUpCapture={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        else if (pinch.current) pinchBaseline();
      }}
      onPointerCancelCapture={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        else if (pinch.current) pinchBaseline();
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        // orta tuş panı tık sayılmaz; sol tık boşlukta seçimi bırakır
        // (uç bırakma pointerDown'da boş zemin tıkından gelir)
        if (d && !d.moved && e.button === 0) A.cancelSel();
      }}
      onClickCapture={(e) => {
        // pinch'ten arta kalan sentetik tık soket seçmesin
        if (suppressClick.current) {
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onAuxClick={(e) => e.preventDefault()}
    >
      <ArtDefs />

      {/* arka duvar */}
      <rect x={-400} y={-300} width={2200} height={2200} fill="#bccce9" />

      {/* gölge + çerçeve + yüzey */}
      <rect x={61} y={407} width={1042} height={1148} rx={6} fill="rgba(0,0,0,0.20)" />
      <rect x={55} y={397} width={75} height={1148} rx={6} fill="#1b1917" />
      <path d="M120 1380H155V1545H105V1500H120Z" fill="#1b1917" />
      <rect x={1000} y={402} width={97} height={1138} rx={6} fill="#1b1917" />
      <rect x={118} y={402} width={904} height={1098} fill="url(#pan)" />
      <rect x={150} y={1500} width={850} height={11} fill="#1f1d1a" />

      {/* motor */}
      {/* motor şaftı (soldaki çubuk) — kendi YATAY ekseninde döner (kayar bantlar) */}
      <defs>
        <clipPath id="shaftClip">
          <rect x={706} y={507} width={62} height={19} rx={3} />
        </clipPath>
      </defs>
      <rect x={706} y={507} width={62} height={19} rx={3} fill="url(#shaft)" />
      <g clipPath="url(#shaftClip)">
        <g className={'shaftSpin' + (sim?.motor.running ? ' running' : '') + (sim?.motor.dir === -1 ? ' reverse' : '')}>
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={706} y={500 + i * 6} width={62} height={3} fill="#2f2c26" opacity={0.45} />
          ))}
        </g>
      </g>
      {/* kavrama yuvası — sabit referans; bantların kayması böylece daha okunur */}
      <rect x={712} y={512} width={22} height={9} fill="#4a473f" opacity={0.85} />
      <path d="M790 418H1020Q1082 418 1082 480V552Q1082 614 1020 614H790Z" fill="url(#mt)" />
      <rect x={832} y={418} width={206} height={196} fill="#74746f" />
      <g fill="url(#fn)" stroke="#8a8a85" strokeWidth={0.5}>
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={832} y={424 + i * 12} width={204} height={7.5} rx={3.75} />
        ))}
      </g>
      <path d="M762 436Q762 412 785 412H832V596Q832 620 802 620H785Q762 620 762 596Z" fill="#b6b6b1" />
      <rect x={845} y={432} width={130} height={102} rx={6} fill="#aaa9a4" stroke="#8d8d89" />
      <text x={910} y={483} textAnchor="middle" dominantBaseline="central" fontFamily="'Arial Black',Arial,sans-serif" fontSize={19} fontWeight={900} letterSpacing={2} fill="#5c5c58">SIEMENS</text>

      {/* acil stop — tıklanır: basılıyken TÜM besleme kaynakları kesilir (R7 #6) */}
      <g
        className={'estop' + (estop ? ' on' : '')}
        onClick={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          sfx.breaker(estop);
          A.setEstop(!estop);
        }}
      >
        <circle cx={222} cy={499} r={47} fill="#f1c40f" stroke="#c9a008" strokeWidth={2} />
        <circle cx={222} cy={499} r={33.5} fill="#1a1a1a" />
        <circle cx={222} cy={499} r={estop ? 28.5 : 31} fill="#d4151c" />
        <circle cx={222} cy={499} r={estop ? 21.5 : 25} fill="#da1a21" />
        {estop && <circle cx={222} cy={499} r={35} fill="none" stroke="#d4151c" strokeWidth={2.4} opacity={0.65} />}
        <path id="eb" d="M178 499A44 44 0 0 0 266 499" fill="none" />
        <path id="et" d="M185.5 499A36.5 36.5 0 0 1 258.5 499" fill="none" />
        <text fontFamily="Arial" fontSize={10.5} fontWeight={900} letterSpacing={1.4} fill="#111" textAnchor="middle">
          <textPath href="#eb" startOffset="50%">EMERGENCY</textPath>
        </text>
        <text fontFamily="Arial" fontSize={11} fontWeight={900} letterSpacing={3} fill="#111" textAnchor="middle">
          <textPath href="#et" startOffset="50%">STOP</textPath>
        </text>
        <title>{estop ? 'Acil Stop BASILI — tüm besleme kesildi · tıkla: bırak' : 'Acil Stop — tıkla: bas (tüm besleme kesilir)'}</title>
      </g>

      {/* seçme şalteri (paket şalter 0/1) — tıklanır: kapıda tüm besleme yok (R7 #3) */}
      <g
        className="paketSel"
        onClick={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          sfx.breaker(!paket);
          A.setPaket(!paket);
        }}
      >
        <rect x={293.5} y={459.5} width={76} height={79} fill="#d7d9d9" stroke="#999" />
        <text x={331.5} y={476} textAnchor="middle" fontFamily="Arial" fontSize={11} fontWeight={900}>0</text>
        <text x={353.5} y={485} textAnchor="middle" fontFamily="Arial" fontSize={11} fontWeight={900}>1</text>
        <circle cx={331.5} cy={503} r={23} fill="#8c8c8c" />
        <circle cx={331.5} cy={503} r={19.5} fill="#131313" />
        {/* kol: 0 → düz yukarı ("0" etiketi), 1 → sağa yatık ("1" etiketi) */}
        <g transform={`rotate(${paket ? 38 : 0} 331.5 503)`}>
          <rect x={324.5} y={487} width={14} height={32} rx={6} fill={paket ? '#3a7d44' : '#2a2a2a'} />
          <rect x={330} y={489} width={3} height={8} rx={1} fill="#c9c9c6" />
        </g>
        <text x={331.5} y={535.5} textAnchor="middle" fontFamily="Arial" fontSize={6.5} fontWeight={900} fill="#555">SIEMENS</text>
        <title>{paket ? 'Paket Şalter: 1 (açık) — pano beslemeli · tıkla: kapat' : 'Paket Şalter: 0 (kapalı) — pano beslemesiz · tıkla: aç'}</title>
      </g>

      {/* lambalar (durumlu) */}
      <LampsArt sim={sim} />

      {/* kesici (durumlu) */}
      <BreakerArt breakers={st.breakers} />

      {/* uç sıra baskıları: R S T R / U V W Mp + ⊗ lamba simgesi */}
      <g className="t" textAnchor="middle">
        <text x={420} y={608}>R</text><text x={476} y={608}>S</text><text x={532} y={608}>T</text><text x={588} y={608}>R</text>
        <text x={420} y={668}>U</text><text x={476} y={668}>V</text><text x={532} y={668}>W</text><text x={588} y={668}>Mp</text>
      </g>
      <g className="aw">
        <path d="M644 581V593M644 609V619" />
        <circle cx={644} cy={601} r={8} />
        <path d="M638 595L650 607M650 595L638 607" />
      </g>

      {/* okul yazısı */}
      <text className="s" x={263} y={675} textAnchor="middle" textLength={173} lengthAdjust="spacingAndGlyphs">TOPHANE TEKNİK ve</text>
      <text className="s" x={263} y={695} textAnchor="middle" textLength={194} lengthAdjust="spacingAndGlyphs">ENDÜSTRİ MESLEK LİSESİ</text>

      {/* butonlar (durumlu) */}
      <ButtonsArt pressed={st.pressed} />

      {/* e ünitesi (durumlu) */}
      <EArt armed={st.termikArmed} />
      <text className="t" x={524} y={878} textAnchor="end">e</text>
      <ETrayArt />

      {/* d1 ünitesi */}
      <D1Art />
      <text className="t" x={703} y={878} textAnchor="end">d1</text>
      <D1TrayArt />

      {/* d2 ünitesi (canlı ekran) */}
      <D2Art sim={sim} />
      <text className="t" x={916} y={878} textAnchor="end">d2</text>
      <D2TrayArt />

      {/* kontaktörler (durumlu) */}
      <ContactorsArt sim={sim} />

      {/* harici sinyal lambası (temel katman — düğler en üstte kalır) */}
      <ExtLamp sim={sim} />

      {/* kablolar */}
      <Cables
        cables={st.cables}
        sag={st.settings.sag}
        focusId={st.settings.vurgula ? (hoverId ?? st.selCable) : null}
        selId={st.selCable}
        carry={st.carry}
        draft={st.selTerminal ? {
          from: st.selTerminal,
          snap: pwDraft ? snapTgt : null,
          color: st.cableColor,
          güç: st.settings.cableType === 'güç',
        } : null}
        onHover={setHoverId}
        apiRef={cablesApi}
      />

      {/* soketler (kabloların ucunu örter) */}
      <g className="sockets">
        {G.TERMINALS.map((s) => (
          <Knob key={s.id} s={s}
            selected={st.selTerminal === s.id}
            ring={ringFocus.has(s.id) || (pwDraft && G.POWER_SOCKETS.has(s.id) && s.id !== st.selTerminal)}
            snapP={snapId === s.id}
          />
        ))}
      </g>

      {/* taslak önizleme artık Cables'ın imperative üst katmanında çizilir
          (pointermove'da render yok — N4) */}
    </svg>
  );
}
