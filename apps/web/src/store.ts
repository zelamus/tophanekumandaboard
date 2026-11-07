// Uygulama durumu — useSyncExternalStore tabanlı basit tekil mağaza.

import { useSyncExternalStore } from 'react';
import type { SimOutput } from './sim/model';

export type Mode = 'kablo' | 'hareket' | 'sil';

export interface Cable {
  id: string;
  a: string;
  b: string;
  color: string;
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
}

export interface AppState {
  mode: Mode;
  cableColor: string;
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
}

const listeners = new Set<() => void>();
let seq = 0;

let state: AppState = {
  mode: 'kablo',
  cableColor: '#b71c1c',
  cables: [],
  pressed: { b1: false, b2: false, b3: false, b4: false },
  breakers: { motor: true, control: true },
  termikArmed: true,
  zr: { delayMs: 3000, mode: 'düz' },
  selTerminal: null,
  selCable: null,
  sim: null,
  simEpoch: 0,
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

  clickTerminal(id: string): void {
    if (state.selTerminal === id) { patch({ selTerminal: null }); return; }
    if (!state.selTerminal) {
      patch({ selTerminal: id, selCable: null });
      return;
    }
    const cable: Cable = { id: `k${(++seq).toString(36)}`, a: state.selTerminal, b: id, color: state.cableColor };
    patch({ cables: [...state.cables, cable], selTerminal: null });
  },

  clickCable(id: string): void {
    if (state.mode === 'sil') {
      A.delCable(id);
      return;
    }
    patch({ selCable: state.selCable === id ? null : id, selTerminal: null });
  },

  delCable(id: string): void {
    patch({ cables: state.cables.filter((c) => c.id !== id), selCable: null });
  },

  delSelected(): void {
    if (state.selCable) A.delCable(state.selCable);
  },

  cancelSel(): void { patch({ selTerminal: null, selCable: null }); },

  clearWires(): void {
    patch({ cables: [], selTerminal: null, selCable: null, simEpoch: state.simEpoch + 1 });
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

  termikArm(): void { patch({ termikArmed: true, simEpoch: state.simEpoch + 1 }); },
  termikTrip(): void { patch({ termikArmed: false }); },

  setZr(zr: Partial<ZrConf>): void {
    patch({ zr: { ...state.zr, ...zr } });
  },

  setSim(sim: SimOutput): void { patch({ sim }); },

  /** Kayıt/prefabrik dokümanını yükler — sim motoru yeni devreden başlar */
  loadDoc(doc: DocShape | null): void {
    if (!doc || doc.v !== 1) return;
    patch({
      cables: (doc.cables ?? []).filter((c) => c && c.a && c.b),
      pressed: { b1: false, b2: false, b3: false, b4: false },
      breakers: { motor: doc.breakers?.motor ?? true, control: doc.breakers?.control ?? true },
      zr: { delayMs: doc.zr?.delayMs ?? 3000, mode: doc.zr?.mode ?? 'düz' },
      termikArmed: doc.termikArmed ?? true,
      selTerminal: null,
      selCable: null,
      mode: 'kablo',
      simEpoch: state.simEpoch + 1,
    });
  },

  exportDoc(): DocShape {
    return {
      v: 1,
      cables: state.cables,
      breakers: state.breakers,
      zr: state.zr,
      termikArmed: state.termikArmed,
    };
  },
};

// hata ayıklama köprüsü (geliştirme)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__kka = { A, getState };
}
