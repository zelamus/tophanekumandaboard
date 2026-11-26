import { A, useStore } from '../store';
import type { ZrConf } from '../store';
import type { SimOutput } from '../sim/model';
import { IconAlert, IconRefresh } from './Icons';
import { tr1 } from './format';
import { useScrollFade } from './scrollFade';

interface LedProps {
  on: boolean;
  color: string;
  label: string;
  title: string;
}

function HardwareLed({ on, color, label, title }: LedProps) {
  // Durum yalnızca renk/ışıldamadan gelmez: ad+Açık/Kapalı ekran okuyucuya söylenir
  return (
    <div
      className={`hardwareLed ${on ? 'on' : ''}`}
      role="img"
      aria-label={`${label}: ${on ? 'açık' : 'kapalı'} — ${title}`}
      title={title}
    >
      <span className="ledPip" style={{ '--led-color': color } as React.CSSProperties} />
      <span className="ledLabel" aria-hidden="true">{label}</span>
    </div>
  );
}

function renderTelemetry(sim: SimOutput | null, zr: ZrConf) {
  if (!sim) return null;
  const pills: React.ReactNode[] = [];

  // 1. Motor Telemetrisi
  if (sim.motor.running) {
    pills.push(
      <div key="motor" className="telemetryPill success">
        <span className="pulseDot" />
        <span>Motor: Çalışıyor ({sim.motor.dir === 1 ? 'İleri' : 'Geri'})</span>
      </div>
    );
  } else if (sim.motor.overCurrent) {
    pills.push(
      <div key="motor" className="telemetryPill warning">
        <span className="pulseDot warning" />
        <span>Motor Uğultu (Aşırı Akım) — Termik Yakında Atacak</span>
      </div>
    );
  } else if (sim.motor.missingPhase) {
    pills.push(
      <div key="motor" className="telemetryPill warning">
        <span>Motor: Faz Eksik</span>
      </div>
    );
  } else {
    pills.push(
      <div key="motor" className="telemetryPill neutral">
        <span>Motor: Durdu</span>
      </div>
    );
  }

  // 2. Kontaktörler (K1, K2, K3, K4)
  const contactors = [
    sim.dev.contactors.c1,
    sim.dev.contactors.c2,
    sim.dev.contactors.c3,
    sim.dev.contactors.c4,
  ];
  contactors.forEach((active, index) => {
    if (active) {
      pills.push(
        <div key={`k${index}`} className="telemetryPill success">
          <span>K{index + 1} Çekili</span>
        </div>
      );
    }
  });

  // 3. d1 Yardımcı Rölesi
  if (sim.dev.d1) {
    pills.push(
      <div key="d1" className="telemetryPill success">
        <span>d1 Röle Çekili</span>
      </div>
    );
  }

  // 4. Zaman Rölesi (ZR)
  if (sim.dev.zr.energized) {
    pills.push(
      <div key="zr" className="telemetryPill info">
        {zr.mode === 'ters'
          ? `ZR Çekili (Ters) — Bırakınca ${tr1(zr.delayMs / 1000)} sn`
          : sim.dev.zr.closed
            ? 'ZR Çekili (Gecikme Doldu)'
            : `ZR Sayıyor: ${tr1(sim.dev.zr.elapsed / 1000)} sn`}
      </div>
    );
  } else if (sim.dev.zr.closed) {
    pills.push(
      <div key="zrh" className="telemetryPill info">
        <span>ZR Tutuyor: Kalan {tr1(sim.dev.zr.elapsed / 1000)} sn</span>
      </div>
    );
  }

  // 5. Termik Durumu
  if (!sim.dev.termik.armed) {
    pills.push(
      <div key="termik" className="telemetryPill danger">
        <IconAlert style={{ width: 13, height: 13, marginRight: 4 }} />
        <span>Termik Attı</span>
      </div>
    );
  }

  // 6. Devre salınımı artık uyarı rozeti olarak gösterilmez (R7 #10):
  // motor gevşek son durumda çözülür, çakışma simüle edilmez.

  return pills;
}

export function StatusBar() {
  const st = useStore();
  const sim = st.sim;
  const shorted = sim?.shorts ?? [];
  // ≤640'ta telemetri gerçekten taşınca sağ-kenar fade ipucu verir (R5 GLM #2)
  const centerRef = useScrollFade<HTMLDivElement>();

  // Durum Rehberi (İmleç ve Etkileşim İpucu)
  let guideText: React.ReactNode;
  if (st.mode === 'kablo' && st.selCable) {
    guideText = <span><b>Kablo Seçili</b> · [Del] ile sil, [Esc] seçimi kaldır</span>;
  } else if (st.mode === 'kablo' && st.selTerminal) {
    guideText = <span><b>Hedef Uca Tıklayın</b> · (Shift + Tık: zincirleme çekim)</span>;
  } else if (st.mode === 'sil') {
    guideText = <span><b>Silme Modu</b> · Kaldırmak istediğiniz kabloya tıklayın</span>;
  } else if (st.mode === 'hareket') {
    guideText = st.carry
      ? <span><b>Uç Elde</b> · Hedef yuvaya tıkla · boş zemin/Esc geri koyar</span>
      : <span><b>Taşıma Modu</b> · Yuvaya tıkla: son kablo ucunu al · kabloya tıkla: en yakın uç · Orta tuş: kaydır</span>;
  } else {
    guideText = <span><b>Hazır</b> · Kablo çekmek için terminallere tıklayın</span>;
  }

  return (
    <footer className="appStatusBar" role="contentinfo">
      {/* Sol: Şebeke ve Sinyal Lambaları LED Dizisi */}
      <div className="statusSection left">
        <div className="ledBankGroup" title="3-Fazlı Ana Besleme ve Kumanda Fazı">
          <HardwareLed on={sim?.lamps.red === true} color="#ff3b30" label="L1" title="L1 Fazı (Kırmızı Lamba)" />
          <HardwareLed on={sim?.lamps.green === true} color="#34c759" label="L2" title="L2 Fazı (Yeşil Lamba)" />
          <HardwareLed on={sim?.lamps.yellow === true} color="#ffcc00" label="L3" title="L3 Fazı (Sarı Lamba)" />
          <HardwareLed on={sim?.lamps.ctrl === true} color="#ff9500" label="Rc" title="Rc Kumanda Fazı" />
          <HardwareLed on={sim?.lamps.white === true} color="#f2f2f7" label="N" title="Nötr / Besleme Tam" />
        </div>

        <span className="statusDivider" aria-hidden="true" />

        <div className="ledBankGroup external" title="Harici Sinyal Lambaları">
          <HardwareLed on={sim?.ext.yellow === true} color="#ffcc00" label="Hs" title="Harici Sarı Sinyal Lambası" />
          <HardwareLed on={sim?.ext.red === true} color="#ff3b30" label="Hk" title="Harici Kırmızı Sinyal Lambası" />
          <HardwareLed on={sim?.ext.green === true} color="#34c759" label="Hy" title="Harici Yeşil Sinyal Lambası" />
        </div>
      </div>

      {/* Orta: Telemetri Rozetleri ve Kısa Devre Uyarısı
          Telemetri ~10Hz tazelenir: canlı bölge ADAYI değil (R1: ZR sayacı '2.7, 2.6…'
          diye okuyucuyu boğar). Yalnız kısa devre uyarısı canlı bölgedir. */}
      <div className="statusSection center" ref={centerRef}>
        {shorted.length > 0 ? (
          <div className="shortCircuitAlert" role="alert" aria-live="assertive">
            <IconAlert className="alertIcon" />
            <span className="alertMsg">
              Kısa Devre Algılandı! ({shorted.length} Terminal) — Termik attı, kumanda koptu.
            </span>
            <button
              type="button"
              className="alertResetBtn"
              onClick={() => A.termikArm()}
            >
              <IconRefresh style={{ width: 12, height: 12, marginRight: 4 }} />
              <span>Termiği sıfırla</span>
            </button>
          </div>
        ) : (
          <div className="telemetryList" aria-live="off">
            {renderTelemetry(sim, st.zr)}
          </div>
        )}
      </div>

      {/* Sağ: İpucu / Rehber Metni */}
      <div className="statusSection right">
        <div className="guidanceBadge">
          {guideText}
        </div>
      </div>
    </footer>
  );
}
