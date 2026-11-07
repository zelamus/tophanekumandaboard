// Araç çubuğu — mod, kablo rengi ve temizleme

import { A, getState, useStore } from '../store';
import type { Mode } from '../store';

const COLORS: { c: string; ad: string }[] = [
  { c: '#b71c1c', ad: 'Kırmızı' },
  { c: '#262626', ad: 'Siyah' },
  { c: '#1e56c9', ad: 'Mavi' },
  { c: '#c9a227', ad: 'Sarı' },
  { c: '#1c8a43', ad: 'Yeşil' },
];

const MODES: { m: Mode; ad: string }[] = [
  { m: 'kablo', ad: 'Kablo Çek' },
  { m: 'hareket', ad: 'Taşı (pan)' },
  { m: 'sil', ad: 'Sil' },
];

export function Toolbar() {
  const st = useStore();
  void getState;
  return (
    <section className="panel tol">
      <div className="row wrap">
        {MODES.map((m) => (
          <button key={m.m} className={`btnS ${st.mode === m.m ? 'on' : ''}`} onClick={() => A.setMode(m.m)}>
            {m.ad}
          </button>
        ))}
      </div>
      <div className="row wrap">
        <span className="lbl">Kablo rengi:</span>
        {COLORS.map((c) => (
          <button
            key={c.c}
            title={c.ad}
            className={`swatch ${st.cableColor === c.c ? 'on' : ''}`}
            style={{ background: c.c }}
            onClick={() => A.setCableColor(c.c)}
          />
        ))}
        <span className="hint">Kablolar: {st.cables.length}</span>
      </div>
      <div className="row wrap">
        <button className="btnS danger" onClick={() => A.clearWires()}>Tüm kabloları sil</button>
        {st.selCable && <button className="btnS" onClick={() => A.delSelected()}>Seçili kabloyu sil</button>}
        <span className="hint">Teker: yakınlaştır · Boşluğa sürükle: kaydır</span>
      </div>
    </section>
  );
}
