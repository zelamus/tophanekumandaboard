import { useCallback, useEffect, useState } from 'react';
import { A } from '../store';
import type { DocShape } from '../store';
import { IconDownload, IconUpload, IconTrash, IconFolder } from './Icons';

interface SaveMeta {
  id: string;
  name: string;
  updatedAt: string;
  source: 'yerel' | 'sunucu';
  doc?: DocShape;
}

const LS_KEY = 'kayitlar';

function localList(): SaveMeta[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SaveMeta[]) : [];
  } catch {
    return [];
  }
}

function saveLocally(meta: SaveMeta): void {
  const list = localList().filter((m) => m.id !== meta.id);
  list.unshift(meta);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function SavePanel() {
  const [name, setName] = useState('');
  const [items, setItems] = useState<SaveMeta[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    const serverItems: SaveMeta[] = [];
    let online = true;
    try {
      const r = await fetch('/api/saves');
      if (!r.ok) throw new Error(String(r.status));
      const rows = (await r.json()) as { id: string; name: string; updatedAt: string }[];
      serverItems.push(...rows.map((row) => ({ ...row, source: 'sunucu' as const })));
    } catch {
      online = false;
    }
    setIsOnline(online);
    const loc = localList().map((m) => ({ ...m, source: 'yerel' as const }));
    setItems([...serverItems, ...loc.filter((l) => !online || !serverItems.some((s) => s.id === l.id))]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doSave = async () => {
    const trimmed = name.trim();
    const nm = trimmed || `Pano Devresi ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    const doc = A.exportDoc();
    const meta: SaveMeta = {
      id: crypto.randomUUID(),
      name: nm,
      updatedAt: new Date().toISOString(),
      source: 'yerel',
      doc,
    };
    saveLocally(meta);
    setName('');
    try {
      const r = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meta.id, name: nm, doc }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setStatusMessage('Buluta ve yerel belleğe kaydedildi');
    } catch {
      setStatusMessage('Tarayıcı yerel hafızasına kaydedildi');
    }
    void refresh();
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const doLoad = async (m: SaveMeta) => {
    try {
      if (m.doc) {
        A.loadDoc(m.doc);
      } else {
        const r = await fetch(`/api/saves/${m.id}`);
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { doc: DocShape };
        A.loadDoc(j.doc);
      }
      setStatusMessage(`"${m.name}" panoya yüklendi`);
    } catch {
      setStatusMessage('Kayıt yüklenirken hata oluştu');
    }
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const doDel = async (m: SaveMeta) => {
    if (m.source === 'yerel') {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(localList().filter((x) => x.id !== m.id)));
      } catch {
        /* ignore */
      }
    }
    try {
      await fetch(`/api/saves/${m.id}`, { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    void refresh();
  };

  const exportJson = () => {
    const doc = A.exportDoc();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.trim() || 'pano-devresi'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as DocShape;
        A.loadDoc(parsed);
        setStatusMessage('JSON dosyası başarıyla panoya yüklendi');
      } catch {
        setStatusMessage('Geçersiz JSON dosyası');
      }
      setTimeout(() => setStatusMessage(''), 3500);
    });
    e.target.value = '';
  };

  return (
    <div className="inspectorSection" aria-label="Devre Kayıtları">
      {/* Kaydet Girişi */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Yeni Kayıt Oluştur</span>
          <span className={`statusPill ${isOnline ? 'success' : 'neutral'}`}>
            {isOnline ? 'Sunucu Aktif' : 'Çevrimdışı'}
          </span>
        </div>

        <div className="inputActionRow">
          <input
            type="text"
            className="appleInput"
            placeholder="Örn: 10-A Otomatik Kumanda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void doSave();
            }}
          />
          <button type="button" className="appleButton primary" onClick={() => void doSave()}>
            Kaydet
          </button>
        </div>

        {statusMessage && <div className="toastNotice" role="status">{statusMessage}</div>}
      </div>

      {/* Kayıtlar Listesi */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Kayıtlı Devreler</span>
          <span className="countBadge">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="emptyState">
            <IconFolder className="emptyIcon" />
            <span className="emptyText">Henüz kayıtlı devre yok</span>
            <span className="emptySub">Panodaki devrenizi kaydetmek için yukarıdaki alanı kullanın.</span>
          </div>
        ) : (
          <div className="savesList">
            {items.map((m) => (
              <div key={m.id} className="saveItem">
                <div className="saveDetails">
                  <span className="saveName" title={m.name}>{m.name}</span>
                  <div className="saveMeta">
                    <span className={`sourceTag ${m.source}`}>
                      {m.source === 'sunucu' ? 'Bulut' : 'Yerel'}
                    </span>
                    <span className="saveTime">
                      {new Date(m.updatedAt).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="saveActions">
                  <button
                    type="button"
                    className="appleButton small"
                    onClick={() => void doLoad(m)}
                    title="Bu devreyi panoya yükle"
                  >
                    Yükle
                  </button>
                  <button
                    type="button"
                    className="appleButton small danger iconOnly"
                    onClick={() => void doDel(m)}
                    title="Bu kaydı sil"
                    aria-label="Kaydı sil"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSON Dışa / İçe Aktar */}
      <div className="appleCard">
        <div className="cardHeader">
          <span className="cardTitle">Dosya İşlemleri</span>
        </div>
        <div className="fileActionRow">
          <button type="button" className="appleButton secondary" onClick={exportJson}>
            <IconDownload className="btnIcon" />
            <span>JSON İndir</span>
          </button>

          <label className="appleButton secondary fileLabel">
            <IconUpload className="btnIcon" />
            <span>JSON Yükle</span>
            <input type="file" accept="application/json" onChange={importJson} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </div>
  );
}
