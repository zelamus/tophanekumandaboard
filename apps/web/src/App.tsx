import { useEffect, useRef, useState } from 'react';
import { useSimLoop } from './sim/useSim';
import type { SimOutput } from './sim/model';
import { Board } from './board/render';
import { A, useStore, resolveTheme, applyTheme } from './store';
import { sfx } from './audio/sfx';
import { Header } from './ui/Header';
import { Sidebar } from './ui/Sidebar';
import { StatusBar } from './ui/StatusBar';
import { MobileActionBar } from './ui/MobileActionBar';
import { CanvasOverlay } from './ui/CanvasOverlay';
import { ConfirmDialogHost, isConfirmActive } from './ui/confirm';

export function App() {
  useSimLoop();
  const st = useStore();
  // Tablet/telefonda çekmece kapalı başlar; masaüstünde açık (R1: tablet ilk yük perde)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return window.matchMedia('(min-width: 821px)').matches;
    } catch {
      return true;
    }
  });

  // Mobil çekmece odak yönetimi (R5 DeepSeek #8): açılışta etkin sekme odağı alır
  useEffect(() => {
    if (!sidebarOpen || window.innerWidth > 820) return;
    const id = window.setTimeout(() => {
      document.querySelector<HTMLElement>('.appleSidebar [role="tab"][aria-selected="true"]')?.focus();
    }, 30);
    return () => window.clearTimeout(id);
  }, [sidebarOpen]);

  // Tema özniteliğini documentElement üzerinde senkronize tut
  // ('system' ayarı resolve edilir; applyTheme store'da da çağrılır — tek doğruluk burada)
  useEffect(() => {
    applyTheme(resolveTheme(st.settings.theme));
  }, [st.settings]);

  // System temasında düzen tercihi değişirse yeniden çöz
  useEffect(() => {
    if (st.settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => A.refreshSystemTheme();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [st.settings.theme]);

  // Klavye kısayolları: ESC, Delete, Ctrl+Z / Cmd+Z, Alt+B
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Onay penceresi açıkken tüm global kısayollar sustu (duvar confirm.tsx'te,
      // burada ikinci bir sürgü: R2 DeepSeek #1 — Delete modal arkasında pano değiştirmesin)
      if (isConfirmActive()) return;

      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        // Mobil çekmece açıksa önce o kapansın; seçim iptali ikinci Escape'te (R3 öneri)
        if (sidebarOpen && window.innerWidth <= 820) {
          setSidebarOpen(false);
          // Klavyeyle kapanışta odağı açan düğmeye iade et (R5 DeepSeek #8)
          window.requestAnimationFrame(() => {
            document.querySelector<HTMLButtonElement>('button[aria-controls="inspector"]')?.focus();
          });
          return;
        }
        A.cancelSel();
        return;
      }

      // Alt+B / Option+B ile denetçi çubuğunu aç/kapat (AltGr = Alt+Ctrl, şişirmesin).
      // KeyB via e.code: macOS Option+B bir "∫" üretir, key değeri 'b' olmaz (R3 DeepSeek #12)
      if (e.altKey && !e.ctrlKey && (e.code === 'KeyB' || e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && st.selCable) {
        e.preventDefault();
        A.delSelected();
      }

      // Geri al: ⌘Z / Ctrl+Z; AltGr+Z bir harf üretir, kısayolu ateşlemez (R2 GLM #9)
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        A.undo();
        return;
      }
      // Yinele: ⌘⇧Z / Ctrl+Shift+Z veya Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (
        (e.shiftKey && e.key.toLowerCase() === 'z') || (!e.shiftKey && e.key.toLowerCase() === 'y')
      )) {
        e.preventDefault();
        A.redo();
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // sidebarOpen bağlaçta: Escape'in mobil çekmeceyi kapatması güncel durumu okur
  }, [st.selCable, sidebarOpen]);

  // Ses Sentezi Olayları (kontaktör, röle, motor döngüsü, termik atma, kısa devre)
  const prevSim = useRef<SimOutput | null>(null);
  useEffect(() => {
    const sim = st.sim;
    const prev = prevSim.current;
    prevSim.current = sim;

    sfx.configure(st.settings.sfx.on, st.settings.sfx.vol);
    if (!sim || !prev) return;

    for (const k of ['c1', 'c2', 'c3', 'c4'] as const) {
      if (prev.dev.contactors[k] !== sim.dev.contactors[k]) {
        sfx.contactor(sim.dev.contactors[k]);
      }
    }
    if (prev.dev.d1 !== sim.dev.d1) sfx.relay(sim.dev.d1);
    if (prev.motor.running !== sim.motor.running) sfx.motor(sim.motor.running);
    if (prev.dev.termik.armed && !sim.dev.termik.armed) sfx.termik();
    if (prev.shorts.length === 0 && sim.shorts.length > 0) sfx.short();
  }, [st.sim, st.settings.sfx.on, st.settings.sfx.vol]);

  return (
    // sidebarOpen sınıfı masaüstü katlamayı sürer; ölü dark/light sınıfı kaldırıldı (R2 GLM #12)
    <div className={`appContainer ${sidebarOpen ? 'sidebarOpen' : 'sidebarClosed'}`}>
      {/* 1. Üst Apple macOS Navigasyon Çubuğu */}
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* 2. Ana Çalışma Alanı: Pano + Denetçi Çubuğu */}
      <div className="appBody">
        <main className="boardZone" role="main" aria-label="Eğitim Panosu">
          {/* Pano SVG Katmanı (Birebir dokunulmaz!) */}
          <Board />
          {/* Yüzen Tuval Bilgi Katmanı */}
          <CanvasOverlay />
        </main>

        {/* Apple macOS Denetçi / Yan Çubuk */}
        <Sidebar open={sidebarOpen} />

        {/* Mobil Karartma Perdesi */}
        {sidebarOpen && (
          <div
            className="sidebarBackdrop"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* 3. Alt Apple Donanım Teşhis & Durum Çubuğu */}
      <MobileActionBar />
      <StatusBar />

      {/* Tehlikeli eylem onayları tüm app için tek noktada */}
      <ConfirmDialogHost />
    </div>
  );
}
