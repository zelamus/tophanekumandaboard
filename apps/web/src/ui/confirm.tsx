import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

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

/** Tehlikeli eylem onayı — App bu bileşeni kurar; her yerden `confirmAction()` çağrılır. */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  if (!showFn) return Promise.resolve(true); // bileşen yoksa engelleme
  return showFn(opts);
}

export function ConfirmDialogHost() {
  const [active, setActive] = useState<ActiveConfirm | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dangerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    showFn = (opts) => new Promise<boolean>((resolve) => {
      setActive({ ...opts, resolve });
    });
    return () => { showFn = null; };
  }, []);

  const settle = (ok: boolean) => {
    if (!active) return;
    const r = active.resolve;
    setActive(null);
    r(ok);
  };

  useEffect(() => {
    if (!active) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); settle(false); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // settle stabildir; active null↔değer geçişini izlemek yeterli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active !== null]);

  if (!active) return null;

  return createPortal(
    <div
      className="confirmBackdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmTitle"
      aria-describedby={active.body ? 'confirmBody' : undefined}
      onMouseDown={(e) => { if (e.target === e.currentTarget) settle(false); }}
    >
      <div
        className="confirmDialog"
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            // Yalnız iki odaklanabilir düğme var → gidip gelen kısır döngü
            e.preventDefault();
            const target = e.shiftKey ? dangerRef.current : cancelRef.current;
            target?.focus();
          }
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
  );
}
