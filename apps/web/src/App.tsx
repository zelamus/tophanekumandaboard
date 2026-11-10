import { useEffect, useRef, useState } from 'react';
import { useSimLoop } from './sim/useSim';
import type { SimOutput } from './sim/model';
import { Board } from './board/render';
import { A, useStore, resolveTheme, applyTheme } from './store';
import { sfx } from './audio/sfx';
import { Header } from './ui/Header';
import { Sidebar } from './ui/Sidebar';
import { StatusBar } from './ui/StatusBar';
import { CanvasOverlay } from './ui/CanvasOverlay';
import { ConfirmDialogHost } from './ui/confirm';

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
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        A.cancelSel();
        return;
      }

      // Alt+B / Option+B ile denetçi çubuğunu aç/kapat
      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && st.selCable) {
        e.preventDefault();
        A.delSelected();
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        A.undo();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st.selCable]);

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
    <div className={`appContainer ${resolveTheme(st.settings.theme)}`}>
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
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

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
      <StatusBar />

      {/* Tehlikeli eylem onayları tüm app için tek noktada */}
      <ConfirmDialogHost />
    </div>
  );
}
