import { A, useStore } from '../store';
import { sfx } from '../audio/sfx';
import { tr1 } from './format';
import { useRadioGroup } from './radioGroup';

export function DevicePanel() {
  const st = useStore();
  const zrGroup = useRadioGroup<'düz' | 'ters'>(['düz', 'ters'], st.zr.mode, (m) => A.setZr({ mode: m }));

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
      {/* 1. Pano Sigortası */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Pano Sigortası</span>
          <span className="cardBadge">MCB</span>
        </div>

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel" id="sw-paket">Paket Şalter</span>
            <span className="switchDesc">Güç devresi (R/S/T) ana 0/1 şalteri — kapalıyken motor tarafı beslemesiz; kumanda devresi çalışmaya devam eder</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={st.paket}
            aria-labelledby="sw-paket"
            className={`appleSwitch ${st.paket ? 'on' : ''}`}
            onClick={() => {
              sfx.breaker(!st.paket);
              A.setPaket(!st.paket);
            }}
          >
            <span className="switchThumb" />
          </button>
        </div>

        <div className="cardDivider" />

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel" id="sw-f3">F3 Motor Sigortası (3P)</span>
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
            <span className="switchLabel" id="sw-f1">F1 Kumanda Sigortası (1P)</span>
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

        <div className="cardDivider" />

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel" id="sw-estop">Acil Stop</span>
            <span className="switchDesc">Basılıyken TÜM besleme kaynakları kesilir; tekrar tıklayınca bırakılır</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={st.estop}
            aria-labelledby="sw-estop"
            className={`appleSwitch danger ${st.estop ? 'on' : ''}`}
            onClick={() => {
              sfx.breaker(!st.estop);
              A.setEstop(!st.estop);
            }}
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
            ? 'Aşırı yük ve kısa devre koruması aktif — motor nominal akımı izleniyor.'
            : 'Motor zorlanması veya kısa devre algılandı! Kontak açıldı (e.tc koptu). Devreyi kontrol edip sıfırlayın.'}
        </p>

        {!st.termikArmed && (
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

        {/* Mod Segmented — adlı radyo grubu + dinamik açıklama altında (R1: kırpmak yasa) */}
        <div className="appleSegmented small" role="radiogroup" aria-label="ZR Gecikme Modu" ref={zrGroup.groupRef}>
          <button
            type="button"
            role="radio"
            aria-checked={st.zr.mode === 'düz'}
            className={`segItem ${st.zr.mode === 'düz' ? 'active' : ''}`}
            onClick={() => A.setZr({ mode: 'düz' })}
            {...zrGroup.itemProps('düz')}
          >
            <span className="segText">Düz (Çekmede)</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={st.zr.mode === 'ters'}
            className={`segItem ${st.zr.mode === 'ters' ? 'active' : ''}`}
            onClick={() => A.setZr({ mode: 'ters' })}
            {...zrGroup.itemProps('ters')}
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
            aria-valuetext={`${tr1(st.zr.delayMs / 1000)} saniye`}
            onChange={(e) => A.setZr({ delayMs: Number(e.target.value) })}
          />
          <div className="sliderTicks">
            <span>0,2 sn</span>
            <span>5 sn</span>
            <span>10 sn</span>
            <span>15 sn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
