import { A, useStore, resolveTheme } from '../store';
import type { Mode } from '../store';
import { useRadioGroup } from './radioGroup';
import { useScrollFade } from './scrollFade';
import {
  IconWire,
  IconPan,
  IconCut,
  IconUndo,
  IconRedo,
  IconTrash,
  IconSidebar,
  IconSun,
  IconMoon,
  IconAlert,
} from './Icons';
import { clearWiresWithConfirm } from './clearWires';
import { sfx } from '../audio/sfx';

const COLORS: { c: string; name: string }[] = [
  { c: '#ff3b30', name: 'Kırmızı' },
  { c: '#1c1c1e', name: 'Siyah' },
  { c: '#007aff', name: 'Mavi' },
  { c: '#ffcc00', name: 'Sarı' }, // L3 lambasının gerçek sarısı (R2: #ff9500 turuncu, "Sarı" etiketi değildi)
  { c: '#34c759', name: 'Yeşil' },
];

const MODES: { m: Mode; label: string; icon: typeof IconWire; hint: string }[] = [
  { m: 'kablo', label: 'Kablo', icon: IconWire, hint: 'Kablo Çek — uca tıklayın, sonra diğer uca tıklayın' },
  { m: 'hareket', label: 'Taşı', icon: IconPan, hint: 'Yuva: yuvaya bağlı son kablonun ucunu eline alır · Kablo: imlece en yakın uç taşınır · Boş zemin/Esc: ucu geri koyar' },
  { m: 'sil', label: 'Kablo Sil', icon: IconCut, hint: 'Kablo Sil — kaldırmak istediğiniz kabloya tıklayın' },
];

const THEME_ORDER: Array<'dark' | 'light' | 'system'> = ['system', 'light', 'dark'];
const THEME_PREF_TR: Record<'dark' | 'light' | 'system', string> = { dark: 'Koyu', light: 'Açık', system: 'Sistem' };

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const st = useStore();
  const sim = st.sim;
  const pref = st.settings.theme;
  const effective = resolveTheme(pref);

  // APG radyo grupları: ok/Home/End + roving tabindex (R2 DeepSeek #10)
  const modeGroup = useRadioGroup<Mode>(['kablo', 'hareket', 'sil'], st.mode, (m) => A.setMode(m));
  const colorGroup = useRadioGroup(COLORS.map((c) => c.c), st.cableColor, (c) => A.setCableColor(c));

  // ≤640'ta şerit gerçekten taşınca sağ-kenar fade ipucu verir (R5 GLM #2)
  const headerCenterRef = useScrollFade<HTMLDivElement>();

  const toggleMotorBreaker = () => {
    sfx.breaker(!st.breakers.motor);
    A.toggleBreaker('motor');
  };

  const toggleControlBreaker = () => {
    sfx.breaker(!st.breakers.control);
    A.toggleBreaker('control');
  };

  // Görünüm tam turu: system → açık → koyu → system (R3 DeepSeek: sistem tercihi
  // tek tıkla ZATEN geri dönülebilir olmalıydı — kafa düğmesi bir yönlüydü)
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(pref) + 1) % 3];
  const appearanceTr = effective === 'light' ? 'Açık' : 'Koyu';
  const cycleTheme = () => {
    A.setTheme(nextTheme);
  };

  return (
    <header className="appHeader" role="banner">
      {/* Sol: Logo ve Başlık */}
      <div className="headerLeft">
        <div className="appBadge" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        </div>
        <div className="appTitles">
          <div className="appTitleRow">
            <span className="appTitle">Tophane Kumanda</span>
            <span className="appVersionBadge">Siemens Lab</span>
          </div>
          <span className="appSub">Kumanda & Motor Kontrol Simülatörü</span>
        </div>
      </div>

      {/* Orta: Mod Seçici, Renkler ve Hızlı Araçlar */}
      <div className="headerCenter" ref={headerCenterRef}>
        {/* Mod Segmented Control */}
        <div className="appleSegmented" role="radiogroup" aria-label="Çalışma Modu" ref={modeGroup.groupRef}>
          {MODES.map((item) => {
            const Icon = item.icon;
            const active = st.mode === item.m;
            return (
              <button
                key={item.m}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={item.label} /* ≤960px'te metin gizlenir de bu isim kalır (R3 GLM #5 / DeepSeek #8) */
                title={item.hint}
                className={`segItem ${active ? 'active' : ''}`}
                onClick={() => A.setMode(item.m)}
                {...modeGroup.itemProps(item.m)}
              >
                <Icon className="segIcon" />
                <span className="segText">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="headerDivider" aria-hidden="true" />

        {/* Kablo Renk Paleti */}
        <div className="colorPalette" role="radiogroup" aria-label="Kablo Rengi" ref={colorGroup.groupRef}>
          {COLORS.map((c) => {
            const active = st.cableColor === c.c;
            return (
              <button
                key={c.c}
                type="button"
                role="radio"
                aria-checked={active}
                title={`${c.name} Kablo`}
                aria-label={`${c.name} kablo rengi`}
                className={`colorDot ${active ? 'active' : ''}`}
                style={{ backgroundColor: c.c }}
                onClick={() => A.setCableColor(c.c)}
                {...colorGroup.itemProps(c.c)}
              />
            );
          })}
        </div>

        <div className="headerDivider" aria-hidden="true" />

        {/* Hızlı Eylemler: Geri Al, Yinele, Temizle */}
        <div className="quickActions">
          <button
            type="button"
            className="appleButton iconOnly"
            disabled={st.undoDepth === 0}
            title="Son kablo işlemini geri al (Ctrl+Z / ⌘Z)"
            aria-label="Son pano işlemini geri al"
            onClick={() => A.undo()}
          >
            <IconUndo />
          </button>
          <button
            type="button"
            className="appleButton iconOnly"
            disabled={st.redoDepth === 0}
            title="Geri alınmış işlemi yinele (Ctrl+Shift+Z / ⌘⇧Z veya Ctrl+Y)"
            aria-label="Geri alınmış işlemi yinele"
            onClick={() => A.redo()}
          >
            <IconRedo />
          </button>
          <button
            type="button"
            className="appleButton iconOnly danger"
            disabled={st.cables.length === 0}
            title="Panodaki tüm kabloları temizle"
            aria-label="Tüm kabloları temizle"
            onClick={() => void clearWiresWithConfirm()}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Sağ: Sigortalar, Termik Hata ve Panel / Tema Düğmeleri */}
      <div className="headerRight">
        {/* Sigorta Hızlı Toggles */}
        <div className="breakerFastGroup" title="Pano ana sigortaları">
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.motor}
            className={`breakerPill ${st.breakers.motor ? 'active' : ''}`}
            onClick={toggleMotorBreaker}
            title="F3 — 3 Fazlı Motor Sigortası (3P 400V)"
            aria-label={`F3 motor sigortası ${st.breakers.motor ? 'açık' : 'kapalı'}`}
          >
            <span className="dot" aria-hidden="true" />
            <span className="lbl">F3 3P</span>
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.control}
            className={`breakerPill ${st.breakers.control ? 'active' : ''}`}
            onClick={toggleControlBreaker}
            title="F1 — 1 Fazlı Kumanda Sigortası (1P 230V)"
            aria-label={`F1 kumanda sigortası ${st.breakers.control ? 'açık' : 'kapalı'}`}
          >
            <span className="dot" aria-hidden="true" />
            <span className="lbl">F1 1P</span>
          </button>
        </div>

        {/* Termik Attı Uyarısı */}
        {!st.termikArmed && (
          <button
            type="button"
            className="termikAlertBadge"
            title="Termik röle aşırı akım veya kısa devreyle attı. Sıfırlamak için tıklayın."
            onClick={() => {
              sfx.button(true);
              A.termikArm();
            }}
          >
            <IconAlert className="alertIcon" />
            <span>Termik Attı · Sıfırla</span>
          </button>
        )}

        <div className="headerDivider" aria-hidden="true" />

        {/* Tema Değiştirici */}
        <button
          type="button"
          className="appleButton iconOnly"
          title={`Görünüm: ${pref === 'system' ? `Sistem (${appearanceTr})` : THEME_PREF_TR[pref]} — tıkla: ${THEME_PREF_TR[nextTheme]} yapar`}
          // Ekran okuyucu ETKİLİ görünümü ve sıradaki durumun duyarsın (R2 Nemotron / R3 DeepSeek)
          aria-label={`Görünüm — şu an ${appearanceTr}${pref === 'system' ? ' (Sistem tercihi)' : ''}, tıkla: ${THEME_PREF_TR[nextTheme]} yapar`}
          onClick={cycleTheme}
        >
          {effective === 'light' ? <IconMoon /> : <IconSun />}
        </button>

        {/* Kenar Çubuğu (Inspector) Aç/Kapa — masaüstünde gerçek katlama (R2 DeepSeek #2) */}
        <button
          type="button"
          className={`appleButton iconOnly ${sidebarOpen ? 'active' : ''}`}
          title="Denetçi Panelini Aç / Kapat"
          aria-label="Denetçi Paneli"
          aria-expanded={sidebarOpen}
          aria-controls="inspector"
          onClick={onToggleSidebar}
        >
          <IconSidebar />
        </button>
      </div>
    </header>
  );
}
