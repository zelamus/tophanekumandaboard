import { useRef, useState } from 'react';
import { PRESETS } from '../presets';
import { DevicePanel } from './DevicePanel';
import { PresetPanel } from './PresetPanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { IconCpu, IconBook, IconFolder, IconSettings } from './Icons';

type TabId = 'devices' | 'presets' | 'saves' | 'settings';

const TAB_ORDER: TabId[] = ['devices', 'presets', 'saves', 'settings'];

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('devices');
  const tabListRef = useRef<HTMLDivElement>(null);

  const TABS: { id: TabId; label: string; icon: typeof IconCpu; count?: number }[] = [
    { id: 'devices', label: 'Cihazlar', icon: IconCpu },
    // Sayaç kaynakla senkron: koda gömülü 3 değil, gerçek liste boyu (R3 DeepSeek)
    { id: 'presets', label: 'Devreler', icon: IconBook, count: PRESETS.length },
    { id: 'saves', label: 'Kayıtlar', icon: IconFolder },
    { id: 'settings', label: 'Ayarlar', icon: IconSettings },
  ];

  // APG Tabs: ok penceresi, Home/End (R1: roving tabindex eksikti)
  const onTablistKeyDown = (e: React.KeyboardEvent) => {
    const idx = TAB_ORDER.indexOf(activeTab);
    let next: TabId | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = TAB_ORDER[(idx + 1) % TAB_ORDER.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length];
    else if (e.key === 'Home') next = TAB_ORDER[0];
    else if (e.key === 'End') next = TAB_ORDER[TAB_ORDER.length - 1];
    if (next) {
      e.preventDefault();
      setActiveTab(next);
      requestAnimationFrame(() => {
        tabListRef.current
          ?.querySelector<HTMLButtonElement>(`#inspector-tab-${next}`)
          ?.focus();
      });
    }
  };

  return (
    <aside id="inspector" className={`appleSidebar ${open ? 'open' : ''}`} aria-label="Denetçi Çubuğu">
      {/* Üst Sekme Çubuğu (APG Tabs sistemi) */}
      <div className="sidebarTopBar">
        <div
          className="appleSegmented fullWidth"
          role="tablist"
          aria-label="Denetçi sekmeleri"
          ref={tabListRef}
          onKeyDown={onTablistKeyDown}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`inspector-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls="inspector-panel"
                tabIndex={isSelected ? 0 : -1}
                className={`segItem ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                <Icon className="segIcon" />
                <span className="segText">{tab.label}</span>
                {tab.count !== undefined && <span className="tabBadge">{tab.count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kaydırılabilir İçerik — etkin sekmeye bağlı tek panel (APG: panel odaklanabilir kursun demiyor) */}
      <div
        className="sidebarScrollable"
        role="tabpanel"
        id="inspector-panel"
        aria-labelledby={`inspector-tab-${activeTab}`}
      >
        {activeTab === 'devices' && <DevicePanel />}
        {activeTab === 'presets' && <PresetPanel />}
        {activeTab === 'saves' && <SavePanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </aside>
  );
}
