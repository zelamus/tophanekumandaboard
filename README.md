<img src="assets/icon.svg" width="64" height="64" alt="">

# tophanekumandaboard — Pano Simülatörü

**Kumanda ve Kontrol Atölyesi 10** (Tophane TEK ve EM L) pano simülatörü: gerçek
seçmeli kumanda-motor kartının (Siemens kontaktör, termik röle, ZR zaman rölesi,
d1 röle) birebir SVG kopyası üzerinde kablo çeker, devreyi çalıştırır; kısa
devre ve motor hatasını görürsün. Devreler tarayıcıya ve sunucuya kaydedilir;
MEB kitabındaki TEMRİN devreleri tek tıkla kurulur.

Oluşturma: [T3 Code](https://t3.codes).

---

## Arayüz — Apple Design & Impeccable Mimarisi

Pano sanatı **birebir korundu** — kullanıcının taahhüt ettiği fotoğrafa sadık Siemens
eğitim panosu (cihaz görselleri, soket koordinatları, baskılar, dokular) **hiç değiştirilmedi**.
Panoyu çevreleyen tüm arayüz kabuğu Apple HIG (Human Interface Guidelines) ve Impeccable
standartlarına göre sıfırdan yeniden tasarlandı:

- **Apple macOS / iPadOS Navigasyon Çubuğu**:
  - Üstte yarı saydam Liquid Glass malzeme (`backdrop-filter: blur(25px) saturate(190%)`),
    1px saç çizgili yansıma kenarları.
  - Apple Segmented Control ile çalışma modları: **⚡ Kablo** (Kablo Çek), **✋ Taşı** (Pan & Zoom), **✂️ Sil** (Kablo Sil).
  - 5 renkli Apple semantic kablo renk paleti (Kırmızı, Siyah, Mavi, Sarı, Yeşil).
  - Geri Al (`⌘Z` / `Ctrl+Z`), Pano Temizle ve F1 (1P) / F3 (3P) kesici durum rozetleri.
  - Açık / Koyu Tema geçişi (Apple System Dark / Light Pro).
- **Apple Inspector (Denetçi Yan Çubuğu)**:
  - 4 ana sekme: **⚡ Cihazlar**, **📚 Devreler**, **💾 Kayıtlar**, **⚙️ Ayarlar**.
  - **Cihazlar**: Gerçek iOS Switch anahtarları (F3 3P motor kesici, F1 1P kumanda kesici),
    Termik aşırı yük hata rozeti & sıfırlama düğmesi, ZR zaman rölesi kadranı & mod seçimi (Düz/Ters),
    ve panodaki butonları bas-tut ile uzaktan tetikleyebilen dokunsal butonlar (S0, S1, S2, S3).
  - **Devreler**: MEB 10. sınıf müfredatı TEMRİN 4, 5 ve 6 için Apple kartları, mini devre şemaları
    ve tek tıkla panoya kurulum.
  - **Kayıtlar**: Bulut (sunucu) ve yerel depolama ayrımı, JSON dışa aktar/içe aktar.
  - **Ayarlar**: Kablo yolu stili (Asılı / Yumuşak / Düz), uç vurgusu, ses efektleri seviyesi.
- **Apple Donanım Teşhis & Durum Çubuğu (Bottom HUD)**:
  - Sol: 3-Fazlı ana besleme LED bankası (L1, L2, L3, Rc, N) ve harici sinyal lambaları (Hs, Hk, Hy).
  - Orta: Canlı telemetri rozetleri (Motor çalışma yönü/uğultu, K1–K4 kontaktör durumu, ZR sayacı,
    kısa devre uyarısı ve anında sıfırlama).
  - Sağ: Bağlamsal imleç rehberi ve klavye ipuçları.
- **Erişilebilirlik ve Akıcılık**:
  - Tüm metin kontrastları WCAG AA (≥ 4.5:1 ve ≥ 3:1) standartlarını karşılar.
  - `:focus-visible` macOS odak halkaları, klavye kısayolları ve `prefers-reduced-motion` desteği.

## Yeni özellikler

| Özellik | Ne yapar |
| --- | --- |
| Kablo yolu ayarı | **Asılı** (varsayılan — gerçek karttaki sarkan kablo, birebir aynı yol matematikli) / **Düz** / **Yumuşak**. Ayar `localStorage`'da ve kayıt belgesinin `ayar` alanında saklanır; eski kayıtlar bozulmaz, belge sürümü `v: 1` kalır. |
| TTR (güç) kablosu | Üç fazlı güç uçlarına özel kablo türü. Daha kalın çizilir (beyaz kesik ışıltı katmanı ile); çekim sırasında tüm geçerli güç uçları ışıldar (halka), imleç ~120 birime yaklaştığında en yakın uç **otomatik yakalanır** (geniş vurma alanı + kesikli nabız halkası); önizleme kabloların gerçek gelecek yolunu gösterir. Güç uç kümesi: sup.R/S/T/U/V/W, e.m1/m2/m3, c1–c4 m1/m2/x1 (her kutbun a/b uçları). |
| Uç vurgusu (hover) | Kablonun üzerine gelince uçları amber halkayla işaretlenir, diğer kablolar kısılır (%22 saydamlık); Görünüm'den kapatılabilir. |
| Zincir çekim | `Shift` + ikinci uç tıklaması: kablo biter ve aynı uç yeni başlangıç olur. |
| Ctrl+Z | Son çekilen kabloyu geri alır. `Delete` seçili kabloyu siler, `Esc` seçimi bırakır. |
| İmleç ipuçları | Soket ve kablolarda insan okur adları: "Besleme R (L1) — sup.R", "K1 güç m1 a — c1.m1.a", "Kabloyu: d1.a1 ⇄ c1.m2.b". |

## Sesler — tarayıcıda sentez

`apps/web/src/audio/sfx.ts` — Web Audio API ile kod içinde kurulur, harici dosya
gerekmez:

- **Kontaktör çek/bırak**: bant geçiren çakı + gövde vuruşu (bırakmada daha tok)
- **d1 röle**: kontaktörden hafif çakı
- **Motor hum**: 50 Hz temel + harmonikler (lowpass), bant geçiren gürültü
  katmanı, 7 Hz'lik sarsıntı; başlamada 0.9 sn yükselir, durmada 0.25 sn sönümle
  söner; ikinci çağrı etki etmez (aynı duruma idempotent)
- **Termik attı**: keskin çakı + alçalan cızırt + gövde vuruşu
- **Kısa devre**: düşük frekans kule + 22 Hz tremolo cızırtı
- **Kesici kol**: tok çift çakı; **buton**: hafif tık (bas/bırak farklı ton)

Ses ilk kullanıcı hareketinde etkinleşir (tarayıcı ses politikası icabı) ve
Görünüm bölümündeki **Sesler** anahtarı + seviye kaydırgacıyla yönetilir.
Ayar kapalıyken çalışan motor döngüsü de sıkıntısız susar.

**Örnek dosyayla değiştirme noktası:** `apps/web/public/sounds/` klasörüne şu
adlarla `.wav` koy; ilk etkileşimde `sfx.loadSamples()` sessizce dener, dosyası
bulunan sesleri sentez yerine kullanır; bulunamayan ad sessizce sentezde kalır):

`contactor.wav relay.wav button.wav breaker.wav termik.wav short.wav motor.wav`
(motor döngü olarak akar).

> Ses üretme yolu araştırması: `npx skills find` ile `noizai/skills@sound-fx`
> (metinden gerçek .wav üretir; ama `NOIZ_API_KEY` ister), `plyght/tonejs-skill`
> (Tone.js soyutlamaları) ve `layerai/skills@layer-audio` bulundu. Uygulama
> kapalı ortamda, anahtarısız çalıştığı için tarayıcı-içi sentez seçildi;
> dosyalı yol yukarıdaki adlarla hazır.

## Panonun dokunulmayan tarafları

- `apps/web/src/board/geometry.ts` — soket kimliği ve koordinatları **aynen**
  (`TERMINALS`, `SOCKET_MAP`, `socketPos`). Eklenenler yalnız türev: `POWER_SOCKETS`,
  `SOCKET_LABEL`, `socketTitle()`.
- `apps/web/src/sim/` — devre çözücü (lambalar, bobinler, kontaklar, termik, ZR,
  kısa devre, motor faz kayıpları) ve pencere API'si `window.__kka` (`A` eylem
  kümesi + `getState`). `behave.mjs` bu API'yle çalışır. Tek esneklik:
  `A.clickTerminal(id, zincir?)` — ikinci argüman **isteğe bağlı**; eski tek
  argümanlı çağrılar aynen çalışır.
- `apps/web/src/styles.css` pano sanatı sınıfları (`.t .s .w .aw .bw .spin`
  vd.) eski değerleriyle korunur; yalnız çerçeve sınıfları yeni yazıldı.

## Çalıştırma

```bash
npm install           # çalışma alanları: apps/web (React 19 + Vite 7), apps/server
npm run dev           # http://localhost:5173  (proxy /api → :8787)
npm run server        # kayıt API — http://localhost:8787 (dosyada saklar)
npm run build         # apps/web: tsc -b && vite build
```

Sunucu kapalıyken kayıtlar yalnız tarayıcıya yazılır (yerel kopya), uygulama
çalışmaya devam eder.

## Davranış testleri

`behave.mjs` gerçek tarayıcıda (Puppeteer) motorun ve panelin davranışını
ölçer ve beklenen değerlerle JSON dumpını basar:

- TEMRİN 4 — S0'la lamba durduruluyor, bırakınca yeniden yanıyor
- TEMRİN 5/6 — mühürlemeli çalıştırma: K1 kilidi, harici yeşil/kırmızı lambalar,
  S0 durdurması, çökme yok
- Kısa devre — termik atar, kontaktör ve motor düşer, kısa uç listesi 8
- ZR düz/ters — sayma, gecikmeli kapanma, enerji kesiminde tutma
- Motor — ileri/geri yön; tek faz ve faz-nötr kayıplarında stuck→termik
- Seçici kutup deneyi (harici kırmızı, faz-nötr) ve salınım (unstable) tespiti
- Kayıt API turu — `POST 201 → list → roundtrip eş (ayar alanıyla) → DELETE 200`

```bash
npm run server        # önce kayıt sunucusu (:8787)
# Chromium yolunu göster (headless):
$env:CHROME = "$env:LOCALAPPDATA\ms-playwright\chromium-1248\chrome-win64\chrome.exe"
node behave.mjs
```

Son satır `PAGE_ERRORS: []` olmalı — sayfa hataları boş demektir.

Ekran görüntüsü için ayrıca: `node shot.mjs <url> <out.png> [g] [y]`
(CHROME env yine gerekli).

## Klasörler

```
apps/web/src/
  board/render.tsx      pano yaşam katmanları; üzerinde vurgu/yaka/önizleme
  board/geometry.ts     soket tablosu (dokunulmadı) + güç-ucu kümesi
  sim/                  çözücü + model + React döngüsü
  audio/sfx.ts          ses sentezi + .wav örnek köprüsü
  store.ts              durum, localStorage, kayıt belgesi (ayar'la)
  ui/                   araçlar · görünüm · cihazlar · kitap devreleri · kayıtlar · durum barı
apps/server/index.mjs   /api/saves — dosya tabanlı CRUD
visual_spec.md          pano görsel envanteri (kilitli ögelerin listesi)
```

Arayüz simgesi: `apps/web/public/icon.svg` (pano motifi); kök `assets/icon.svg`
deponun simge dosyasıdır.
