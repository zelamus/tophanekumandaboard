// Pano geometrisi — "Siemens motor control training board" SVG sanatının
// koordinat sistemi kullanılır (sanat viewBox: 40 385 1070 1180).
//
// Soket (uç) kimlikleri KİLİTLİ listedir; sim motoru, prefabrik devreler ve
// kayıtlar bu kimlikleri kullanır (yerler yeni panoya eşlendi, kimlikler aynı):
//   sup.R/S/T/Rc/X/U/V/W/Mp/X2 · bK.c1/c2/nc/no · e.tn.a/b · e.tc.a/b ·
//   e.m1..m3.a/b · d1.a1/a2/com/nc/no · d2.no.a/b · d2.a1/a2 ·
//   d2.c1.c1/c2.com/nc/no · cK.a1/a2 · cK.m1/m2.a/b · cK.k1/k2.a/b ·
//   cK.x1/x2/x3.a/b · ext.fazY/fazR/fazG/gnd
//
// Sanattaki düğ (soket) #j sembolü dış halka r12'dir; interaktif düğler bunu
// tamamen örtecek R_KNOB yarıçapı kullanır.

export const VIEWBOX = '40 385 1070 1180';

export interface Rect { x: number; y: number; w: number; h: number; }

/** Pano koyu çerçevesi (sol/right şeritler sanat JSX'te birebir port edilmez) */
export const FRAME: Rect = { x: 55, y: 397, w: 1042, h: 1148 };
export const PANEL: Rect = { x: 118, y: 402, w: 904, h: 1098 };

/** Yuvarlak düğ (soket) yarıçapı — sanat #j dış halkasını örter */
export const R_KNOB = 10.2;

/** Plastik düğ renkleri (sanat soket renkleri) */
export const KNOB_COLOR = {
  black: '#1b1b1b',
  red: '#c4202a',
  yellow: '#e9a912',
  blue: '#2d72d9',
} as const;

/* ================================================================
   üst blok: lambalar, kesici, e ünitesi düğmeleri, d2 ekranı
   ================================================================ */

/** Sinyal lambaları (1–5) — sanat y: 499, r: 27 */
export interface LampDef { x: number; color: string; key: 'red' | 'green' | 'yellow' | 'ctrl' | 'white'; }
export const LAMP_Y = 499;
export const LAMP_R = 27;
export const LAMPS: LampDef[] = [
  { x: 420, color: '#d9141c', key: 'red' },
  { x: 476, color: '#17b34a', key: 'green' },
  { x: 532, color: '#f0a21a', key: 'yellow' },
  { x: 588, color: '#d9141c', key: 'ctrl' },
  { x: 644, color: '#f2f2f2', key: 'white' },
];

/** Kesici yuvası (sanat 165..283 × 556..632): 3P motor + 1P kumanda */
export const BREAKER = {
  housing: { x: 165, y: 556, w: 118, h: 76 },
  inner: { x: 168, y: 559, w: 112, h: 70 },
  colX: [173, 199, 225, 251],   // 0..2 = F3 (motor, 3P); 3 = F1 (kumanda, 1P)
  colY: 563, colW: 24, colH: 58,
  leverInset: 3.5, leverW: 17, leverH: 42,
  yOn: 564, yOff: 579,
};

/** e (termik röle) kırmızı Test/sıfırlama düğmesi — tıklanır */
export const E_RESET = { x: 481, y: 759, w: 11.5, h: 11.5 };

/** d2 ZR göstergesi — canlı 7 segment değeri buraya çizilir */
export const D2_UNIT = {
  body: { x: 836, y: 712, w: 76, h: 136 },
  lcd: { x: 848, y: 776.5, w: 52, h: 16.5 },
};

/* ================================================================
   terminal (soket) tanımları
   ================================================================ */

export interface SocketDef {
  id: string;
  x: number;
  y: number;
  color: string;
  r?: number;
}

/* ---------------- üst uç sıraları (besleme / motor / nötr) ---------------- */

const TOP_Y = 569, BOT_Y = 631;
const Lx = { a: 420, b: 476, c: 532, d: 588, lamp: 644 };

export const TERMINALS_TOP: SocketDef[] = [
  { id: 'sup.R',  x: Lx.a,    y: TOP_Y, color: KNOB_COLOR.black },
  { id: 'sup.S',  x: Lx.b,    y: TOP_Y, color: KNOB_COLOR.red },
  { id: 'sup.T',  x: Lx.c,    y: TOP_Y, color: KNOB_COLOR.yellow },
  { id: 'sup.Rc', x: Lx.d,    y: TOP_Y, color: KNOB_COLOR.black },
  { id: 'sup.X',  x: Lx.lamp, y: TOP_Y, color: KNOB_COLOR.black },  // sanatta ⊗ baskısı (644,601)
];

export const TERMINALS_BOT: SocketDef[] = [
  { id: 'sup.U',  x: Lx.a,    y: BOT_Y, color: KNOB_COLOR.yellow },
  { id: 'sup.V',  x: Lx.b,    y: BOT_Y, color: KNOB_COLOR.yellow },
  { id: 'sup.W',  x: Lx.c,    y: BOT_Y, color: KNOB_COLOR.yellow },
  { id: 'sup.Mp', x: Lx.d,    y: BOT_Y, color: KNOB_COLOR.blue },
  { id: 'sup.X2', x: Lx.lamp, y: BOT_Y, color: KNOB_COLOR.black },
];

/* ---------------- e (termik röle) tepsi: [tn, tc, m1, m2, m3] ---------------- */

const E_COLS = [418, 540];
const E_ROWS = [
  { id: 'tn', y: 896,  knob: KNOB_COLOR.black },
  { id: 'tc', y: 925,  knob: KNOB_COLOR.red },
  { id: 'm1', y: 955,  knob: KNOB_COLOR.yellow },
  { id: 'm2', y: 988,  knob: KNOB_COLOR.yellow },
  { id: 'm3', y: 1021, knob: KNOB_COLOR.yellow },
] as const;

function eSockets(): SocketDef[] {
  const out: SocketDef[] = [];
  for (const row of E_ROWS) {
    out.push({ id: `e.${row.id}.a`, x: E_COLS[0], y: row.y, color: row.knob });
    out.push({ id: `e.${row.id}.b`, x: E_COLS[1], y: row.y, color: row.knob });
  }
  return out;
}

/* ---------------- d1 (takma röle): sarı bobin çifti + nc/com/no ---------------- */

const D1_SOCKS: SocketDef[] = [
  { id: 'd1.a1',  x: 617, y: 925, color: KNOB_COLOR.yellow },
  { id: 'd1.a2',  x: 735, y: 925, color: KNOB_COLOR.yellow },
  { id: 'd1.nc',  x: 617, y: 988, color: KNOB_COLOR.red },
  { id: 'd1.com', x: 676, y: 988, color: KNOB_COLOR.blue },
  { id: 'd1.no',  x: 735, y: 988, color: KNOB_COLOR.black },
];

/* ---------------- d2 (zaman rölesi ZR): NO çifti, bobin çifti, 2 temas sırası ---------------- */

const D2_ROW_Y = { c1: 988, c2: 1048 };
const D2_ROW_X = { nc: 808, com: 874, no: 940 };

const D2_SOCKS: SocketDef[] = [
  { id: 'd2.no.a', x: 808, y: 896, color: KNOB_COLOR.black },
  { id: 'd2.no.b', x: 940, y: 896, color: KNOB_COLOR.black },
  { id: 'd2.a1',   x: 808, y: 925, color: KNOB_COLOR.yellow },
  { id: 'd2.a2',   x: 940, y: 925, color: KNOB_COLOR.yellow },
  ...(['c1', 'c2'] as const).flatMap((n) => [
    { id: `d2.${n}.nc`,  x: D2_ROW_X.nc,  y: D2_ROW_Y[n], color: KNOB_COLOR.red },
    { id: `d2.${n}.com`, x: D2_ROW_X.com, y: D2_ROW_Y[n], color: KNOB_COLOR.blue },
    { id: `d2.${n}.no`,  x: D2_ROW_X.no,  y: D2_ROW_Y[n], color: KNOB_COLOR.black },
  ]),
];

/* ---------------- butonlar b1–b4 ---------------- */

export interface ButtonDef { id: string; y: number; color: string; }
export const BTN_POS = { cap: 217, red: 277, black: 340, label: 157, lever: 26 };

export const BUTTONS: ButtonDef[] = [
  { id: 'b1', y: 745,  color: '#d9141c' },
  { id: 'b2', y: 830,  color: '#1f9a77' },
  { id: 'b3', y: 915,  color: '#d9141c' },
  { id: 'b4', y: 1000, color: '#1f9a77' },
];

export function buttonSockets(b: ButtonDef): SocketDef[] {
  return [
    { id: `${b.id}.c1`, x: BTN_POS.red,   y: b.y - BTN_POS.lever, color: KNOB_COLOR.red },
    { id: `${b.id}.c2`, x: BTN_POS.red,   y: b.y + BTN_POS.lever, color: KNOB_COLOR.red },
    { id: `${b.id}.nc`, x: BTN_POS.black, y: b.y - BTN_POS.lever, color: KNOB_COLOR.black },
    { id: `${b.id}.no`, x: BTN_POS.black, y: b.y + BTN_POS.lever, color: KNOB_COLOR.black },
  ];
}

/* ---------------- kontaktörler c1–c4 ---------------- */

export interface ContactorDef {
  id: string;
  /** sanat #ct gövde use x (y sabit 1103) */
  use: number;
  /** tepsi sütunları (#col use x; sütunlar x ve x+120) */
  trayL: number; trayR: number;
  /** C# etiket x (y 1230) */
  labelX: number;
}

export const CONTACTORS: ContactorDef[] = [
  { id: 'c1', use: 234, trayL: 222, trayR: 342, labelX: 334 },
  { id: 'c2', use: 427, trayL: 415, trayR: 535, labelX: 527 },
  { id: 'c3', use: 620, trayL: 608, trayR: 728, labelX: 720 },
  { id: 'c4', use: 813, trayL: 801, trayR: 921, labelX: 913 },
];

/** Kontaktör tepsi sıraları (üstten alta): bobin, m1, m2, k1, k2, x1, x2, x3 */
export const C_ROW_Y = [1258, 1288, 1318, 1348, 1378, 1408, 1438, 1468] as const;

export function contactorSockets(k: ContactorDef): SocketDef[] {
  const put = (row: number, name: string, color: string): SocketDef => ({
    id: `${k.id}.${name}.a`, x: k.trayL, y: C_ROW_Y[row], color,
  });
  const putR = (row: number, name: string, color: string): SocketDef => ({
    id: `${k.id}.${name}.b`, x: k.trayR, y: C_ROW_Y[row], color,
  });
  return [
    { id: `${k.id}.a1`, x: k.trayL, y: C_ROW_Y[0], color: KNOB_COLOR.yellow },
    { id: `${k.id}.a2`, x: k.trayR, y: C_ROW_Y[0], color: KNOB_COLOR.yellow },
    put(1, 'm1', KNOB_COLOR.black), putR(1, 'm1', KNOB_COLOR.black),
    put(2, 'm2', KNOB_COLOR.black), putR(2, 'm2', KNOB_COLOR.black),
    put(3, 'k1', KNOB_COLOR.red),   putR(3, 'k1', KNOB_COLOR.red),
    put(4, 'k2', KNOB_COLOR.red),   putR(4, 'k2', KNOB_COLOR.red),
    put(5, 'x1', KNOB_COLOR.black), putR(5, 'x1', KNOB_COLOR.black),
    put(6, 'x2', KNOB_COLOR.black), putR(6, 'x2', KNOB_COLOR.black),
    put(7, 'x3', KNOB_COLOR.black), putR(7, 'x3', KNOB_COLOR.black),
  ];
}

/* ---------------- harici sinyal lambası (pano dışı) ---------------- */

export const EXT_LAMP = {
  housing: { x: 1112, y: 430, w: 136, h: 118 },
  lenses: [
    { x: 1136, color: '#e0a41c' },
    { x: 1176, color: '#c8352b' },
    { x: 1216, color: '#2f9e4f' },
  ],
  lensY: 464, lensR: 12,
  sockets: { y: 510 },
  keys: ['ext.fazY', 'ext.fazR', 'ext.fazG', 'ext.gnd'],
  socketX: [1124, 1156, 1188, 1220],
};

/* ================================================================
   Soket listesi
   ================================================================ */

export const TERMINALS: SocketDef[] = [
  ...TERMINALS_TOP,
  ...TERMINALS_BOT,
  ...eSockets(),
  ...D1_SOCKS,
  ...D2_SOCKS,
  ...BUTTONS.flatMap(buttonSockets),
  ...CONTACTORS.flatMap(contactorSockets),
  ...EXT_LAMP.keys.map((id, i) => ({
    id,
    x: EXT_LAMP.socketX[i],
    y: EXT_LAMP.sockets.y,
    color: ['#c9a227', '#b23a30', '#2f9e4f', '#1c1c20'][i] ?? KNOB_COLOR.black,
    r: 9,
  })),
];

export const SOCKET_MAP: Record<string, SocketDef> = Object.fromEntries(
  TERMINALS.map((s) => [s.id, s]),
);

/** Soket koordinatı (kablo eğrisi uçları) */
export function socketPos(id: string): { x: number; y: number } {
  const s = SOCKET_MAP[id];
  return s ? { x: s.x, y: s.y } : { x: 0, y: 0 };
}

/* ================================================================
   TTR (güç kablosu) modu — çekim sırasında yakalanan 3 fazlı güç uçları

   Güç yolu: RST (besleme) → e.m1/m2/m3 (termik ana kutuplar, her iki uç) →
   kontaktör m1/m2 + x1 (her iki uç) → UVW (motor uçları).
   Bu listedeki uçlara kablo çekerken uç yakalama (snap) devrede olur;
   diğer uçlar normal tıklamayla bağlanır.
   ================================================================ */

export const POWER_SOCKETS: ReadonlySet<string> = (() => {
  const s = new Set<string>();
  for (const id of ['sup.R', 'sup.S', 'sup.T', 'sup.U', 'sup.V', 'sup.W']) s.add(id);
  for (const m of ['m1', 'm2', 'm3'] as const) {
    s.add(`e.${m}.a`);
    s.add(`e.${m}.b`);
  }
  for (const k of CONTACTORS) {
    for (const c of ['m1', 'm2', 'x1'] as const) {
      s.add(`${k.id}.${c}.a`);
      s.add(`${k.id}.${c}.b`);
    }
  }
  return s;
})();

/** Soketin insan-okur adı — imleç ipucu için (uç adresi aynen gelir) */
export const SOCKET_LABEL: Record<string, { ad: string; bolge: string }> = {
  'sup.R':     { ad: 'Besleme R (L1)', bolge: 'Besleme' },
  'sup.S':     { ad: 'Besleme S (L2)', bolge: 'Besleme' },
  'sup.T':     { ad: 'Besleme T (L3)', bolge: 'Besleme' },
  'sup.Rc':    { ad: 'Kumanda fazı Rc', bolge: 'Besleme' },
  'sup.X':     { ad: 'Lamba fazı X', bolge: 'Besleme' },
  'sup.U':     { ad: 'Motor U', bolge: 'Motor' },
  'sup.V':     { ad: 'Motor V', bolge: 'Motor' },
  'sup.W':     { ad: 'Motor W', bolge: 'Motor' },
  'sup.Mp':    { ad: 'Nötr Mp', bolge: 'Besleme' },
  'sup.X2':    { ad: 'Lamba nötr X2', bolge: 'Besleme' },
  'd1.a1':     { ad: 'd1 bobin A1', bolge: 'd1 röle' },
  'd1.a2':     { ad: 'd1 bobin A2', bolge: 'd1 röle' },
  'd1.nc':     { ad: 'd1 NC (kapalı)', bolge: 'd1 röle' },
  'd1.com':    { ad: 'd1 COM (ortak)', bolge: 'd1 röle' },
  'd1.no':     { ad: 'd1 NO (açık)', bolge: 'd1 röle' },
  'd2.no.a':   { ad: 'd2 ZR NO.a', bolge: 'd2 ZR' },
  'd2.no.b':   { ad: 'd2 ZR NO.b', bolge: 'd2 ZR' },
  'd2.a1':     { ad: 'd2 bobin A1', bolge: 'd2 ZR' },
  'd2.a2':     { ad: 'd2 bobin A2', bolge: 'd2 ZR' },
};

export function socketTitle(id: string): string {
  const base = SOCKET_LABEL[id] ?? (() => {
    const m = id.match(/^([a-z0-9]+)\.(\w+?)\.?(\w*)$/);
    if (!m) return { ad: id, bolge: '' };
    const [, dev, name, side] = m;
    const devAd: Record<string, string> = { c1: 'K1', c2: 'K2', c3: 'K3', c4: 'K4', b1: 'b1', b2: 'b2', b3: 'b3', b4: 'b4', e: 'e (termik)' };
    const cName: Record<string, string> = { a1: 'bobin A1', a2: 'bobin A2', m1: 'güç m1', m2: 'güç m2', k1: 'NC k1 (kapalı)', k2: 'NC k2', x1: 'NO x1', x2: 'NO x2', x3: 'NO x3', c1: 'ortak c1', c2: 'ortak c2', nc: 'NC', no: 'NO', com: 'COM', tn: 'NC tn', tc: 'NC tc' };
    return { ad: `${devAd[dev] ?? dev} ${cName[name] ?? name}${side ? ` ${side}` : ''}`, bolge: dev };
  })();
  return base.bolge ? `${base.ad} — ${id}` : `${base.ad} — ${id}`;
}
