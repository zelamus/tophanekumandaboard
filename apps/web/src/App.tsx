// Ana uygulama frame

import { useEffect } from 'react';
import { useSimLoop } from './sim/useSim';
import { Board } from './board/render';
import { A, useStore } from './store';
import { Toolbar } from './ui/Toolbar';
import { DevicePanel } from './ui/DevicePanel';
import { PresetPanel } from './ui/PresetPanel';
import { SavePanel } from './ui/SavePanel';
import { StatusBar } from './ui/StatusBar';

export function App() {
  useSimLoop();
  const st = useStore();

  // klavye: ESC seçimi, DELETE seçili kabloyu temizler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') A.cancelSel();
      if ((e.key === 'Delete' || e.key === 'Backspace') && st.selCable) A.delSelected();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st.selCable]);

  return (
    <div className="app">
      <aside className="side">
        <header className="brand">
          <h1>Kumanda ve Kontrol Atölyesi</h1>
          <p>Pano Simülatörü — Tophane TEK ve EM L</p>
        </header>
        <div className="sideScroll">
          <Toolbar />
          <DevicePanel />
          <PresetPanel />
          <SavePanel />
        </div>
      </aside>
      <main className="boardZone">
        <Board />
      </main>
      <StatusBar />
    </div>
  );
}
