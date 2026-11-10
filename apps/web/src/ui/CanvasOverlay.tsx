import { A, useStore } from '../store';
import { IconTrash } from './Icons';

export function CanvasOverlay() {
  const st = useStore();
  const cableCount = st.cables.length;

  return (
    <div className="canvasOverlay" style={{ pointerEvents: 'none' }}>
      {/* Sol Alt / Sol Üst: Kablo Sayacı ve İpuçları */}
      <div className="canvasFloatingPill left">
        <span className="pillDot" />
        <span className="pillText">{cableCount} {cableCount === 1 ? 'Kablo' : 'Kablo'} Bağlı</span>
        {st.selCable && (
          <>
            <span className="pillSeparator" />
            <span className="pillHighlight">Kablo Seçili</span>
            <button
              type="button"
              className="pillActionBtn"
              title="Seçili kabloyu sil (Delete)"
              aria-label="Seçili kabloyu sil"
              onClick={() => A.delSelected()}
            >
              <IconTrash style={{ width: 13, height: 13 }} />
              <span>Sil</span>
            </button>
          </>
        )}
      </div>

      {/* Sağ Alt: Gezinme İpucu */}
      <div className="canvasFloatingPill right">
        <span className="pillHint">
          <kbd>Tekerlek</kbd> Yakınlaştır · <kbd>Sürükle</kbd> Kaydır · <kbd>Shift</kbd> Zincir
        </span>
      </div>
    </div>
  );
}
