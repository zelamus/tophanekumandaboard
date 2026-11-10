import { useRef } from 'react';
import { A, useStore } from '../store';
import { sfx } from '../audio/sfx';
import { tr1 } from './format';

const BUTTONS = [
  { id: 'b1', name: 'S0', role: 'Durdurma (Stop)', color: 'red' },
  { id: 'b2', name: 'S1', role: 'Başlatma (Start)', color: 'teal' },
  { id: 'b3', name: 'S2', role: 'Yön / Durdur', color: 'red' },
  { id: 'b4', name: 'S3', role: 'İkinci Başlat', color: 'teal' },
] as const;

export function DevicePanel() {
  const st = useStore();
  // Klavyeyle tutulan buton (fare onMouseLeave'in klavye basılı tutmayı bırakmaması için)
  const heldKeyboard = useRef<string | null>(null);

  const handleBreaker = (type: 'motor' | 'control') => {
    const next = !st.breakers[type];
    sfx.breaker(next);
    A.toggleBreaker(type);
  };

  const handleResetTermik = () => {
    sfx.button(true);
    A.termikArm();
  };

  // Bas-tut: klavye (Space/Enter) + fare + dokunma aynı yoldan çalışır (R1: klavye körü)
  const press = (id: 'b1' | 'b2' | 'b3' | 'b4') => {
    if (st.pressed[id]) return;
    sfx.button(true);
    A.pressButton(id);
  };
  const release = (id: 'b1' | 'b2' | 'b3' | 'b4') => {
    if (!st.pressed[id]) return;
    sfx.button(false);
    A.releaseButton(id);
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
            <span className="switchLabel" id="sw-f3">F3 Motor Kesici (3P)</span>
            <span className="switchDesc">400V 3-Fazlı ana motor beslemesi</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.motor}
            aria-labelledby="sw-f3"
            className={`appleSwitch ${st.breakers.motor ? 'on' : ''}`}
            onClick={() => handleBreaker('motor')}
          >
            <span className="switchThumb" />
          </button>
        </div>

        <div className="cardDivider" />

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel" id="sw-f1">F1 Kumanda Kesici (1P)</span>
            <span className="switchDesc">230V Kumanda devresi (Rc) fazı</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.control}
            aria-labelledby="sw-f1"
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

        {st.termikArmed ? (
          // Devrede: eylem yok — düğme yerine durum satırı (2.07:1 "kırık düğme" değil)
          <p className="cardText subtle">Termik durumu: Normal — koruma aktif</p>
        ) : (
          <button type="button" className="appleButton primary" onClick={handleResetTermik}>
            Termiği Sıfırla
          </button>
        )}
      </div>

      {/* 3. Zaman Rölesi (ZR d2) */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Zaman Rölesi (d2 ZR)</span>
          <span className="timeBadge tabularNum">{tr1(st.zr.delayMs / 1000)} sn</span>
        </div>

        {/* Mod Segmented — kısa etiket + altında dinamik açıklama (R1: kırpmak yasa) */}
        <div className="appleSegmented small">
          <button
            type="button"
            role="radio"
            aria-checked={st.zr.mode === 'düz'}
            className={`segItem ${st.zr.mode === 'düz' ? 'active' : ''}`}
            onClick={() => A.setZr({ mode: 'düz' })}
          >
            <span className="segText">Düz (Çekmede)</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={st.zr.mode === 'ters'}
            className={`segItem ${st.zr.mode === 'ters' ? 'active' : ''}`}
            onClick={() => A.setZr({ mode: 'ters' })}
          >
            <span className="segText">Ters (Düşmede)</span>
          </button>
        </div>
        <p className="cardText subtle">
          {st.zr.mode === 'ters'
            ? 'Ters (off-delay): bobin bırakıldığında kontak gecikmeli açılır.'
            : 'Düz (on-delay): bobin çekildiğinde kontak gecikmeli kapanır.'}
        </p>

        {/* Süre Slider */}
        <div className="sliderGroup">
          <div className="sliderLabels">
            <span className="sliderSub" id="zr-delay-label">Gecikme Süresi</span>
            <span className="sliderValue">{tr1(st.zr.delayMs / 1000)} saniye</span>
          </div>
          <input
            type="range"
            min={200}
            max={15000}
            step={100}
            value={st.zr.delayMs}
            className="appleRange"
            aria-labelledby="zr-delay-label"
            onChange={(e) => A.setZr({ delayMs: Number(e.target.value) })}
          />
          <div className="sliderTicks">
            <span>0,2s</span>
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
          Panodaki butonlara tıklayabileceğiniz gibi buradan da test edebilirsiniz (klavyede Space/Enter ile basılı tutun):
        </p>

        <div className="pushbuttonGrid">
          {BUTTONS.map((btn) => {
            const isPressed = st.pressed[btn.id as 'b1'];
            return (
              <button
                key={btn.id}
                type="button"
                className={`tactileButton ${btn.color} ${isPressed ? 'pressed' : ''}`}
                aria-pressed={isPressed}
                aria-label={`${btn.name} ${btn.role} — basılı tut`}
                onMouseDown={() => press(btn.id as 'b1')}
                onMouseUp={() => release(btn.id as 'b1')}
                onMouseLeave={() => {
                  if (heldKeyboard.current !== (btn.id as string)) release(btn.id as 'b1');
                }}
                onTouchStart={() => press(btn.id as 'b1')}
                onTouchEnd={() => release(btn.id as 'b1')}
                onKeyDown={(e) => {
                  if (e.repeat) return;
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    heldKeyboard.current = btn.id as string;
                    press(btn.id as 'b1');
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    heldKeyboard.current = null;
                    release(btn.id as 'b1');
                  }
                }}
                onBlur={() => {
                  if (heldKeyboard.current === (btn.id as string)) {
                    heldKeyboard.current = null;
                    release(btn.id as 'b1');
                  }
                }}
              >
                <span className="btnCap" aria-hidden="true">
                  <span className="btnCode">{btn.name}</span>
                </span>
                <span className="btnDesc" aria-hidden="true">{btn.role}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
