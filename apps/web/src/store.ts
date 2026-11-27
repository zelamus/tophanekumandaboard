// Uygulama durumu — useSyncExternalStore tabanlı basit tekil mağaza.

import { useSyncExternalStore } from 'react';
import type { SimOutput } from './sim/model';
import { socketPos } from './board/geometry';

export type Mode = 'kablo' | 'hareket' | 'sil';

/** Kablo zamki / çekiç tipi — çekim modu: normal veya TTR (güç, yakalama destekli) */
export type CableType = 'normal' | 'güç';

export interface SfxSetting {
  on: boolean;
  vol: number;
}

export interface SettingsShape {
  /** Kablo sarkması 0..100 — 0 düz hat, ~35 yumuşak, 100 tam asılı (eski 3 seçeneğin sürekli hali) */
  sag: number;
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

/** Hareket modunda elde taşınan kablo ucu — seçim non-destrüktiftir,
 *  bırakışta bağlantı gerçekten değiştiyse tek geri alınabilir adım yazılır */
export interface Carry {
  cableId: string;
  end: 'a' | 'b';
  /** ucun alındığı soket — aynı yere bırakmak iptal sayılır */
  from: string;
}

export interface DocShape {
  v: 1;
  cables: Cable[];
  breakers: BreakerState;
  zr: ZrConf;
  termikArmed: boolean;
  /** paket şalter (ana 0/1 seçici) — eski kayıtlarda yoksa açık varsayılır */
  paket?: boolean;
  /** acil stop basılı mı — eski kayıtlarda yoksa bırakılmış varsayılır */
  estop?: boolean;
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
  /** paket şalter (ana 0/1 seçici) — kapalıyken tüm besleme yok */
  paket: boolean;
  /** acil stop basılı — tüm besleme kaynaklarını keser */
  estop: boolean;
  termikArmed: boolean;
  zr: ZrConf;
  selTerminal: string | null;
  selCable: string | null;
  /** hareket modunda elde taşınan kablo ucu (null = elde değil) */
  carry: Carry | null;
  sim: SimOutput | null;
  /** Doküman/preset yükleme ya da kablo temizliğinde artar → sim motoru sıfırlanır */
  simEpoch: number;
  /** Termik sıfırlamada artar → uğuldama sayacı yeni pencere alır (bobin/ZR İÇİNE DOKUNMAZ) */
  stallEpoch: number;
  /** Geri alma yığını derinliği (0 = geri alınacak kablo işlemi yok) */
  undoDepth: number;
  /** Yineleme yığını derinliği (0 = yinelenecek geri alınmış işlem yok) */
  redoDepth: number;
}

/* ---------------- ayarlar — kalıcılık ---------------- */

const AYAR_KEY = 'kka-ayarlar';

const DEFAULT_SETTINGS: SettingsShape = {
  sag: 100,
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
    // Tarayıcı çerçevesi de temayı izlesin (R2 GLM #11 / DeepSeek #8)
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', corrected === 'light' ? '#f2f2f7' : '#0d0e11');
  }
}

/** Eski 3 seçenekli kayıtları sürekli sarkmaya çevirir: düz→0, yumuşak→35, asılı→100 */
function legacySag(p: unknown): number {
  return p === 'düz' ? 0 : p === 'yumuşak' ? 35 : 100;
}

function loadAyar(): SettingsShape {
  try {
    const raw = localStorage.getItem(AYAR_KEY);
    const th = raw ? sanitizeTheme((JSON.parse(raw) as Partial<SettingsShape>).theme) : DEFAULT_SETTINGS.theme;
    applyTheme(resolveTheme(th));
    if (!raw) return { ...DEFAULT_SETTINGS };
    const j = JSON.parse(raw) as Partial<SettingsShape> & { pathStyle?: unknown };
    return {
      sag: typeof j.sag === 'number' && Number.isFinite(j.sag)
        ? Math.min(100, Math.max(0, j.sag))
        : legacySag(j.pathStyle),
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

/** benzersiz kablo id — yüklenen dokümanlardaki özel id'ler (ör. k1) ile
 *  çakışmasın: aynı id iki kabloda olursa seçim/silme ikisini birden tutar */
function nextCableId(): string {
  for (;;) {
    const id = `k${(++seq).toString(36)}`;
    if (!state.cables.some((c) => c.id === id)) return id;
  }
}

/* Geri alma yığını — kablo ekleme/silme/temizleme/yüklemeden önceki TÜM PANO
   dilimini tutar (R2 GLM #7 / DeepSeek #4: kablo-dışı durum kablosuz kalmasın).
   Kullanıcı tercihi (tema/ses) bilinçli olarak YOK — o ayarlar geri sarmaz. */
const MAX_UNDO = 40;

interface BoardSnap {
  cables: Cable[];
  breakers: BreakerState;
  paket: boolean;
  estop: boolean;
  zr: ZrConf;
  termikArmed: boolean;
  mode: Mode;
}

let undoStack: BoardSnap[] = [];
let redoStack: BoardSnap[] = [];

/** Anlık pano dilimini geri/yinele yığını için tek anlık görüntü olarak yakalar */
function captureSnap(): BoardSnap {
  return {
    cables: state.cables.slice(),
    breakers: { ...state.breakers },
    paket: state.paket,
    estop: state.estop,
    zr: { ...state.zr },
    termikArmed: state.termikArmed,
    mode: state.mode,
  };
}

/** Snapshot'ı durum yamasına çevirir (sim motoru topoloji değişince yeniden başlar) */
function snapPatch(snap: BoardSnap): Partial<AppState> {
  return {
    cables: snap.cables,
    breakers: snap.breakers,
    paket: snap.paket,
    estop: snap.estop,
    zr: snap.zr,
    termikArmed: snap.termikArmed,
    mode: snap.mode,
    pressed: { b1: false, b2: false, b3: false, b4: false },
    selTerminal: null,
    selCable: null,
    carry: null,
    simEpoch: state.simEpoch + 1,
  };
}

function pushHistory(): void {
  undoStack.push(captureSnap());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  // Yeni bir eylem, yinelenebilir geçmişi geçersiz kılar
  redoStack = [];
}

/** Yinelenebilir geçmişi geçersiz kılar — geri alınmış bir işlemi izleyen
 *  yeni bir durum değişikliği (mod, şalter, termik, ZR) yinelemeyi düşürür */
function clearRedo(): void {
  redoStack = [];
}

/** Kayıt/preset şema doğrulaması — doğrulama onay SORUSUNDAN önce gelir (R2 DeepSeek #12) */
export function isDocShape(d: unknown): d is DocShape {
  if (!d || typeof d !== 'object') return false;
  const o = d as Partial<DocShape>;
  return (
    o.v === 1 &&
    Array.isArray(o.cables) &&
    o.cables.every((c) => !!c && typeof c === 'object' && typeof (c as Cable).a === 'string' && typeof (c as Cable).b === 'string')
  );
}

let state: AppState = {
  mode: 'kablo',
  cableColor: '#ff3b30',
  settings: loadAyar(),
  cables: [],
  pressed: { b1: false, b2: false, b3: false, b4: false },
  breakers: { motor: true, control: true },
  paket: true,
  estop: false,
  termikArmed: true,
  zr: { delayMs: 3000, mode: 'düz' },
  selTerminal: null,
  selCable: null,
  carry: null,
  sim: null,
  simEpoch: 0,
  stallEpoch: 0,
  undoDepth: 0,
  redoDepth: 0,
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
  setMode(mode: Mode): void { clearRedo(); patch({ mode, selCable: null, carry: null, redoDepth: 0 }); },

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
      id: nextCableId(), a: state.selTerminal, b: id,
      color: state.cableColor, güç: kpcTipi,
    };
    // Shift ile çekim zinciri: ikinci uç yeni taslak başlangıcı olur
    pushHistory();
    patch({
      cables: [...state.cables, cable],
      selTerminal: zincir ? id : null,
      undoDepth: undoStack.length,
      redoDepth: redoStack.length,
    });
  },

  clickCable(id: string, pt?: { x: number; y: number }): void {
    // hareket modunda kablo tıkı = imlece en yakın ucu eline al (bağlantıyı bozmaz)
    if (state.mode === 'hareket' && !state.carry && pt) {
      A.pickCableEnd(id, pt);
      return;
    }
    // elde uç varken kablo tıkı bir şey yapmaz — bırakış yalnız soketledir
    if (state.mode === 'hareket' && state.carry) return;
    if (state.mode === 'sil') {
      A.delCable(id);
      return;
    }
    patch({ selCable: state.selCable === id ? null : id, selTerminal: null });
  },

  delCable(id: string): void {
    pushHistory();
    patch({ cables: state.cables.filter((c) => c.id !== id), selCable: null, undoDepth: undoStack.length, redoDepth: redoStack.length });
  },

  delSelected(): void {
    if (state.selCable) A.delCable(state.selCable);
  },

  /** Son pano işlemini geri al — kablo + kesici + ZR + termik birlikte döner (R2) */
  undo(): void {
    const snap = undoStack.pop();
    if (!snap) return;
    // Geri alınan anlık görüntü, yineleme yığınına yazılır
    redoStack.push(captureSnap());
    if (redoStack.length > MAX_UNDO) redoStack.shift();
    patch({
      ...snapPatch(snap),
      undoDepth: undoStack.length,
      redoDepth: redoStack.length,
    });
  },

  /** Geri alınmış son işlemi yinele — kablo + kesici + ZR + termik birlikte döner */
  redo(): void {
    const snap = redoStack.pop();
    if (!snap) return;
    undoStack.push(captureSnap());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    patch({
      ...snapPatch(snap),
      undoDepth: undoStack.length,
      redoDepth: redoStack.length,
    });
  },

  cancelSel(): void { patch({ selTerminal: null, selCable: null, carry: null }); },

  clearWires(): void {
    pushHistory();
    patch({ cables: [], selTerminal: null, selCable: null, carry: null, simEpoch: state.simEpoch + 1, undoDepth: undoStack.length, redoDepth: redoStack.length });
  },

  /* ---- paket şalter (ana 0/1 seçici) + acil stop ---- */

  setPaket(paket: boolean): void { clearRedo(); patch({ paket, redoDepth: 0 }); },

  /** Acil stop basılıyken TÜM besleme kaynakları kesilir; taşınan uç da geri konur */
  setEstop(estop: boolean): void {
    clearRedo();
    patch(estop ? { estop: true, carry: null, selTerminal: null, redoDepth: 0 } : { estop: false, redoDepth: 0 });
  },

  /* ---- hareket modu: uç taşıma ----
     Sokete tık → o sokete bağlı EN SON konmuş kablonun ucunu alır.
     Kabloya tık → imlece en yakın uç taşınır. Bırakış bağlantıyı
     gerçekten değiştirirse TEK geri alınabilir adım yazılır. */

  /** Soket tıklarını moduna göre yönlendirir (kablo çekme / taşıma) */
  socketTap(id: string, zincir = false): void {
    if (state.mode === 'hareket') {
      if (state.carry) A.dropCarry(id);
      else A.pickFromSocket(id);
      return;
    }
    A.clickTerminal(id, zincir);
  },

  pickFromSocket(socketId: string): void {
    for (let i = state.cables.length - 1; i >= 0; i--) {
      const c = state.cables[i];
      if (c.a === socketId || c.b === socketId) {
        patch({
          carry: { cableId: c.id, end: c.a === socketId ? 'a' : 'b', from: socketId },
          selCable: c.id,
          selTerminal: null,
        });
        return;
      }
    }
  },

  pickCableEnd(cableId: string, pt: { x: number; y: number }): void {
    const c = state.cables.find((k) => k.id === cableId);
    if (!c) return;
    const pa = socketPos(c.a), pb = socketPos(c.b);
    const end = Math.hypot(pt.x - pa.x, pt.y - pa.y) <= Math.hypot(pt.x - pb.x, pt.y - pb.y) ? 'a' : 'b';
    patch({
      carry: { cableId, end, from: end === 'a' ? c.a : c.b },
      selCable: cableId,
      selTerminal: null,
    });
  },

  dropCarry(target: string | null): void {
    const carry = state.carry;
    if (!carry) return;
    const c = state.cables.find((k) => k.id === carry.cableId);
    if (!c) { patch({ carry: null }); return; }
    const other = carry.end === 'a' ? c.b : c.a;
    // boş zemin / aynı soket / kendi diğer ucu → iptal: bağlantı değişmedi, geçmiş yazılmaz
    if (!target || target === carry.from || target === other) {
      patch({ carry: null });
      return;
    }
    pushHistory();
    patch({
      cables: state.cables.map((k) => (k.id === carry.cableId
        ? (carry.end === 'a' ? { ...k, a: target } : { ...k, b: target })
        : k)),
      carry: null,
      selTerminal: null,
      selCable: null,
      undoDepth: undoStack.length,
      redoDepth: redoStack.length,
    });
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
    clearRedo();
    patch({ breakers: { ...state.breakers, [k]: !state.breakers[k] }, redoDepth: 0 });
  },

  // Termik sıfırlama: bobin/ZR durumuna DOKUNMAZ (fizikte termik reseti ZR'yi
  // etkilemez); yalnız uğuldama sayacına yeni pencere açar (stallEpoch).
  termikArm(): void { clearRedo(); patch({ termikArmed: true, stallEpoch: state.stallEpoch + 1, redoDepth: 0 }); },
  termikTrip(): void { clearRedo(); patch({ termikArmed: false, redoDepth: 0 }); },

  setZr(zr: Partial<ZrConf>): void {
    clearRedo();
    patch({ zr: { ...state.zr, ...zr }, redoDepth: 0 });
  },

  setSim(sim: SimOutput): void { patch({ sim }); },

  /** Kayıt yüklemesi — mevcut pano dilimi geri alınabilir yığına yazılır; gerçekten yüklediyse true */
  loadDoc(doc: DocShape | null): boolean {
    if (!doc || doc.v !== 1) return false;
    pushHistory();
    this.applyDoc(doc);
    return true;
  },

  /** Preset kurulumu — TEK geri alınabilir adım: bir snapshot, tek patch.
      (R3 Nemotron'ın "çift undo girdisi" bulgusu kaynakta yanlıştı — pushHistory
      bir kez alınıyor; çift applyDoc patch'i artıklardı, kaldırıldı) */
  replaceDoc(doc: DocShape | null): void {
    if (!doc || doc.v !== 1) return;
    pushHistory();
    this.applyDoc(doc);
  },

  /** loadDoc iç skeci — snapshot zaten alınmış olmalı */
  applyDoc(doc: DocShape): void {
    if (doc.v !== 1) return;
    const ayar: Partial<SettingsShape> = doc.ayar ?? {};
    // Güven küresi: bilinmeyen/arsız değerleri varsayılana geri döndür — aksi
    // durumda bir radyo grubunda hiçbir öge gezinti taşıyamaz (R3 DeepSeek #9)
    const sfxAyar = ayar.sfx;
    const safeSettings: SettingsShape = {
      sag: typeof ayar.sag === 'number' && Number.isFinite(ayar.sag)
        ? Math.min(100, Math.max(0, ayar.sag))
        : legacySag((ayar as { pathStyle?: unknown }).pathStyle),
      cableType: ayar.cableType === 'güç' ? 'güç' : 'normal',
      vurgula: typeof ayar.vurgula === 'boolean' ? ayar.vurgula : state.settings.vurgula,
      sfx: {
        on: sfxAyar && typeof sfxAyar.on === 'boolean' ? sfxAyar.on : state.settings.sfx.on,
        vol: sfxAyar && typeof sfxAyar.vol === 'number'
          ? Math.min(1, Math.max(0, sfxAyar.vol))
          : state.settings.sfx.vol,
      },
      theme: ayar.theme === 'dark' || ayar.theme === 'light' || ayar.theme === 'system'
        ? ayar.theme
        : state.settings.theme,
    };
    patch({
      cables: (doc.cables ?? []).filter((c) => c && c.a && c.b),
      pressed: { b1: false, b2: false, b3: false, b4: false },
      breakers: { motor: doc.breakers?.motor ?? true, control: doc.breakers?.control ?? true },
      paket: doc.paket ?? true,
      estop: doc.estop ?? false,
      carry: null,
      zr: {
        delayMs: typeof doc.zr?.delayMs === 'number' && doc.zr.delayMs >= 200 && doc.zr.delayMs <= 15000
          ? doc.zr.delayMs
          : 3000,
        mode: doc.zr?.mode === 'ters' ? 'ters' : 'düz',
      },
      termikArmed: doc.termikArmed ?? true,
      settings: safeSettings,
      selTerminal: null,
      selCable: null,
      mode: 'kablo',
      simEpoch: state.simEpoch + 1,
      undoDepth: undoStack.length,
      redoDepth: redoStack.length,
    });
    saveAyar(state.settings);
  },

  exportDoc(): DocShape {
    return {
      v: 1,
      cables: state.cables,
      breakers: state.breakers,
      paket: state.paket,
      estop: state.estop,
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
