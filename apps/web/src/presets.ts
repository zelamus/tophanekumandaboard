// Kitaptaki ilk üç TEMRİN — prefabrik devre kayıtları.
// Kaynak: MEB "Kumanda ve Kontrol Atölyesi 10", kka10.pdf
//   TEMRİN 4 : s.45–46, Görsel 1.40.1 — S0 stop butonuyla lamba (H1) devresi
//   TEMRİN 5 : s.47–48, Görsel 1.42     — bastıkça çalıştırmalı (mühürle ->
//              yok) sürekli çalıştırma; H1 kırmızı = durdu (K1 NC 21-22),
//              H2 yeşil = çalışıyor (K1 NO 13-14)
//   TEMRİN 6 : s.49–50, Görsel 1.44     — mühürlemeli sürekli çalıştırma
//
// Renk alışkanlığı: L1 kırmızı, L2 sarı, L3 mavi, N/toprak siyah.

import type { Cable } from './store';

export interface Preset {
  id: string;
  name: string;
  gorsel: string;
  kisa: string;
  aciklama: string[];
  wires: { a: string; b: string; color: string }[];
}

const K = '#b71c1c';  // kırmızı
const S = '#c9a227';  // sarı
const M = '#1e56c9';  // mavi
const N = '#262626';  // siyah (nötr)

export const PRESETS: Preset[] = [
  {
    id: 't4',
    name: 'TEMRİN 4 — İkaz Lambası (S0 × H1)',
    gorsel: 'Görsel 1.40.1 (s.45)',
    kisa: 'b1 (S0) durdur butonuyla harici kırmızı lamba (H1) yanar; S0 basılıyken lamba söner.',
    aciklama: [
      'Kumanda kesicisini (F1) kapalı tut.',
      'Fazı (Rc) S0 butonunun ortak ucuna çek: sup.Rc → b1.c1',
      'S0 kapalı ucundan harici lambanın (H1) faz ucuna: b1.nc → ext.fazR',
      'Lambanın toprak ucunu nötr Mp’ye bağla: ext.gnd → sup.Mp',
      'b1’e (S0) bas → kapalı kontak açılır → H1 söner.',
    ],
    wires: [
      { a: 'sup.Rc', b: 'b1.c1', color: K },
      { a: 'b1.nc', b: 'ext.fazR', color: K },
      { a: 'ext.gnd', b: 'sup.Mp', color: N },
    ],
  },
  {
    id: 't5',
    name: 'TEMRİN 5 — Bastıkça Çalıştırmalı (S1 × K1)',
    gorsel: 'Görsel 1.42 (s.47)',
    kisa: 'b2 (S1) basılıyken motor çalışır (mühürleme yok); H1 kırmızı = durdu, H2 yeşil = çalışıyor.',
    aciklama: [
      'Kumanda devresi: Rc → e.tc.a | e.tc.b → b2.c1 | b2.no → c1.a1 | c1.a2 → Mp',
      'H1 kırmızı (K1 NC 21-22): e.tc.b → c1.k1.a | c1.k1.b → ext.fazR | ext.gnd → Mp',
      'H2 yeşil (K1 NO 13-14): e.tc.b → c1.x2.a | c1.x2.b → ext.fazG',
      'Güç: F3 (motor kesicisi) açıkken R/S/T beslemesi pano içinden e.m1/m2/m3.a uçlarına geçer; bu yola kablo çekmeyin.',
      'Öğrenci güç kabloları: e.m1.b → c1.m1.a | e.m2.b → c1.m2.a | e.m3.b → c1.x1.a',
      'c1.m1.b → U | c1.m2.b → V | c1.x1.b → W  (3. faz termik m3 üzerinden x1 NO’ya)',
      'b2 basılı kaldıkça motor döner; bırakınca durur.',
    ],
    wires: [
      // kumanda
      { a: 'sup.Rc', b: 'e.tc.a', color: K },
      { a: 'e.tc.b', b: 'b2.c1', color: K },
      { a: 'b2.no', b: 'c1.a1', color: K },
      { a: 'c1.a2', b: 'sup.Mp', color: N },
      // H1 kırmızı: durdu
      { a: 'e.tc.b', b: 'c1.k1.a', color: K },
      { a: 'c1.k1.b', b: 'ext.fazR', color: K },
      { a: 'ext.gnd', b: 'sup.Mp', color: N },
      // H2 yeşil: çalışıyor
      { a: 'e.tc.b', b: 'c1.x2.a', color: K },
      { a: 'c1.x2.b', b: 'ext.fazG', color: K },
      // güç (3 faz) — R/S/T→e.m*.a beslemesi F3 pano içi kenarından gelir,
      // ayrıca kablo çekilirse kesici bypass edilir
      { a: 'e.m1.b', b: 'c1.m1.a', color: K },
      { a: 'e.m2.b', b: 'c1.m2.a', color: S },
      { a: 'e.m3.b', b: 'c1.x1.a', color: M },
      { a: 'c1.m1.b', b: 'sup.U', color: K },
      { a: 'c1.m2.b', b: 'sup.V', color: S },
      { a: 'c1.x1.b', b: 'sup.W', color: M },
    ],
  },
  {
    id: 't6',
    name: 'TEMRİN 6 — Mühürlemeli Sürekli Çalıştırma',
    gorsel: 'Görsel 1.44 (s.49)',
    kisa: 'b2 (S1) ile başlatılır, b3 kontak c1.x3 ile mühürlenir → motor sürekli çalışır; b1 (S0) ile durur.',
    aciklama: [
      'Kumanda: Rc → e.tc.a → b1.c1 (S0 durdur NC) → b2.c1 (S1 başlat NO) → c1.a1',
      'c1.a2 → Mp; b1.nc → c1.x3.a | c1.x3.b → c1.a1 (mühürleme K1 NO)',
      'H1 kırmızı / H2 yeşil sinyal lambaları TEMRİN 5 gibi bağlanır.',
      'Güç devresi TEMRİN 5 ile aynıdır (m1/m2 NA + x1 3. faz).',
      'b2’ye bas → K1 çeker → x3 mühürler → butondan el çekilir, motor çalışır.',
      'b1’e (S0) bas → mühür ve bobin devresi kopar → motor durur; kırmızı H1 yanar.',
    ],
    wires: [
      // kumanda zinciri: S0 → S1 → bobin
      { a: 'sup.Rc', b: 'e.tc.a', color: K },
      { a: 'e.tc.b', b: 'b1.c1', color: K },
      { a: 'b1.nc', b: 'b2.c1', color: K },
      { a: 'b2.no', b: 'c1.a1', color: K },
      { a: 'c1.a2', b: 'sup.Mp', color: N },
      // mühürleme (paralel),
      { a: 'b1.nc', b: 'c1.x3.a', color: K },
      { a: 'c1.x3.b', b: 'c1.a1', color: K },
      // H1 kırmızı: durdu
      { a: 'e.tc.b', b: 'c1.k1.a', color: K },
      { a: 'c1.k1.b', b: 'ext.fazR', color: K },
      { a: 'ext.gnd', b: 'sup.Mp', color: N },
      // H2 yeşil: çalışıyor
      { a: 'e.tc.b', b: 'c1.x2.a', color: K },
      { a: 'c1.x2.b', b: 'ext.fazG', color: K },
      // güç — R/S/T→e.m*.a beslemesi F3 pano içi kenarından gelir,
      // ayrıca kablo çekilirse kesici bypass edilir
      { a: 'e.m1.b', b: 'c1.m1.a', color: K },
      { a: 'e.m2.b', b: 'c1.m2.a', color: S },
      { a: 'e.m3.b', b: 'c1.x1.a', color: M },
      { a: 'c1.m1.b', b: 'sup.U', color: K },
      { a: 'c1.m2.b', b: 'sup.V', color: S },
      { a: 'c1.x1.b', b: 'sup.W', color: M },
    ],
  },
];

export function presetCables(p: Preset): Cable[] {
  return p.wires.map((w, i) => ({ id: `pk${p.id}_${i}`, a: w.a, b: w.b, color: w.color }));
}
