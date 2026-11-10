// Uygulama durumu — useSyncExternalStore tabanlı basit tekil mağaza.

import { useSyncExternalStore } from 'react';
import type { SimOutput } from './sim/model';

export type Mode = 'kablo' | 'hareket' | 'sil';

/** Kablo zamki / çekiç tipi — çekim modu: normal veya TTR (güç, yakalama destekli) */
export type CableType = 'normal' | 'güç';

/** Kablo yolu stili — asılı varsayılandır (gerçek kartdaki sarkık çekiç) */
export type PathStyle = 'asılı' | 'düz' | 'yumuşak';

export interface SfxSetting {
  on: boolean;
  vol: number;
}

export interface SettingsShape {
  pathStyle: PathStyle;
  cableType: CableType;
  /** Kabloya gelince uçlarını vurgula + diğerlerini kıs (hover focus) */
  vurgula: boolean;
  sfx: SfxSetting;
  /** 'system' düzenin tercihini izler (prefers-color-scheme) */
  theme: 'dark' | 'light' | 'system';
}

export type ThemePref = SettingsShape['theme'];

/** Gerçekten uygulanan temayı çöz (system → medya sorgusu) */
export function resolveTheme(t: ThemePref): 'dark' | 'light' {
  if (t !== 'system') return t;
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export interface Cable {
  id: string;
  a: string;
  b: string;
  color: string;
  /** güç (TTR) kablo tipi — kalın çizilir */
  güç?: boolean;
}

export interface ZrConf {
  delayMs: number;
  mode: 'düz' | 'ters';
}

export interface BreakerState { motor: boolean; control: boolean; }

export interface DocShape {
  v: 1;
  cables: Cable[];
  breakers: BreakerState;
  zr: ZrConf;
  termikArmed: boolean;
  /** ayarlar (isteğe bağlı) — yükleme bunları kabul eder, eski kayıtlar bozulmaz */
  ayar?: Partial<SettingsShape>;
}

export interface AppState {
  mode: Mode;
  cableColor: string;
  settings: SettingsShape;
  cables: Cable[];
  pressed: { b1: boolean; b2: boolean; b3: boolean; b4: boolean };
  breakers: BreakerState;
  termikArmed: boolean;
  zr: ZrConf;
  selTerminal: string | null;
  selCable: string | null;
  sim: SimOutput | null;
  /** Doküman/preset yükleme ya da kablo temizliğinde artar → sim motoru sıfırlanır */
  simEpoch: number;
  /** Termik sıfırlamada artar → uğuldama sayacı yeni pencere alır (bobin/ZR İÇİNE DOKUNMAZ) */
  stallEpoch: number;
  /** Geri alma yığını derinliği (0 = geri alınacak kablo işlemi yok) */
  undoDepth: number;
}

/* ---------------- ayarlar — kalıcılık ---------------- */

const AYAR_KEY = 'kka-ayarlar';

const DEFAULT_SETTINGS: SettingsShape = {
  pathStyle: 'asılı',
  cableType: 'normal',
  vurgula: true,
  sfx: { on: true, vol: 0.5 },
  theme: 'system',
};

/** Kayıtlı temayı geçerli anahtar kelimeye indirger; eski kayıtlar bozulmaz */
function sanitizeTheme(t: unknown): ThemePref {
  return t === 'light' || t === 'dark' || t === 'system' ? t : 'system';
}

export function applyTheme(corrected: 'dark' | 'light'): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = corrected;
  }
}

function loadAyar(): SettingsShape {
  try {
    const raw = localStorage.getItem(AYAR_KEY);
    const th = raw ? sanitizeTheme((JSON.parse(raw) as Partial<SettingsShape>).theme) : DEFAULT_SETTINGS.theme;
    applyTheme(resolveTheme(th));
    if (!raw) return { ...DEFAULT_SETTINGS };
    const j = JSON.parse(raw) as Partial<SettingsShape>;
    return {
      pathStyle: j.pathStyle === 'düz' || j.pathStyle === 'yumuşak' ? j.pathStyle : 'asılı',
      cableType: j.cableType === 'güç' ? 'güç' : 'normal',
      vurgula: j.vurgula !== false,
      sfx: { on: j.sfx?.on !== false, vol: typeof j.sfx?.vol === 'number' ? Math.min(1, Math.max(0, j.sfx.vol)) : 0.5 },
      theme: th,
    };
  } catch {
    applyTheme(resolveTheme(DEFAULT_SETTINGS.theme));
    return { ...DEFAULT_SETTINGS };
  }
}

function saveAyar(s: SettingsShape): void {
  try {
    localStorage.setItem(AYAR_KEY, JSON.stringify(s));
  } catch { /* yoksay */ }
  applyTheme(resolveTheme(s.theme));
}

const listeners = new Set<() => void>();
let seq = 0;

/* Geri alma yığını — kablo ekleme/silme/temizleme/yüklemeden önceki durumu tutar.
   Son 40 kablo işlemi geri alınabilir. */
const MAX_UNDO = 40;
let undoStack: Cable[][] = [];

function pushHistory(): void {
  undoStack.push(state.cables.slice());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

let state: AppState = {
  mode: 'kablo',
  cableColor: '#ff3b30',
  settings: loadAyar(),
  cables: [],
  pressed: { b1: false, b2: false, b3: false, b4: false },
  breakers: { motor: true, control: true },
  termikArmed: true,
  zr: { delayMs: 3000, mode: 'düz' },
  selTerminal: null,
  selCable: null,
  sim: null,
  simEpoch: 0,
  stallEpoch: 0,
  undoDepth: 0,
};

function notify(): void { listeners.forEach((f) => f()); }

function patch(p: Partial<AppState>): void {
  state = { ...state, ...p };
  notify();
}

export function getState(): AppState {
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ---------------- eylemler ---------------- */

export const A = {
  setMode(mode: Mode): void { patch({ mode, selCable: null }); },

  setCableColor(cableColor: string): void { patch({ cableColor }); },

  setSettings(p: Partial<SettingsShape>): void {
    const settings = { ...state.settings, ...p };
    saveAyar(settings);
    patch({ settings });
  },

  setTheme(theme: ThemePref): void {
    A.setSettings({ theme });
  },

  /** System temasındayken düzen görünümü değişince yeniden çözer */
  refreshSystemTheme(): void {
    patch({ settings: { ...state.settings } });
  },

  /** Bir kablodan uzaklaştırmadan uç yakalamayı isteyeceğim; yoksa aynen */
  setCableType(cableType: CableType): void { A.setSettings({ cableType }); },

  clickTerminal(id: string, zincir = false): void {
    if (state.selTerminal === id) { patch({ selTerminal: null }); return; }
    if (!state.selTerminal) {
      patch({ selTerminal: id, selCable: null });
      return;
    }
    const kpcTipi = state.settings.cableType === 'güç' || undefined;
    const cable: Cable = {
      id: `k${(++seq).toString(36)}`, a: state.selTerminal, b: id,
      color: state.cableColor, güç: kpcTipi,
    };
    // Shift ile çekim zinciri: ikinci uç yeni taslak başlangıcı olur
    pushHistory();
    patch({
      cables: [...state.cables, cable],
      selTerminal: zincir ? id : null,
      undoDepth: undoStack.length,
    });
  },

  clickCable(id: string): void {
    if (state.mode === 'sil') {
      A.delCable(id);
      return;
    }
    patch({ selCable: state.selCable === id ? null : id, selTerminal: null });
  },

  delCable(id: string): void {
    pushHistory();
    patch({ cables: state.cables.filter((c) => c.id !== id), selCable: null, undoDepth: undoStack.length });
  },

  delSelected(): void {
    if (state.selCable) A.delCable(state.selCable);
  },

  /** Son kablo işlemini geri al (Ctrl+Z / ⌘Z) */
  undo(): void {
    const snap = undoStack.pop();
    if (!snap) return;
    patch({
      cables: snap,
      selTerminal: null,
      selCable: null,
      undoDepth: undoStack.length,
    });
  },

  cancelSel(): void { patch({ selTerminal: null, selCable: null }); },

  clearWires(): void {
    pushHistory();
    patch({ cables: [], selTerminal: null, selCable: null, simEpoch: state.simEpoch + 1, undoDepth: undoStack.length });
  },

  pressButton(id: 'b1' | 'b2' | 'b3' | 'b4'): void {
    if (state.pressed[id]) return;
    patch({ pressed: { ...state.pressed, [id]: true } });
  },

  releaseButton(id: 'b1' | 'b2' | 'b3' | 'b4'): void {
    if (!state.pressed[id]) return;
    patch({ pressed: { ...state.pressed, [id]: false } });
  },

  toggleBreaker(k: keyof BreakerState): void {
    patch({ breakers: { ...state.breakers, [k]: !state.breakers[k] } });
  },

  // Termik sıfırlama: bobin/ZR durumuna DOKUNMAZ (fizikte termik reseti ZR'yi
  // etkilemez); yalnız uğuldama sayacına yeni pencere açar (stallEpoch).
  termikArm(): void { patch({ termikArmed: true, stallEpoch: state.stallEpoch + 1 }); },
  termikTrip(): void { patch({ termikArmed: false }); },

  setZr(zr: Partial<ZrConf>): void {
    patch({ zr: { ...state.zr, ...zr } });
  },

  setSim(sim: SimOutput): void { patch({ sim }); },

  /** Kayıt yüklemesi — mevcut kablolar geri alınabilir yığın'a yazılır */
  loadDoc(doc: DocShape | null): void {
    if (!doc || doc.v !== 1) return;
    pushHistory();
    this.applyDoc(doc);
  },

  /** Preset kurulumu — temizliği ve yüklemeyi TEK geri alınabilir adımda yapar */
  replaceDoc(doc: DocShape | null): void {
    if (!doc || doc.v !== 1) return;
    pushHistory();
    this.applyDoc({ ...doc, cables: [] });
    this.applyDoc(doc);
    patch({ undoDepth: undoStack.length });
  },

  /** loadDoc iç skeci — snapshot zaten alınmış olmalı */
  applyDoc(doc: DocShape): void {
    if (doc.v !== 1) return;
    const ayar = doc.ayar ?? {};
    patch({
      cables: (doc.cables ?? []).filter((c) => c && c.a && c.b),
      pressed: { b1: false, b2: false, b3: false, b4: false },
      breakers: { motor: doc.breakers?.motor ?? true, control: doc.breakers?.control ?? true },
      zr: { delayMs: doc.zr?.delayMs ?? 3000, mode: doc.zr?.mode ?? 'düz' },
      termikArmed: doc.termikArmed ?? true,
      settings: { ...state.settings, ...ayar },
      selTerminal: null,
      selCable: null,
      mode: 'kablo',
      simEpoch: state.simEpoch + 1,
      undoDepth: undoStack.length,
    });
    saveAyar(state.settings);
  },

  exportDoc(): DocShape {
    return {
      v: 1,
      cables: state.cables,
      breakers: state.breakers,
      zr: state.zr,
      termikArmed: state.termikArmed,
      ayar: state.settings,
    };
  },
};

// hata ayıklama köprüsü (geliştirme)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__kka = { A, getState };
}
