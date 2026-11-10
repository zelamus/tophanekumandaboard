import { useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

export interface RadioGroupApi<T extends string> {
  groupRef: RefObject<HTMLDivElement | null>;
  itemProps: (value: T) => {
    'data-value': T;
    tabIndex: -1 | 0;
    onKeyDown: (e: KeyboardEvent) => void;
  };
}

/**
 * APG radyo grubu: roving tabindex (yalnız seçili oge tabda durur), ok tuşları
 * ve Home/End ile gezinme — seçim odağı da takip eder (R2 DeepSeek #10).
 * Tüm segmented `role="radiogroup"`/`role="radio"` gruplarında kullanılır.
 */
export function useRadioGroup<T extends string>(
  values: readonly T[],
  value: T,
  onValue: (v: T) => void,
): RadioGroupApi<T> {
  const groupRef = useRef<HTMLDivElement>(null);

  const focusValue = (v: T): void => {
    try {
      groupRef.current
        ?.querySelector<HTMLButtonElement>(`button[data-value="${CSS.escape(v)}"]`)
        ?.focus();
    } catch {
      /* CSS.escape yoksa odağı bırak; seçim yine de doğru */
    }
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    const dataValue = target?.getAttribute('data-value');
    const idx = Math.max(0, values.indexOf((dataValue ?? value) as T));
    let next: T | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = values[(idx + 1) % values.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = values[(idx - 1 + values.length) % values.length];
    else if (e.key === 'Home') next = values[0];
    else if (e.key === 'End') next = values[values.length - 1];
    if (!next) return;
    e.preventDefault();
    onValue(next);
    focusValue(next);
  };

  return {
    groupRef,
    itemProps: (v: T) => {
      // Değer listede yoksa gezinti İLK ogede kalır — aksi durumda tüm ögeler
      // tabIndex=-1 kalır ve grup klavyede kör kalır (R3 DeepSeek #9)
      const activeIdx = values.indexOf(value);
      const roving = activeIdx === -1 ? 0 : activeIdx;
      return {
        'data-value': v,
        tabIndex: values.indexOf(v) === roving ? 0 : -1,
        onKeyDown,
      };
    },
  };
}
