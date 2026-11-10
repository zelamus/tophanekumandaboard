import { A, useStore, resolveTheme } from '../store';
import type { Mode } from '../store';
import {
  IconWire,
  IconPan,
  IconCut,
  IconUndo,
  IconTrash,
  IconSidebar,
  IconSun,
  IconMoon,
  IconAlert,
} from './Icons';
import { confirmAction } from './confirm';
import { sfx } from '../audio/sfx';

const COLORS: { c: string; name: string }[] = [
  { c: '#ff3b30', name: 'Kırmızı' },
  { c: '#1c1c1e', name: 'Siyah' },
  { c: '#007aff', name: 'Mavi' },
  { c: '#ff9500', name: 'Sarı' },
  { c: '#34c759', name: 'Yeşil' },
];

const MODES: { m: Mode; label: string; icon: typeof IconWire; hint: string }[] = [
  { m: 'kablo', label: 'Kablo', icon: IconWire, hint: 'Kablo Çek — uca tıkla, sonra diğer uca tıkla' },
  { m: 'hareket', label: 'Taşı', icon: IconPan, hint: 'Panoyu Taşı & Kaydır (Tekerlek: Yakınlaştır)' },
  { m: 'sil', label: 'Kablo Sil', icon: IconCut, hint: 'Kablo Sil — kaldırmak istediğin kabloya tıkla' },
];

const THEME_LABEL: Record<string, string> = { dark: 'Koyu', light: 'Açık', system: 'Sistem' };

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const st = useStore();
  const sim = st.sim;
  const pref = st.settings.theme;
  const effective = resolveTheme(pref);

  const handleClearWires = async () => {
    if (st.cables.length === 0) return;
    const ok = await confirmAction({
      title: 'Tüm kablolar temizlensin mi?',
      body: `Panodaki ${st.cables.length} kablo silinecek. Son işlemi Ctrl+Z ile geri alabilirsin.`,
      confirmLabel: 'Temizle',
      cancelLabel: 'İptal',
    });
    if (ok) {
      sfx.breaker(false);
      A.clearWires();
    }
  };

  const toggleMotorBreaker = () => {
    sfx.breaker(!st.breakers.motor);
    A.toggleBreaker('motor');
  };

  const toggleControlBreaker = () => {
    sfx.breaker(!st.breakers.control);
    A.toggleBreaker('control');
  };

  // Görünüm: system'dayken etkili görünümün tersine geç (açık←→koyu)
  const cycleTheme = () => {
    const next = effective === 'light' ? 'dark' : 'light';
    A.setTheme(next);
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
      <div className="headerCenter">
        {/* Mod Segmented Control */}
        <div className="appleSegmented" role="radiogroup" aria-label="Çalışma Modu">
          {MODES.map((item) => {
            const Icon = item.icon;
            const active = st.mode === item.m;
            return (
              <button
                key={item.m}
                type="button"
                role="radio"
                aria-checked={active}
                title={item.hint}
                className={`segItem ${active ? 'active' : ''}`}
                onClick={() => A.setMode(item.m)}
              >
                <Icon className="segIcon" />
                <span className="segText">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="headerDivider" aria-hidden="true" />

        {/* Kablo Renk Paleti */}
        <div className="colorPalette" role="radiogroup" aria-label="Kablo Rengi">
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
              />
            );
          })}
        </div>

        <div className="headerDivider" aria-hidden="true" />

        {/* Hızlı Eylemler: Geri Al, Temizle */}
        <div className="quickActions">
          <button
            type="button"
            className="appleButton iconOnly"
            disabled={st.undoDepth === 0}
            title="Son kablo işlemini geri al (Ctrl+Z / ⌘Z)"
            aria-label="Son kablo işlemini geri al"
            onClick={() => A.undo()}
          >
            <IconUndo />
          </button>
          <button
            type="button"
            className="appleButton iconOnly danger"
            disabled={st.cables.length === 0}
            title="Panodaki tüm kabloları temizle"
            aria-label="Tüm kabloları temizle"
            onClick={() => void handleClearWires()}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Sağ: Kesiciler, Termik Hata ve Panel / Tema Düğmeleri */}
      <div className="headerRight">
        {/* Kesici Hızlı Toggles */}
        <div className="breakerFastGroup" title="Pano ana kesicileri">
          <button
            type="button"
            role="switch"
            aria-checked={st.breakers.motor}
            className={`breakerPill ${st.breakers.motor ? 'active' : ''}`}
            onClick={toggleMotorBreaker}
            title="F3 — 3 Fazlı Motor Kesici (3P 400V)"
            aria-label={`F3 motor kesici ${st.breakers.motor ? 'açık' : 'kapalı'}`}
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
            title="F1 — 1 Fazlı Kumanda Kesici (1P 230V)"
            aria-label={`F1 kumanda kesici ${st.breakers.control ? 'açık' : 'kapalı'}`}
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
          title={
            pref === 'system'
              ? `Görünüm: Sistem (${effective === 'light' ? 'Açık' : 'Koyu'}) — Açık/Koyu gezmek için tıkla`
              : effective === 'light'
                ? 'Koyu moda geç'
                : 'Açık moda geç'
          }
          aria-label={`Görünüm — şu an ${THEME_LABEL[pref]}`}
          onClick={cycleTheme}
        >
          {effective === 'light' ? <IconMoon /> : <IconSun />}
        </button>

        {/* Kenar Çubuğu (Inspector) Aç/Kapa */}
        <button
          type="button"
          className={`appleButton iconOnly ${sidebarOpen ? 'active' : ''}`}
          title="Denetçi Panelini Aç / Kapat"
          aria-label="Denetçi Paneli"
          aria-expanded={sidebarOpen}
          onClick={onToggleSidebar}
        >
          <IconSidebar />
        </button>
      </div>
    </header>
  );
}
