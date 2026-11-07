// Cihaz paneli — kesiciler, termik, zaman rölesi ve buton durumları

import { A, useStore } from '../store';

const bId = ['b1', 'b2', 'b3', 'b4'] as const;

export function DevicePanel() {
  const st = useStore();
  return (
    <section className="panel">
      <h3>Cihazlar</h3>

      <div className="row">
        <span className="lbl">Kesici F3 (motor 3×)</span>
        <button className={`btnS ${st.breakers.motor ? 'on' : ''}`} onClick={() => A.toggleBreaker('motor')}>
          {st.breakers.motor ? 'AÇIK' : 'KAPALI'}
        </button>
      </div>
      <div className="row">
        <span className="lbl">Kesici F1 (kumanda 1×)</span>
        <button className={`btnS ${st.breakers.control ? 'on' : ''}`} onClick={() => A.toggleBreaker('control')}>
          {st.breakers.control ? 'AÇIK' : 'KAPALI'}
        </button>
      </div>

      <div className="row">
        <span className="lbl">Termik röle (e)</span>
        <span className={`chip ${st.termikArmed ? '' : 'warn'}`}>{st.termikArmed ? 'Arızasız' : 'ATTI'}</span>
        <button className="btnS" disabled={st.termikArmed} onClick={() => A.termikArm()}>Sıfırla</button>
      </div>

      <div className="row">
        <span className="lbl">Zaman rölesi (d2)</span>
        <span className="chip">Gecikme: {(st.zr.delayMs / 1000).toFixed(1)} sn · {st.zr.mode}</span>
      </div>
      <div className="row sliderRow">
        <input
          type="range" min={200} max={20000} step={100}
          value={st.zr.delayMs}
          onChange={(e) => A.setZr({ delayMs: Number(e.target.value) })}
        />
      </div>
      <div className="row">
        <label className="radio">
          <input type="radio" checked={st.zr.mode === 'düz'} onChange={() => A.setZr({ mode: 'düz' })} /> Düz (gecikmeli kapanır)
        </label>
        <label className="radio">
          <input type="radio" checked={st.zr.mode === 'ters'} onChange={() => A.setZr({ mode: 'ters' })} /> Ters (gecikmeli açılır)
        </label>
      </div>

      <div className="row wrap">
        <span className="lbl">Butonlar:</span>
        {bId.map((b) => (
          <span key={b} className={`chip ${st.pressed[b] ? 'hot' : ''}`}>{b.toUpperCase()}{st.pressed[b] ? ' ▼' : ''}</span>
        ))}
      </div>
    </section>
  );
}
