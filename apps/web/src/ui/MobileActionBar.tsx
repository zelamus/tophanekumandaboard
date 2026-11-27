// Mobil (dar görünüm) sabit eylem çubuğu — üst çubuk yatay kaydığında da
// görünür kalan Geri Al / Yinele / Temizle düğmeleri. Masaüstünde gizlidir;
// stil `styles.css` içindeki `.mobileActionBar` ile ≤820px'te açılır.

import { A, useStore } from '../store';
import { clearWiresWithConfirm } from './clearWires';
import { IconUndo, IconRedo, IconTrash } from './Icons';

export function MobileActionBar() {
  const st = useStore();

  const handleClearWires = () => clearWiresWithConfirm();

  return (
    <div className="mobileActionBar" role="toolbar" aria-label="Pano eylemleri">
      <button
        type="button"
        className="appleButton iconOnly"
        disabled={st.undoDepth === 0}
        title="Geri al"
        aria-label="Son pano işlemini geri al"
        onClick={() => A.undo()}
      >
        <IconUndo />
      </button>
      <button
        type="button"
        className="appleButton iconOnly"
        disabled={st.redoDepth === 0}
        title="Yinele"
        aria-label="Geri alınmış işlemi yinele"
        onClick={() => A.redo()}
      >
        <IconRedo />
      </button>
      <button
        type="button"
        className="appleButton iconOnly danger"
        disabled={st.cables.length === 0}
        title="Tüm kabloları temizle"
        aria-label="Tüm kabloları temizle"
        onClick={() => void handleClearWires()}
      >
        <IconTrash />
      </button>
    </div>
  );
}