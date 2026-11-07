// Kayıt paneli — sunucu (http://localhost:8787) + tarayıcı deposu.
// Sunucuya ulaşılamazsa yerel kayıt çalışmaya devam eder.

import { useCallback, useEffect, useState } from 'react';
import { A } from '../store';
import type { DocShape } from '../store';

interface SaveMeta { id: string; name: string; updatedAt: string; source: 'yerel' | 'sunucu'; doc?: DocShape; }

const LS_KEY = 'kayitlar';

function localList(): SaveMeta[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SaveMeta[]) : [];
  } catch { return []; }
}

function saveLocally(meta: SaveMeta): void {
  const list = localList().filter((m) => m.id !== meta.id);
  list.unshift(meta);
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 50))); } catch { /* yoksay */ }
}

export function SavePanel() {
  const [name, setName] = useState('');
  const [items, setItems] = useState<SaveMeta[]>([]);
  const [note, setNote] = useState<string>('');

  const refresh = useCallback(async () => {
    const errs: SaveMeta[] = [];
    let online = true;
    try {
      const r = await fetch('/api/saves');
      if (!r.ok) throw new Error(String(r.status));
      const rows = (await r.json()) as { id: string; name: string; updatedAt: string }[];
      errs.push(...rows.map((row) => ({ ...row, source: 'sunucu' as const })));
    } catch { online = false; }
    const loc = localList().map((m) => ({ ...m, source: 'yerel' as const }));
    setItems([...errs, ...loc.filter((l) => !online || !errs.some((s) => s.id === l.id))]);
    setNote(online ? 'Sunucu bağlantısı var' : 'Sunucu yok — kayıtlar tarayıcıda');
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const doSave = async () => {
    const nm = name.trim() || `Pano ${new Date().toLocaleTimeString('tr-TR')}`;
    const doc = A.exportDoc();
    const meta: SaveMeta = { id: crypto.randomUUID(), name: nm, updatedAt: new Date().toISOString(), source: 'yerel', doc };
    saveLocally(meta);
    setName('');
    try {
      const r = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meta.id, name: nm, doc }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setNote('Kayıt sunucuya da yazıldı');
    } catch {
      setNote('Sunucu yok — tarayıcıya kaydedildi');
    }
    void refresh();
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
      setNote(`"${m.name}" yüklendi`);
    } catch {
      setNote('Yükleme başarısız');
    }
  };

  const doDel = async (m: SaveMeta) => {
    if (m.source === 'yerel') {
      try { localStorage.setItem(LS_KEY, JSON.stringify(localList().filter((x) => x.id !== m.id))); } catch { /* yoksay */ }
    }
    try { await fetch(`/api/saves/${m.id}`, { method: 'DELETE' }); } catch { /* sunucu yoksa yoksay */ }
    void refresh();
  };

  return (
    <section className="panel">
      <h3>Kayıtlar</h3>
      <div className="row">
        <input
          className="txt"
          placeholder="Kayıt adı (ör. 10-B Ali)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void doSave(); }}
        />
        <button className="btnS on" onClick={() => void doSave()}>Kaydet</button>
      </div>
      <div className="note">{note}</div>
      <div className="saves">
        {items.length === 0 && <div className="hint">Henüz kayıt yok.</div>}
        {items.map((m) => (
          <div key={m.id} className="saveRow">
            <span className="sname" title={m.updatedAt}>{m.name}</span>
            <span className={`tag ${m.source}`}>{m.source}</span>
            <button className="btnS" onClick={() => void doLoad(m)}>Yükle</button>
            <button className="btnS danger" onClick={() => void doDel(m)}>Sil</button>
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btnS" onClick={() => {
          const doc = A.exportDoc();
          const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${name.trim() || 'pano'}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        }}>Dosyaya indir (JSON)</button>
        <label className="btnS fileBtn">
          Dosyadan yükle
          <input
            type="file" accept="application/json" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              f.text().then((t) => {
                try {
                  const j = JSON.parse(t) as DocShape;
                  A.loadDoc(j);
                  setNote('Dosyadan yüklendi');
                } catch { setNote('Dosya okunamadı'); }
              });
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      <div className="hint">
        Kablolar, kesici ve zaman rölesi ayarı kayıtla birlikte saklanır.
      </div>
    </section>
  );
}
