// Durum çubuğu — lambalar, röleler, motor ve uyarılar

import { A, useStore } from '../store';
import type { ZrConf } from '../store';
import type { SimOutput } from '../sim/model';

function Dot({ on, color, title }: { on: boolean; color: string; title: string }) {
  return <span className={`dot ${on ? 'on' : ''}`} style={{ '--c': color } as React.CSSProperties} title={title} />;
}

function chips(sim: SimOutput | null, zr: ZrConf): React.ReactNode[] {
  if (!sim) return [];
  const out: React.ReactNode[] = [];
  if (sim.motor.running) {
    out.push(<span key="m" className="chip ok">Motor: çalışıyor ({sim.motor.dir === 1 ? 'ileri' : 'geri'})</span>);
  } else if (sim.motor.overCurrent) {
    out.push(<span key="m" className="chip warn">Motor uğuluyor ({sim.motor.stallTripDelayMs <= 2500 ? 'faz-faz hatası' : 'dönüş yolu: faz-nötr'}) — termik yakında atacak</span>);
  } else if (sim.motor.missingPhase) {
    out.push(<span key="m" className="chip warn">Motor: faz eksik</span>);
  } else {
    out.push(<span key="m" className="chip">Motor: durdu</span>);
  }
  const kOn = [sim.dev.contactors.c1, sim.dev.contactors.c2, sim.dev.contactors.c3, sim.dev.contactors.c4];
  kOn.forEach((on, i) => {
    if (on) out.push(<span key={`k${i}`} className="chip ok">K{i + 1} çekili</span>);
  });
  if (sim.dev.d1) out.push(<span key="d1" className="chip ok">d1 çekişti</span>);
  if (sim.dev.zr.energized) {
    out.push(zr.mode === 'ters'
      ? <span key="zr" className="chip">ZR çekili (ters) — bırakınca {(zr.delayMs / 1000).toFixed(1)} sn tutar</span>
      : sim.dev.zr.closed
        ? <span key="zr" className="chip ok">ZR çekili (gecikme doldu)</span>
        : <span key="zr" className="chip">ZR sayıyor: {(sim.dev.zr.elapsed / 1000).toFixed(1)} sn</span>);
  } else if (sim.dev.zr.closed) {
    out.push(<span key="zrh" className="chip">ZR tutuyor: kalan {(sim.dev.zr.elapsed / 1000).toFixed(1)} sn</span>);
  }
  if (!sim.dev.termik.armed) out.push(<span key="tr" className="chip warn">Termik attı</span>);
  if (sim.unstable) out.push(<span key="uns" className="chip warn">Kontaktör çakıyor — devre salınıyor</span>);
  return out;
}

export function StatusBar() {
  const st = useStore();
  const sim = st.sim;
  const shorted = sim?.shorts ?? [];
  return (
    <footer className="status">
      <div className="sLeft">
        <Dot on={sim?.lamps.red === true} color="#e74c3c" title="L1 indikatör" />
        <Dot on={sim?.lamps.green === true} color="#2ecc71" title="L2 indikatör" />
        <Dot on={sim?.lamps.yellow === true} color="#f1c40f" title="L3 indikatör" />
        <Dot on={sim?.lamps.ctrl === true} color="#e67e22" title="Rc (kumanda faz)" />
        <Dot on={sim?.lamps.white === true} color="#ecf0f1" title="Besleme (beyaz lamba 5)" />
        <Dot on={sim?.ext.yellow === true} color="#f1c40f" title="Harici sarı" />
        <Dot on={sim?.ext.red === true} color="#e74c3c" title="Harici kırmızı" />
        <Dot on={sim?.ext.green === true} color="#2ecc71" title="Harici yeşil" />
      </div>
      <div className="sMid">
        {chips(sim, st.zr)}
        {shorted.length > 0 && (
          <span className="chip warn big">
            Kısa devre! ({shorted.length} uç) — termik attı, kumanda devresi koptu. Kabloları düzelt, sonra sıfırla.
            <button className="linkBtn" onClick={() => A.termikArm()}>Sıfırla</button>
          </span>
        )}
      </div>
      <div className="sRight">
        {st.mode === 'kablo' && st.selTerminal ? 'İkinci ucu seç…' : `Mod: ${st.mode}`}
      </div>
    </footer>
  );
}
