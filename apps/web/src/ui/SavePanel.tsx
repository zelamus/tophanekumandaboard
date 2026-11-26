import { useCallback, useEffect, useRef, useState } from 'react';
import { A, getState, isDocShape } from '../store';
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

function saveLocally(meta: SaveMeta): boolean {
  const list = localList().filter((m) => m.id !== meta.id);
  list.unshift(meta);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 50)));
    return true;
  } catch {
    // Kota/kapalı depolama yutulmaz — çağıran dürüst bildirir (R3 DeepSeek #5)
    return false;
  }
}

/** randomUUID yalnız güvenli bağlamda var — düz HTTP LAN'da kayıt asla patlamasın (R3 DeepSeek #6) */
function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* düş */
  }
  return `pdu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function SavePanel() {
  const [name, setName] = useState('');
  const [items, setItems] = useState<SaveMeta[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | null>(null);

  // Bildirim zamanlayıcısı bileşen değişince temizlenir (R2 GLM #10)
  useEffect(() => () => {
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
  }, []);

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
      title: `${what} mevcut panoyu değiştirir`,
      body: `Panodaki ${getState().cables.length} kablo kalkacak. Panoyu ve motora ait sigorta/ZR/termik durumunu Ctrl+Z ile geri alabilirsiniz.`,
      confirmLabel: 'Devreyi Yükle',
      cancelLabel: 'İptal',
    });
  }, []);

  const flash = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setStatusMessage(''), 3500);
  }, []);

  const doSave = async () => {
    if (isSaving) return; // çift gönderim: Enter/uçakta ikinci tık (R3 GLM öneri)
    setIsSaving(true);
    try {
      const trimmed = name.trim();
      const nm = trimmed || `Pano Devresi ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      const doc = A.exportDoc();
      const meta: SaveMeta = {
        id: newId(),
        name: nm,
        updatedAt: new Date().toISOString(),
        source: 'yerel',
        doc,
      };
      const localOk = saveLocally(meta);
      let serverOk = true;
      try {
        const r = await fetch('/api/saves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: meta.id, name: nm, doc }),
        });
        if (!r.ok) throw new Error(String(r.status));
      } catch {
        serverOk = false;
      }
      // Dürüst tablo: ikimiz / biri / hiçkimiz — beyaz yalan yok (R3 DeepSeek #5)
      if (serverOk && localOk) flash('Buluta ve yerel belleğe kaydedildi');
      else if (serverOk) flash('Buluta kaydedildi; yerel bellek yazılamadı');
      else if (localOk) flash('Tarayıcı yerel belleğine kaydedildi');
      else flash('Kaydedilemedi — sunucuya ve tarayıcı belleğine yazılamadı');
      if (serverOk || localOk) setName('');
      void refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const doLoad = async (m: SaveMeta) => {
    try {
      // Kayıt içeriğini ONAYDAN ÖNCE getir ve doğrula (R2 DeepSeek #12)
      let doc: DocShape | null = null;
      if (m.doc) {
        doc = m.doc;
      } else {
        const r = await fetch(`/api/saves/${m.id}`);
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { doc?: DocShape };
        doc = j.doc ?? null;
      }
      if (!isDocShape(doc)) {
        flash('Kayıt bozuk: geçersiz devre biçimi');
        return;
      }
      const ok = await guardBoardReplace(`"${m.name}" kaydını yüklemek`);
      if (!ok) return;
      if (A.loadDoc(doc)) {
        flash(`"${m.name}" panoya yüklendi`);
      } else {
        flash('Kayıt yüklenemedi: geçersiz devre biçimi');
      }
    } catch {
      flash('Kayıt yüklenirken hata oluştu');
    }
  };

  const doDel = async (m: SaveMeta) => {
    const ok = await confirmAction({
      title: `"${m.name}" kaydı silinsin mi?`,
      // Kayım panoyu değil kayıt listesini etkiler; dilbilgisi düz (R3 GLM #1 / DeepSeek #10)
      body: `Bu ${m.source === 'sunucu' ? 'bulut kaydı' : 'yerel kayıt'} kalıcı olarak silinecek; bu işlem geri alınamaz. Panodaki devre etkilenmez.`,
      confirmLabel: 'Kaydı Sil',
      cancelLabel: 'İptal',
    });
    if (!ok) return;
    // Tek kimlik iki mağazada yaşayabilir (kaydet hem bulutu hem yereli yazar):
    // silme İKİSİNİ de hedefler — biri kalırsa satır sonraki yenilemede
    // "dirilmiş" gibi görünür (R4 DeepSeek #6)
    if (navigator.onLine === false) {
      // Tarayıcı çevrimdışı diyorsa rozet de aynı şeyi söylemeli — yeşil kalmaz
      // (R6 DeepSeek #1 + Nemotron #1: iki koltuk bağımsız buldu)
      setIsOnline(false);
      // Son bilinen listede bulut ikizi yoksa "bulut kopyası" iddiası yalan olur (R6 GLM #1)
      const hasTwin = items.some((x) => x.id === m.id && x.source === 'sunucu');
      if (m.source === 'yerel') {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(localList().filter((x) => x.id !== m.id)));
        } catch {
          flash('Silinemedi — yerel bellek yazılamadı');
          return;
        }
        flash('Yerelden silindi' + (hasTwin ? '; bulut kopyası çevrimdışıyken silinemez' : ''));
      } else {
        flash('Silinemedi — çevrimdışı olabilirsiniz');
        return;
      }
    } else {
      let serverOk = false;
      try {
        const r = await fetch(`/api/saves/${m.id}`, { method: 'DELETE' });
        serverOk = r.ok || r.status === 404;
        if (!serverOk) {
          // Sunucu CEVAP verdiyse "erişilemiyor" ezberi yanlış olur (R5 GLM #1 / Nemotron öneri)
          if (r.status >= 500) flash(`Silinemedi — sunucu hata verdi (${r.status})`);
          else flash('Silinemedi — sunucuya erişilemiyor');
          return;
        }
        let localOk = true;
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(localList().filter((x) => x.id !== m.id)));
        } catch {
          localOk = false;
        }
        // Başarılı silme dürüst teyit edilir — diğer yolların bildirim deseniyle
        // uyumlu; satırın yok oluşu tek başına ipucu sayılmaz (R5 GLM öneri)
        if (localOk) flash('Kayıt silindi');
        else flash('Sunucudan silindi; yerel bellek kopyası silinemedi');
      } catch {
        // Ağ düştü: "Sunucu Aktif" rozası hemen yeşilden çıkmalı (R5 DeepSeek #3)
        setIsOnline(false);
        if (m.source === 'yerel') {
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(localList().filter((x) => x.id !== m.id)));
          } catch {
            flash('Silinemedi — yerel bellek yazılamadı');
            return;
          }
          flash('Yerelden silindi; bulut kopyası çevrimdışıyken silinemez');
        } else {
          flash('Silinemedi — çevrimdışı olabilirsiniz');
          return;
        }
      }
    }
    // Komşu satırda odağı koru: silinen kaydın liste dizini refresh'ten ÖNCE
    // yakalanır; satır kalkınca bir üstteki iş başına gelir, liste boşaldıysa
    // ad alanına düşer (R4 GLM #2 — önceden her zaman ilk satıra gidiyordu)
    const deletedIdx = Math.max(0, items.indexOf(m));
    await refresh();
    requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.saveItem'));
      const row = rows[Math.min(deletedIdx, rows.length - 1)];
      const btn = row?.querySelector<HTMLButtonElement>('button');
      if (btn) btn.focus();
      else document.getElementById('saveNameInput')?.focus();
    });
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
    // Sıra: oku → şema doğrula → onay sor → uygula; her koşuda dürüst bildirim (R2 DeepSeek #12)
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      flash('Geçersiz JSON dosyası');
      e.target.value = '';
      return;
    }
    if (!isDocShape(parsed)) {
      flash('JSON yüklenemedi: geçersiz devre biçimi');
      e.target.value = '';
      return;
    }
    const doc = parsed as DocShape;
    const ok = await guardBoardReplace('JSON devresini yüklemek');
    if (!ok) {
      e.target.value = '';
      return;
    }
    if (A.loadDoc(doc)) {
      flash('JSON dosyası başarıyla panoya yüklendi');
    } else {
      flash('JSON yüklenirken hata oluştu');
    }
    e.target.value = '';
  };

  return (
    <div className="inspectorSection" aria-label="Devre Kayıtları">
      {/* Panel düzeyinde kalıcı canlı bölge — boşken :empty ile gizli (R3 DeepSeek #3) */}
      <div className="toastNotice" role="status" aria-live="polite">{statusMessage}</div>

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
              if (e.key === 'Enter' && !isSaving) void doSave();
            }}
          />
          <button
            type="button"
            className="appleButton primary"
            disabled={isSaving}
            onClick={() => void doSave()}
          >
            Kaydet
          </button>
        </div>
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
                    aria-label={`"${m.name}" kaydını panoya yükle`}
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
