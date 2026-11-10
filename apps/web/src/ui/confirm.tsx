import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
}

interface ActiveConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

let showFn: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;
let current: ActiveConfirm | null = null;

/** Onay penceresi açıkken global kısayolları susturmak için App tarafından okunur. */
export function isConfirmActive(): boolean {
  return current !== null;
}

/**
 * Tehlikeli eylem onayı — App bu bileşeni kurar; her yerden `confirmAction()` çağrılır.
 * Ev sahibi bileşen yoksa KAPALI (false) döner — yıkıcı yol asla onaysız ilerlemez (R2 Nemotron/DeepSeek).
 */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  if (!showFn) return Promise.resolve(false);
  return showFn(opts);
}

export function ConfirmDialogHost() {
  const [active, setActive] = useState<ActiveConfirm | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dangerRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    showFn = (opts) => new Promise<boolean>((resolve) => {
      // Üst üste onay istekleri: bekleyeni iptal edilmiş say, yenisini aç (R2 DeepSeek #1)
      if (current) {
        const stale = current.resolve;
        current = null;
        setActive(null);
        setAnnouncement('İptal edildi');
        stale(false);
      }
      // Kapatılmak üzere olan kutunun İÇİNDEKİ odak, tetikleyiciyi ezmesin:
      // aksi durumda restore kopuk bir düğüme gider (R3 GLM #3 / DeepSeek #4)
      const ae = document.activeElement;
      if (!(ae instanceof HTMLElement && ae.closest('.confirmDialog'))) {
        openerRef.current = ae instanceof HTMLElement ? ae : null;
      }
      setActive({ ...opts, resolve });
    });
    return () => { showFn = null; };
  }, []);

  const settle = (ok: boolean) => {
    if (!current) return;
    const r = current.resolve;
    const label = ok ? current.confirmLabel : (current.cancelLabel ?? 'İptal');
    current = null;
    setActive(null);
    setAnnouncement(ok ? `Onaylandı: ${label}` : `İptal edildi`);
    const opener = openerRef.current;
    openerRef.current = null;
    opener?.focus(); // Tetikleyen öğeye dön — document.body'ye düşme (R2: 3 delege)
    window.setTimeout(() => r(ok), 0);
  };

  useEffect(() => {
    if (!active) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Pencere açıkken tam kısayol duvarı: tüm tuşlar burada biter (App'in
      // global handler'ı isConfirmActive() ile bir kez daha korunur)
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        settle(false);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        // İki düğmeli halka: iptal ↔ yıkıcı; her iki yönde de tam tur atar
        const buttons = [cancelRef.current, dangerRef.current];
        const cur = document.activeElement === cancelRef.current ? 0 : 1;
        const next = (cur + 1) % 2;
        buttons[next]?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active]);

  // Kalıcı canlı bölge: kuruluşlar arası aynı düğüm yaşar; "metinle birlikte
  // kurulma" duyurulamaması olmasın (R3 DeepSeek #3)
  return (
    <>
      <div className="srOnly" role="status" aria-live="polite">{announcement}</div>
      {active && createPortal(
        <div
          className="confirmBackdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) settle(false); }}
        >
          {/* alertdialog rolü iletişim kutusunda: backdrop düz bir perdedir (R2 DeepSeek #1) */}
          <div
            className="confirmDialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmTitle"
            aria-describedby={active.body ? 'confirmBody' : undefined}
            onKeyDown={(e: ReactKeyboardEvent) => {
              if (e.key === 'Tab') e.preventDefault(); // küresel yakalayıcı halkalar
            }}
          >
            <span className="confirmTitle" id="confirmTitle">{active.title}</span>
            {active.body && <p className="confirmBody" id="confirmBody">{active.body}</p>}
            <div className="confirmActions">
              <button ref={cancelRef} type="button" className="confirmBtn" onClick={() => settle(false)}>
                {active.cancelLabel ?? 'İptal'}
              </button>
              <button ref={dangerRef} type="button" className="confirmBtn destructive" onClick={() => settle(true)}>
                {active.confirmLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
