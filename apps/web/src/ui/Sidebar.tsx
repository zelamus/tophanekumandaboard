import { useState } from 'react';
import { useStore } from '../store';
import { DevicePanel } from './DevicePanel';
import { PresetPanel } from './PresetPanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { IconCpu, IconBook, IconFolder, IconSettings } from './Icons';

type TabId = 'devices' | 'presets' | 'saves' | 'settings';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('devices');
  const st = useStore();

  const TABS: { id: TabId; label: string; icon: typeof IconCpu; count?: number }[] = [
    { id: 'devices', label: 'Cihazlar', icon: IconCpu },
    { id: 'presets', label: 'Devreler', icon: IconBook, count: 3 },
    { id: 'saves', label: 'Kayıtlar', icon: IconFolder },
    { id: 'settings', label: 'Ayarlar', icon: IconSettings },
  ];

  return (
    <aside className={`appleSidebar ${open ? 'open' : ''}`} aria-label="Denetçi Çubuğu">
      {/* Üst Sekme Çubuğu */}
      <div className="sidebarTopBar">
        <div className="appleSegmented fullWidth" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
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

      {/* Kaydırılabilir İçerik */}
      <div className="sidebarScrollable" role="tabpanel">
        {activeTab === 'devices' && <DevicePanel />}
        {activeTab === 'presets' && <PresetPanel />}
        {activeTab === 'saves' && <SavePanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </aside>
  );
}
