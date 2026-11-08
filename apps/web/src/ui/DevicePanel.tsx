import { A, useStore } from '../store';
import { sfx } from '../audio/sfx';

const BUTTONS = [
  { id: 'b1', name: 'S0', role: 'Durdurma (Stop)', color: 'red' },
  { id: 'b2', name: 'S1', role: 'Başlatma (Start)', color: 'teal' },
  { id: 'b3', name: 'S2', role: 'Yön / Durdur', color: 'red' },
  { id: 'b4', name: 'S3', role: 'İkinci Başlat', color: 'teal' },
] as const;

export function DevicePanel() {
  const st = useStore();

  const handleBreaker = (type: 'motor' | 'control') => {
    const next = !st.breakers[type];
    sfx.breaker(next);
    A.toggleBreaker(type);
  };

  const handleResetTermik = () => {
    sfx.button(true);
    A.termikArm();
  };

  return (
    <div className="inspectorSection" aria-label="Cihaz Kontrolleri">
      {/* 1. Güç Kesicileri */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Pano Kesicileri</span>
          <span className="cardBadge">MCB</span>
        </div>

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel">F3 Motor Kesici (3P)</span>
            <span className="switchDesc">400V 3-Fazlı ana motor beslemesi</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.motor}
            className={`appleSwitch ${st.breakers.motor ? 'on' : ''}`}
            onClick={() => handleBreaker('motor')}
          >
            <span className="switchThumb" />
          </button>
        </div>

        <div className="cardDivider" />

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel">F1 Kumanda Kesici (1P)</span>
            <span className="switchDesc">230V Kumanda devresi (Rc) fazı</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.control}
            className={`appleSwitch ${st.breakers.control ? 'on' : ''}`}
            onClick={() => handleBreaker('control')}
          >
            <span className="switchThumb" />
          </button>
        </div>
      </div>

      {/* 2. Termik Röle */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Termik Röle (e)</span>
          <span className={`statusPill ${st.termikArmed ? 'success' : 'danger'}`}>
            {st.termikArmed ? 'Devrede (Normal)' : 'ATTI (Hata)'}
          </span>
        </div>

        <p className="cardText">
          {st.termikArmed
            ? 'Aşırı yük ve kısa devre koruması aktif. Motor nominal akımı izleniyor.'
            : 'Motor zorlanması veya kısa devre algılandı! Kontak açıldı (e.tc koptu). Devreyi kontrol edip sıfırlayın.'}
        </p>

        <button
          type="button"
          className="appleButton primary"
          disabled={st.termikArmed}
          onClick={handleResetTermik}
        >
          {st.termikArmed ? 'Termik Normal' : 'Termiği Sıfırla (Reset)'}
        </button>
      </div>

      {/* 3. Zaman Rölesi (ZR d2) */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Zaman Rölesi (d2 ZR)</span>
          <span className="timeBadge tabularNum">{(st.zr.delayMs / 1000).toFixed(1)} sn</span>
        </div>

        {/* Mod Segmented */}
        <div className="appleSegmented small">
          <button
            type="button"
            className={`segItem ${st.zr.mode === 'düz' ? 'active' : ''}`}
            onClick={() => A.setZr({ mode: 'düz' })}
          >
            <span className="segText">Düz (Çekmede Gecikme)</span>
          </button>
          <button
            type="button"
            className={`segItem ${st.zr.mode === 'ters' ? 'active' : ''}`}
            onClick={() => A.setZr({ mode: 'ters' })}
          >
            <span className="segText">Ters (Düşmede Gecikme)</span>
          </button>
        </div>

        {/* Süre Slider */}
        <div className="sliderGroup">
          <div className="sliderLabels">
            <span className="sliderSub">Gecikme Süresi</span>
            <span className="sliderValue">{(st.zr.delayMs / 1000).toFixed(1)} saniye</span>
          </div>
          <input
            type="range"
            min={200}
            max={15000}
            step={100}
            value={st.zr.delayMs}
            className="appleRange"
            aria-label="ZR Gecikme Süresi"
            onChange={(e) => A.setZr({ delayMs: Number(e.target.value) })}
          />
          <div className="sliderTicks">
            <span>0.2s</span>
            <span>5s</span>
            <span>10s</span>
            <span>15s</span>
          </div>
        </div>
      </div>

      {/* 4. Kumanda Butonları */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Test Butonları</span>
          <span className="cardBadge">Bas-Tut</span>
        </div>
        <p className="cardText">
          Panodaki butonlara tıklayabileceğiniz gibi buradan da test edebilirsiniz:
        </p>

        <div className="pushbuttonGrid">
          {BUTTONS.map((btn) => {
            const isPressed = st.pressed[btn.id as 'b1'];
            return (
              <button
                key={btn.id}
                type="button"
                className={`tactileButton ${btn.color} ${isPressed ? 'pressed' : ''}`}
                onMouseDown={() => {
                  sfx.button(true);
                  A.pressButton(btn.id as 'b1');
                }}
                onMouseUp={() => {
                  sfx.button(false);
                  A.releaseButton(btn.id as 'b1');
                }}
                onMouseLeave={() => {
                  if (isPressed) {
                    sfx.button(false);
                    A.releaseButton(btn.id as 'b1');
                  }
                }}
                onTouchStart={() => {
                  sfx.button(true);
                  A.pressButton(btn.id as 'b1');
                }}
                onTouchEnd={() => {
                  sfx.button(false);
                  A.releaseButton(btn.id as 'b1');
                }}
              >
                <span className="btnCap">
                  <span className="btnCode">{btn.name}</span>
                </span>
                <span className="btnDesc">{btn.role}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
