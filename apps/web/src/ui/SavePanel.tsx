import { useCallback, useEffect, useRef, useState } from 'react';
import { A, getState } from '../store';
import type { DocShape } from '../store';
import { confirmAction } from './confirm';
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
  const fileRef = useRef<HTMLInputElement>(null);

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

  /** Panoda bekleyen iş varken değiştirme/temizlik onayı (R1: dört yıkıcı yol onaysızdı) */
  const guardBoardReplace = useCallback(async (what: string): Promise<boolean> => {
    if (getState().cables.length === 0) return true;
    return confirmAction({
      title: `${what} panoyu değiştirecek`,
      body: `Mevcut ${getState().cables.length} kablonun üzerine yazılacak. Son işlemi Ctrl+Z ile geri alabilirsin.`,
      confirmLabel: 'Değiştir',
      cancelLabel: 'İptal',
    });
  }, []);

  const flash = useCallback((msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3500);
  }, []);

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
      flash('Buluta ve yerel belleğe kaydedildi');
    } catch {
      flash('Tarayıcı yerel hafızasına kaydedildi');
    }
    void refresh();
  };

  const doLoad = async (m: SaveMeta) => {
    const ok = await guardBoardReplace(`"${m.name}" kaydını yüklemek`);
    if (!ok) return;
    try {
      if (m.doc) {
        A.loadDoc(m.doc);
      } else {
        const r = await fetch(`/api/saves/${m.id}`);
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { doc: DocShape };
        A.loadDoc(j.doc);
      }
      flash(`"${m.name}" panoya yüklendi`);
    } catch {
      flash('Kayıt yüklenirken hata oluştu');
    }
  };

  const doDel = async (m: SaveMeta) => {
    const ok = await confirmAction({
      title: `"${m.name}" kaydı silinsin mi?`,
      body: `Bu ${m.source === 'sunucu' ? 'bulut' : 'yerel'} kaydı panodan kalıcı olarak silinir. Bu işlem geri alınamaz.`,
      confirmLabel: 'Kaydı Sil',
      cancelLabel: 'İptal',
    });
    if (!ok) return;
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

  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await guardBoardReplace('JSON dosyasını yüklemek');
    if (!ok) {
      e.target.value = '';
      return;
    }
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as DocShape;
      A.loadDoc(parsed);
      flash('JSON dosyası başarıyla panoya yüklendi');
    } catch {
      flash('Geçersiz JSON dosyası');
    }
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

        <label className="fieldLabel" htmlFor="saveNameInput">Kayıt adı</label>
        <div className="inputActionRow">
          <input
            id="saveNameInput"
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
                    title="Bu devreyi panoya yükle (üzerine yazar)"
                  >
                    Yükle
                  </button>
                  <button
                    type="button"
                    className="appleButton small danger iconOnly"
                    onClick={() => void doDel(m)}
                    title="Bu kaydı sil (kalıcı, geri alınamaz)"
                    aria-label={`"${m.name}" kaydını sil`}
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

          {/* Gerçek düğme + odaklanabilir görsel-gizli input (R1: display:none klavye dışıydı) */}
          <button
            type="button"
            className="appleButton secondary"
            title="JSON dosyasından devre yükle"
            onClick={() => fileRef.current?.click()}
          >
            <IconUpload className="btnIcon" />
            <span>JSON Yükle</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="visuallyHidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => { void importJson(e); }}
          />
        </div>
      </div>
    </div>
  );
}
