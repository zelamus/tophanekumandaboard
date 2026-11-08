import { A, useStore } from '../store';
import type { PathStyle } from '../store';
import { IconSpeaker, IconMoon, IconSun } from './Icons';

const PATH_STYLES: { id: PathStyle; label: string; desc: string }[] = [
  { id: 'asılı', label: 'Asılı', desc: 'Gerçek eğitim kartındaki sarkan doğal kablo yerçekimi eğrisi' },
  { id: 'yumuşak', label: 'Yumuşak', desc: 'Sakin ve okunaklı, hafif kavisli bağlantı' },
  { id: 'düz', label: 'Düz', desc: 'Terminaller arasında dosdoğru CAD hattı' },
];

export function SettingsPanel() {
  const st = useStore();
  const settings = st.settings;
  const isLight = settings.theme === 'light';

  return (
    <div className="inspectorSection" aria-label="Görünüm ve Tercihler">
      {/* 1. Kablo Yolu Stili */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Kablo Çizim Geometrisi</span>
        </div>

        <div className="appleSegmented">
          {PATH_STYLES.map((ps) => (
            <button
              key={ps.id}
              type="button"
              className={`segItem ${settings.pathStyle === ps.id ? 'active' : ''}`}
              onClick={() => A.setSettings({ pathStyle: ps.id })}
            >
              <span className="segText">{ps.label}</span>
            </button>
          ))}
        </div>

        <p className="cardText subtle">
          {PATH_STYLES.find((ps) => ps.id === settings.pathStyle)?.desc}
        </p>

        <div className="cardDivider" />

        {/* Uç Vurgusu Switch */}
        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel">Terminal Uç Vurgusu</span>
            <span className="switchDesc">İmleç kablonun üzerindeyken bağlı soketleri aydınlatır</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.vurgula}
            className={`appleSwitch ${settings.vurgula ? 'on' : ''}`}
            onClick={() => A.setSettings({ vurgula: !settings.vurgula })}
          >
            <span className="switchThumb" />
          </button>
        </div>
      </div>

      {/* 2. Ses Efektleri */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Mekanik ve Akustik Sesler</span>
          <span className={`statusPill ${settings.sfx.on ? 'success' : 'neutral'}`}>
            {settings.sfx.on ? 'Açık' : 'Kapalı'}
          </span>
        </div>

        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel">Cihaz Ses Sentezi</span>
            <span className="switchDesc">Kontaktör çakısı, motor humu, termik atma ve kesici sesi</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sfx.on}
            className={`appleSwitch ${settings.sfx.on ? 'on' : ''}`}
            onClick={() => A.setSettings({ sfx: { ...settings.sfx, on: !settings.sfx.on } })}
          >
            <span className="switchThumb" />
          </button>
        </div>

        {settings.sfx.on && (
          <div className="sliderGroup" style={{ marginTop: 12 }}>
            <div className="sliderLabels">
              <span className="sliderSub">Ses Seviyesi</span>
              <span className="sliderValue">{Math.round(settings.sfx.vol * 100)}%</span>
            </div>
            <div className="volumeControlRow">
              <IconSpeaker className="volumeIcon" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfx.vol}
                className="appleRange"
                aria-label="Ses Düzeyi"
                onChange={(e) => A.setSettings({ sfx: { ...settings.sfx, vol: Number(e.target.value) } })}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Görünüm Teması */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Arayüz Görünümü</span>
        </div>

        <div className="appleSegmented">
          <button
            type="button"
            className={`segItem ${!isLight ? 'active' : ''}`}
            onClick={() => A.setTheme('dark')}
          >
            <IconMoon className="segIcon" />
            <span className="segText">Koyu Stüdyo</span>
          </button>
          <button
            type="button"
            className={`segItem ${isLight ? 'active' : ''}`}
            onClick={() => A.setTheme('light')}
          >
            <IconSun className="segIcon" />
            <span className="segText">Açık</span>
          </button>
        </div>
      </div>

      {/* 4. Klavye Kısayolları */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Klavye Kısayolları</span>
          <span className="cardBadge">macOS / Windows</span>
        </div>

        <div className="shortcutList">
          <div className="shortcutRow">
            <span className="shortcutName">Zincirleme Kablo Çek</span>
            <span className="shortcutKey"><kbd>Shift</kbd> + Tık</span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Seçili Kabloyu Sil</span>
            <span className="shortcutKey"><kbd>Delete</kbd> / <kbd>Backspace</kbd></span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Son Eylemi Geri Al</span>
            <span className="shortcutKey"><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>⌘</kbd><kbd>Z</kbd></span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Seçimi İptal Et</span>
            <span className="shortcutKey"><kbd>Esc</kbd></span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Yakınlaştır / Kaydır</span>
            <span className="shortcutKey">Fare Tekerleği / Sürükle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
