// Simülasyon videosu — zaman çizelgesi (TEMRİN 5 senaryosu)
// Kare tabanlı tek doğruluk kaynağı: driver.ts bu sabitleri okur.
import type { Preset } from '../../web/src/presets';
import { PRESETS } from '../../web/src/presets';

export const FPS = 30;

/** Başlık kartı bu karede biter */
export const TITLE_END = 75;
/** Her kablo bu kadar kare arayla kurulur */
export const WIRE_STEP = 30;
/** İlk kablo bu karede görünür */
export const WIRE_START = TITLE_END;

export const T5: Preset = PRESETS.find((p) => p.id === 't5')!;
export const WIRE_COUNT = T5.wires.length; // 18
/** Kablolama bu karede biter */
export const WIRING_END = WIRE_START + WIRE_COUNT * WIRE_STEP;

/** b2 (S1) basılı tutma aralıkları [başlangıç, bitiş) */
export const BTN = {
  press1: WIRING_END + 25,
  release1: WIRING_END + 90,
  press2: WIRING_END + 135,
  release2: WIRING_END + 285,
} as const;

/** Toplam kare sayısı — son 30 kare kapanış kartı */
export const TOTAL = BTN.release2 + 30;
