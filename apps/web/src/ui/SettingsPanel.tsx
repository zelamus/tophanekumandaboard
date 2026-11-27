import { A, useStore, resolveTheme } from '../store';
import type { ThemePref } from '../store';
import { useRadioGroup } from './radioGroup';
import { IconSpeaker } from './Icons';
import { tr0 } from './format';

const THEME_OPTIONS: { id: ThemePref; label: string }[] = [
  { id: 'system', label: 'Sistem' },
  { id: 'light', label: 'Açık' },
  { id: 'dark', label: 'Koyu' },
];

export function SettingsPanel() {
  const st = useStore();
  const settings = st.settings;

  const themeGroup = useRadioGroup<ThemePref>(['system', 'light', 'dark'], settings.theme, (v) => A.setTheme(v));

  return (
    <div className="inspectorSection" aria-label="Görünüm ve Tercihler">
      {/* 1. Kablo Yolu Stili */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Kablo Çizim Geometrisi</span>
          <span className="sliderValue">{tr0(settings.sag)}</span>
        </div>

        {/* Sürekli sarkma kaydırıcısı: 0 düz hat, ~35 yumuşak, 100 tam asılı */}
        <div className="sliderGroup">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(settings.sag)}
            className="appleRange"
            aria-label="Kablo çizim geometrisi"
            aria-valuetext={`${tr0(settings.sag)} — ${settings.sag === 0 ? 'düz' : settings.sag <= 55 ? 'yumuşak' : 'asılı'}`}
            onChange={(e) => A.setSettings({ sag: Number(e.target.value) })}
          />
          <div className="sliderTicks">
            <span>Düz (0)</span>
            <span>Yumuşak (35)</span>
            <span>Asılı (100)</span>
          </div>
        </div>

        <div className="cardDivider" />

        {/* Uç Vurgusu Switch */}
        <div className="switchRow">
          <div className="switchInfo">
            <span className="switchLabel" id="sw-vurgula">Terminal Uç Vurgusu</span>
            <span className="switchDesc">İmleç kablonun üzerindeyken bağlı soketleri aydınlatır</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.vurgula}
            aria-labelledby="sw-vurgula"
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
            <span className="switchLabel" id="sw-sfx">Cihaz Ses Sentezi</span>
            <span className="switchDesc">Kontaktör çakısı, motor humu, termik atma ve sigorta sesi</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sfx.on}
            aria-labelledby="sw-sfx"
            className={`appleSwitch ${settings.sfx.on ? 'on' : ''}`}
            onClick={() => A.setSettings({ sfx: { ...settings.sfx, on: !settings.sfx.on } })}
          >
            <span className="switchThumb" />
          </button>
        </div>

        {settings.sfx.on && (
          <div className="sliderGroup" style={{ marginTop: 12 }}>
            <div className="sliderLabels">
              <span className="sliderSub" id="sfx-vol-label">Ses Seviyesi</span>
              <span className="sliderValue">%{tr0(settings.sfx.vol * 100)}</span>
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
                aria-labelledby="sfx-vol-label"
                aria-valuetext={`%${tr0(settings.sfx.vol * 100)}`}
                onChange={(e) => A.setSettings({ sfx: { ...settings.sfx, vol: Number(e.target.value) } })}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Görünüm Teması — Sistem/Açık/Koyu (R1: app-görünüm dayatması yerine sistem varsayanı) */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Arayüz Görünümü</span>
          <span className="cardBadge">
            {settings.theme === 'system' ? `Sistem → ${resolveTheme('system') === 'light' ? 'Açık' : 'Koyu'}` : THEME_OPTIONS.find((t) => t.id === settings.theme)?.label}
          </span>
        </div>

        <div className="appleSegmented" role="radiogroup" aria-label="Arayüz görünümü" ref={themeGroup.groupRef}>
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={settings.theme === t.id}
              className={`segItem ${settings.theme === t.id ? 'active' : ''}`}
              onClick={() => A.setTheme(t.id)}
              {...themeGroup.itemProps(t.id)}
            >
              <span className="segText">{t.label}</span>
            </button>
          ))}
        </div>
        <p className="cardText subtle">
          Sistem seçiliyken uygulama, işletim sisteminizin açık/koyu görünüm ayarını izler.
        </p>
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
            <span className="shortcutName">Son Pano İşlemini Geri Al</span>
            <span className="shortcutKey"><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>⌘</kbd><kbd>Z</kbd></span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Geri Alınan İşlemi Yinele</span>
            <span className="shortcutKey"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> / <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd></span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Seçimi İptal Et</span>
            <span className="shortcutKey"><kbd>Esc</kbd></span>
          </div>
          <div className="shortcutRow">
            <span className="shortcutName">Denetçiyi Aç / Kapat</span>
            <span className="shortcutKey"><kbd>Alt</kbd>+<kbd>B</kbd></span>
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
