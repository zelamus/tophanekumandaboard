// Pano geometrisi — fotoğraftan ölçülen koordinatlar.
//
// Kaynak fotoğraf: 1125×2000 px. Yerel koordinat = foto − (60, 345).
// SVG viewBox: "0 0 1180 1270".
//   • Pano koyu çerçevesi : (8, 55) – (1022, 1215)
//   • Bej pano yüzeyi     : (70, 65) – (939, 1153)
//   • Harici sinyal lambası panonun sağında (x 1030–1170) — pano görselini
//     BOZMAZ, öğrenci kablolarıyla beslenir.
//
// Soket (uç) kimlikleri kilitli listedir; sim motoru ve prefabrik devreler bu
// kimlikleri kullanır:
//   sup.R/S/T/Rc/X/U/V/W/Mp/X2 · bK.c1/c2/nc/no · e.tn.a/b · e.tc.a/b ·
//   e.m1..m3.a/b · d1.a1/a2/com/nc/no · d2.no.a/b · d2.a1/a2 ·
//   d2.c1.c1/c2.com/nc/no · cK.a1/a2 · cK.m1/m2.a/b · cK.k1/k2.a/b ·
//   cK.x1/x2/x3.a/b · ext.fazY/fazR/fazG/gnd

export const VIEWBOX = '0 0 1180 1270';

export interface Rect { x: number; y: number; w: number; h: number; }

/** Pano çerçevesi (koyu) ile bej yüzey */
export const FRAME: Rect = { x: 8, y: 55, w: 1014, h: 1160 };
export const PANEL: Rect = { x: 70, y: 65, w: 869, h: 1088 };

/** Yuvarlak düğ (soket) yarıçapları */
export const R_KNOB = 10.5;      // ray / tepsi soketleri
export const R_BTN_SOCKET = 8.5; // buton yuvaları
export const R_MINI = 8;         // d1 / d2 küçük soketler

/** Plastik düğ renkleri (fotoğraftaki soketler) */
export const KNOB_COLOR = {
  black: '#1c1c20',
  red: '#b23a30',
  yellow: '#d9a51e',
  blue: '#2a5fa8',
} as const;

/** Gövde / baskı renkleri */
export const INK = '#2b2419';        // baskı mürekkebi
export const PANEL_COLOR = '#e6d59f';
export const PANEL_EDGE = '#b9a776';
export const FRAME_COLOR = '#26201a';

/* ================================================================
  üst blok: acilstop, seçici, iki uç sırası, lambalar, kesici yuvası
   ================================================================ */

/** Acil stop düğmesi (süs — pano görseli) */
export const EMERGENCY = {
  plate: { x: 105, y: 70, w: 135, h: 105 },
  dome: { x: 155, y: 112, r: 33.5 },
};

/** 0/1 seçici anahtar (süs) */
export const SELECTOR = {
  plate: { x: 234, y: 115, w: 55, h: 85 },  // foto: daha dolgun kare plaka (~55×85)
  knob: { x: 254, y: 150, r: 11 },
};

/** Kesici yuvası (girinti) — 3P motor + 1P kumanda kesici */
export const RECESS: Rect = { x: 109, y: 217, w: 109, h: 69 };

/** Okul yazısı konumu */
export const SCHOOL = { x: 135, y: 310, lineH: 19 };

/** Sinyal lambaları (1–5) — y: 152, çap ≈ 38 */
export interface LampDef { x: number; color: string; key: 'red' | 'green' | 'yellow' | 'ctrl' | 'white'; }
export const LAMP_Y = 152;
export const LAMP_R = 19;
export const LAMPS: LampDef[] = [
  { x: 361, color: '#c8352b', key: 'red' },
  { x: 417, color: '#2f9e4f', key: 'green' },
  { x: 474, color: '#e0a41c', key: 'yellow' },
  { x: 529, color: '#c8352b', key: 'ctrl' },
  { x: 585, color: '#ece9df', key: 'white' },
];

/* ---------------- terminal (banjo) soket sıraları ---------------- */

export interface SocketDef {
  id: string;
  x: number;
  y: number;
  color: string;
  label?: string;      // basılı etiket metni
  glyph?: 'lamp';      // lamba simgesi (ⓧ)
  r?: number;          // özel yarıçap
}

const termCol = [361.5, 417.5, 472, 527, 582];

/** 1. uç sırası (y: 225) — üstten besleme */
export const TERMINALS_TOP: SocketDef[] = [
  { id: 'sup.R',  x: termCol[0], y: 225, color: KNOB_COLOR.black,  label: 'R' },
  { id: 'sup.S',  x: termCol[1], y: 225, color: KNOB_COLOR.red,    label: 'S' },
  { id: 'sup.T',  x: termCol[2], y: 225, color: KNOB_COLOR.yellow, label: 'T' },
  { id: 'sup.Rc', x: termCol[3], y: 225, color: KNOB_COLOR.red,    label: 'R' },   // gerçek kartta ikinci R (kırmızı soket)
  { id: 'sup.X',  x: termCol[4], y: 225, color: KNOB_COLOR.black,  glyph: 'lamp' },
];

/** 2. uç sırası (y: 285) — motor / nötr */
export const TERMINALS_BOT: SocketDef[] = [
  { id: 'sup.U',  x: termCol[0], y: 285, color: KNOB_COLOR.yellow, label: 'U' },
  { id: 'sup.V',  x: termCol[1], y: 285, color: KNOB_COLOR.yellow, label: 'V' },
  { id: 'sup.W',  x: termCol[2], y: 285, color: KNOB_COLOR.yellow, label: 'W' },
  { id: 'sup.Mp', x: termCol[3], y: 285, color: KNOB_COLOR.blue,   label: 'Mp' },
  { id: 'sup.X2', x: termCol[4], y: 285, color: KNOB_COLOR.black },                // sim bağlantı ucu — gerçek kartta lamba simgesi yalnız üst sıra ucunda
];

/* ---------------- e (termik röle) ---------------- */

export const E_UNIT = {
  body: { x: 377, y: 355, w: 81, h: 170 },
  face: { x: 383, y: 400, w: 69, h: 80 },
  reset: { x: 421, y: 432, r: 8.5 },   // kırmızı sıfırlama düğmesi (tıklanır)
  blueK: { x: 439, y: 434, r: 5.5 },   // ayar düğmesi (süs)
};

/** e tepsi: sütunlar sabit, 5 sıra — [tn, tc, m1, m2, m3] */
export interface TrayRow { id: string; y: number; knob: string; kind: 'ncOpen' | 'ncT' | 'bridge' | 'coil' | 'no' | 'nc' | 'auxBox' | 'spdt' | 'timed' | 'coilZR'; }
export const E_TRAY = {
  cols: [356, 480],
  rows: [
    { id: 'tn', y: 551, knob: KNOB_COLOR.black,  kind: 'ncOpen' },
    { id: 'tc', y: 583, knob: KNOB_COLOR.red,    kind: 'ncT' },
    { id: 'm1', y: 613, knob: KNOB_COLOR.yellow, kind: 'bridge' },
    { id: 'm2', y: 644, knob: KNOB_COLOR.yellow, kind: 'bridge' },
    { id: 'm3', y: 675, knob: KNOB_COLOR.yellow, kind: 'bridge' },
  ] as TrayRow[],
  /** Büyük termik kutu baskısı */
  box: { x: 340, y: 536, w: 156, h: 154 },
};

export function eSockets(): SocketDef[] {
  const out: SocketDef[] = [];
  for (const row of E_TRAY.rows) {
    out.push({ id: `e.${row.id}.a`, x: E_TRAY.cols[0], y: row.y, color: row.knob, r: R_KNOB });
    out.push({ id: `e.${row.id}.b`, x: E_TRAY.cols[1], y: row.y, color: row.knob, r: R_KNOB });
  }
  return out;
}

/* ---------------- d1 (takma röle) ---------------- */

export const D1_UNIT = {
  body: { x: 560, y: 360, w: 56, h: 175 },  // foto: ince-uzun (~55×175) gövde
  cableStub: { x: 596, y: 326 },            // tel halkaların tepe noktası
};

export const D1_TRAY = {
  coil: { a: { x: 558, y: 580, id: 'd1.a1' }, b: { x: 676, y: 582, id: 'd1.a2' }, knob: KNOB_COLOR.yellow },
  spdt: { y: 644, nc: { x: 556.5, y: 645, id: 'd1.nc' }, com: { x: 612, y: 642, id: 'd1.com' }, no: { x: 666, y: 643, id: 'd1.no' } },
  comColor: KNOB_COLOR.blue,
  ncColor: KNOB_COLOR.red,
  noColor: KNOB_COLOR.red, // fotoda kırmızı-mavi-kırmızı sırası
  label: { x: 603, y: 552 }, // gövde altı bandında (body 360..535)
};

/* ---------------- d2 (zaman rölesi ZR) ---------------- */

export const D2_UNIT = {
  body: { x: 750, y: 355, w: 124, h: 170 }, // ince beyaz DIN gövde (foto ≈124 geniş)
  lcd: { x: 817, y: 441, w: 44, h: 20 },
  cableStub: { x: 828, y: 355 },
};

export const D2_TRAY = {
  timed:   { a: { x: 752, y: 552, id: 'd2.no.a' }, b: { x: 870, y: 552, id: 'd2.no.b' }, knob: KNOB_COLOR.black },
  coil:    { a: { x: 752, y: 581, id: 'd2.a1' },  b: { x: 880, y: 582, id: 'd2.a2' },  knob: KNOB_COLOR.yellow },
  zrBox:   { x: 800, y: 600, w: 42, h: 20 }, // "ZR" yazılı kutu baskısı
  rows: [
    { y: 644, prefix: 'c1' },
    { y: 705, prefix: 'c2' },
  ],
  rowX: { nc: 746, com: 810, no: 869 },
  label: { x: 855, y: 540 },
};

/* ---------------- butonlar b1–b4 ---------------- */

export interface ButtonDef { id: string; x: number; y: number; color: 'red' | 'teal'; }
export const BUTTONS: ButtonDef[] = [
  { id: 'b1', x: 154, y: 399, color: 'red' },
  { id: 'b2', x: 155, y: 488, color: 'teal' },
  { id: 'b3', x: 158, y: 570, color: 'red' },
  { id: 'b4', x: 157, y: 655, color: 'teal' },
];

/** Yuva sütunları: kırmızı ortak çifti (x 220) + siyah nc/no (x 281.5) */
export const BTN_COL = { red: 220, black: 281.5, dy: 28 };

export function buttonSockets(b: ButtonDef): SocketDef[] {
  const r = R_BTN_SOCKET;
  const blackSocket: SocketDef = { id: `${b.id}.nc`, x: BTN_COL.black, y: b.y - BTN_COL.dy, color: KNOB_COLOR.black, r };
  return [
    { id: `${b.id}.c1`, x: BTN_COL.red,  y: b.y - BTN_COL.dy, color: KNOB_COLOR.red,   r },
    { id: `${b.id}.c2`, x: BTN_COL.red,  y: b.y + BTN_COL.dy, color: KNOB_COLOR.red,   r },
    blackSocket,
    { id: `${b.id}.no`, x: BTN_COL.black, y: b.y + BTN_COL.dy, color: KNOB_COLOR.black, r },
  ];
}

/* ---------------- kontaktörler c1–c4 ---------------- */

export interface ContactorDef {
  id: string;
  trayL: number; trayR: number;   // tepsi sütunları
  front: Rect;                    // gövde (ön yüz)
}

const FRONT_H = 151;
export const CONTACTORS: ContactorDef[] = [
  { id: 'c1', trayL: 156, trayR: 281, front: { x: 162, y: 737, w: 78, h: FRONT_H } },
  { id: 'c2', trayL: 358, trayR: 478, front: { x: 364, y: 737, w: 78, h: FRONT_H } },
  { id: 'c3', trayL: 552, trayR: 671, front: { x: 558, y: 737, w: 78, h: FRONT_H } },
  { id: 'c4', trayL: 746, trayR: 867, front: { x: 752, y: 737, w: 78, h: FRONT_H } },
];

/** Kontaktör tepsi sıraları (üstten alta): bobin, m1, m2, k1, k2, x1, x2, x3 */
export const C_ROW_Y = [921, 950, 980, 1010, 1038, 1067, 1096, 1124] as const;

export function contactorSockets(k: ContactorDef): SocketDef[] {
  const put = (row: number, name: string, color: string) => {
    return { id: `${k.id}.${name}.a`, x: k.trayL, y: C_ROW_Y[row], color, r: R_KNOB } as SocketDef;
  };
  const putR = (row: number, name: string, color: string) => {
    return { id: `${k.id}.${name}.b`, x: k.trayR, y: C_ROW_Y[row], color, r: R_KNOB } as SocketDef;
  };
  const out: SocketDef[] = [
    { id: `${k.id}.a1`, x: k.trayL, y: C_ROW_Y[0], color: KNOB_COLOR.yellow, r: R_KNOB }, // bobin
    { id: `${k.id}.a2`, x: k.trayR, y: C_ROW_Y[0], color: KNOB_COLOR.yellow, r: R_KNOB },
    put(1, 'm1', KNOB_COLOR.yellow),   // gerçek kartta sarı posta sıraları
    putR(1, 'm1', KNOB_COLOR.yellow),
    put(2, 'm2', KNOB_COLOR.yellow),
    putR(2, 'm2', KNOB_COLOR.yellow),
    // foto: k1/k2 "yarısı siyah partnerli" kırmızı sıralar — B sütunu siyah
    { id: `${k.id}.k1.a`, x: k.trayL, y: C_ROW_Y[3], color: KNOB_COLOR.red, r: R_KNOB },
    { id: `${k.id}.k1.b`, x: k.trayR, y: C_ROW_Y[3], color: KNOB_COLOR.black, r: R_KNOB },
    { id: `${k.id}.k2.a`, x: k.trayL, y: C_ROW_Y[4], color: KNOB_COLOR.red, r: R_KNOB },
    { id: `${k.id}.k2.b`, x: k.trayR, y: C_ROW_Y[4], color: KNOB_COLOR.black, r: R_KNOB },
  ];
  out.push(put(5, 'x1', KNOB_COLOR.red), putR(5, 'x1', KNOB_COLOR.red));   // kutulu NO soketleri gerçekte kırmızı
  out.push(put(6, 'x2', KNOB_COLOR.red), putR(6, 'x2', KNOB_COLOR.red));
  out.push(put(7, 'x3', KNOB_COLOR.red), putR(7, 'x3', KNOB_COLOR.red));
  return out;
}

/* ---------------- motor ---------------- */

export const MOTOR = {
  body: { x: 700, y: 70, w: 238, h: 190 },       // gri SIEMENS gövde (foto ≈238×190, panonun içinde)
  shaft: { x: 652, y: 157, w: 48, h: 15 },        // sol mil (merkez y ≈ 164.5)
  tBox: { x: 802, y: 228, w: 92, h: 78 },         // klemens kutusu
  hole: { x: 792, y: 334 },                       // kablo pano giriş deliği
  label: { x: 826, y: 152 },                      // SIEMENS yazısı
};

/* ---------------- harici sinyal lambası (pano dışı) ---------------- */

export const EXT_LAMP = {
  housing: { x: 1034, y: 58, w: 136, h: 118 },
  lenses: [
    { x: 1058, color: '#e0a41c' },
    { x: 1098, color: '#c8352b' },
    { x: 1138, color: '#2f9e4f' },
  ],
  lensY: 92, lensR: 12,
  sockets: { y: 138 },
  keys: ['ext.fazY', 'ext.fazR', 'ext.fazG', 'ext.gnd'],
  socketX: [1046, 1078, 1110, 1142],
};

/* ================================================================
   Soket listesi
   ================================================================ */

export const TERMINALS: SocketDef[] = [
  ...TERMINALS_TOP,
  ...TERMINALS_BOT,
  ...eSockets(),
  { id: D1_TRAY.coil.a.id, x: D1_TRAY.coil.a.x, y: D1_TRAY.coil.a.y, color: D1_TRAY.coil.knob, r: R_MINI },
  { id: D1_TRAY.coil.b.id, x: D1_TRAY.coil.b.x, y: D1_TRAY.coil.b.y, color: D1_TRAY.coil.knob, r: R_MINI },
  { id: D1_TRAY.spdt.nc.id,  x: D1_TRAY.spdt.nc.x,  y: D1_TRAY.spdt.nc.y,  color: D1_TRAY.ncColor,  r: R_MINI },
  { id: D1_TRAY.spdt.com.id, x: D1_TRAY.spdt.com.x, y: D1_TRAY.spdt.com.y, color: D1_TRAY.comColor, r: R_MINI },
  { id: D1_TRAY.spdt.no.id,  x: D1_TRAY.spdt.no.x,  y: D1_TRAY.spdt.no.y,  color: D1_TRAY.noColor,  r: R_MINI },
  { id: D2_TRAY.timed.a.id, x: D2_TRAY.timed.a.x, y: D2_TRAY.timed.a.y, color: D2_TRAY.timed.knob, r: R_MINI },
  { id: D2_TRAY.timed.b.id, x: D2_TRAY.timed.b.x, y: D2_TRAY.timed.b.y, color: D2_TRAY.timed.knob, r: R_MINI },
  { id: D2_TRAY.coil.a.id, x: D2_TRAY.coil.a.x, y: D2_TRAY.coil.a.y, color: D2_TRAY.coil.knob, r: R_MINI },
  { id: D2_TRAY.coil.b.id, x: D2_TRAY.coil.b.x, y: D2_TRAY.coil.b.y, color: D2_TRAY.coil.knob, r: R_MINI },
  ...D2_TRAY.rows.flatMap((row) => [
    { id: `d2.${row.prefix}.nc`,  x: D2_TRAY.rowX.nc,  y: row.y, color: KNOB_COLOR.red,   r: R_MINI },
    { id: `d2.${row.prefix}.com`, x: D2_TRAY.rowX.com, y: row.y, color: KNOB_COLOR.blue,  r: R_MINI },
    { id: `d2.${row.prefix}.no`,  x: D2_TRAY.rowX.no,  y: row.y, color: KNOB_COLOR.black, r: R_MINI },
  ]),
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

/** Soketin taban plakasındaki sütun/knop rengini döndürür */
export function socketPos(id: string): { x: number; y: number } {
  const s = SOCKET_MAP[id];
  return s ? { x: s.x, y: s.y } : { x: 0, y: 0 };
}
