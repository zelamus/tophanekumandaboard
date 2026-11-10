// Simülasyon modeli — pano elemanlarının elektriksel davranış tanımları

export type Pot = 'L1' | 'L2' | 'L3' | 'N';

export const PHASES: readonly Pot[] = ['L1', 'L2', 'L3'];

export interface Wire {
  id: string;
  a: string; // terminal ıd
  b: string;
  color: string; // kablo rengi (hex)
}

export interface Breakers {
  motor: boolean;    // 3 fazlı motor kesicisi (R-S-T besleme)
  control: boolean;  // tek fazlı kontrol kesicisi (R-Mp besleme)
}

export interface Buttons {
  b1: boolean; b2: boolean; b3: boolean; b4: boolean;
}

/** Aynı anda ileten iki uçlu kontak tanımı */
export interface ContactEdge {
  a: string;
  b: string;
  closed: boolean;
}

export interface DeviceRuntime {
  contactors: Record<'c1' | 'c2' | 'c3' | 'c4', boolean>; // bobin enerjili mi
  d1: boolean;
  zr: { energized: boolean; elapsed: number; closed: boolean };
  termik: { armed: boolean }; // atmadı = armed
}

export interface TimerConfig {
  delayMs: number;
  mode: 'düz' | 'ters'; // düz: enerjide gecikmeli kapanır (on-delay); ters: enerjide hemen kapanır, enerjiden sonra gecikmeli açılır (off-delay)
}

export interface SimOutput {
  /** terminal → ulaşılabilen potansiyeller */
  pot: Map<string, Pot[]>;
  /** kısa devre: aynı uçta iki çakışan potansiyel birbirine değer */
  shorts: string[];
  /** cihaz durumları (görsel + SimOutput'larda kullanılır) */
  dev: DeviceRuntime;
  /** sabit indikatör lambaları (1-4.) + beyaz lamba (5) */
  lamps: { red: boolean; green: boolean; yellow: boolean; ctrl: boolean; white: boolean };
  /** harici sinyal lambası LED'leri */
  ext: { yellow: boolean; red: boolean; green: boolean };
  /** motor */
  motor: { running: boolean; dir: 1 | 0 | -1; missingPhase: boolean; overCurrent: boolean; stallTripDelayMs: number };
  /** bobin relaxation 12 adımda oturmadı (kontaktör çakması — devre salınıyor) */
  unstable: boolean;
}
