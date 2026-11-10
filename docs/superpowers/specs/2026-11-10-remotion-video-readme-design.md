# Tasarım: Remotion Simülasyon Videosu + Temiz README

Tarih: 2026-11-10
Durum: Onaylandı (kullanıcı sözlü onayı — "Yes, use subagents tho")

## Amaç

1. README'yi taranabilir, sade bir yapıya kavuşturmak (Türkçe).
2. Gerçek pano simülasyonunu Remotion ile videoya dökmek (`apps/video` çalışma alanı).
3. Videoyu (GIF + MP4) ve mevcut ekran görüntülerini README'ye gömmek.

## 1. Remotion videosu — `apps/video`

**Yaklaşım: gerçek pano tekrarı.** Uygulama kodu kopyalanmaz; kompozisyon doğrudan
`apps/web/src` içindeki `Board()` bileşenini, `styles.css` ve saf `RelayEngine`'i içe aktarır.

- **Belirleyici kare sürücüsü:** Remotion kareleri bağımsız (paralel işçilerle) üretir;
  duruml motor bunu bozar. Bunun yerine her kare `simulateAt(frame)` çağırır: motoru
  t=0'dan o kareye kadar sabit 33 ms adımlarla ileri sarar, zaman çizelgesi aksiyonlarını
  (kablo ekle, buton bas/bırak) uygular. Saf fonksiyon → eşzamanlılık güvenli.
- **Mağaza köprüsü:** kare başına hesaplanan durum `A.loadDoc(...)` + `A.pressButton/`
  `releaseButton` + `A.setSim(sim)` ile mağazaya yazılır; `Board()` canlı uygulamadaki
  gibi çizim yapar (lambalar, kontaktör yüzü, ZR sayacı, motor `spin`). `delayRender/`
  `continueRender` el sıkışmasıyla kare görüntü alınmadan önce mağaza güncellemesi
  taahhüt edilir. Sesler doküman `ayar` ile kapalı.
- **Senaryo (~30 sn, 1920×1080, 30 fps):** başlık kartı → TEMRİN 5'in 18 kablosu tek tek
  kurulur (her kabloda alt şerit: `uç ⇄ uç`) → S1 basılı: K1 çeker, motor döner, yeşil
  H2 → bırak: durur, kırmızı H1 → tekrar bas ve final → kapanış kartı.
- **Çıktılar:** `docs/video/simulasyon.mp4` (h264) + `docs/video/simulasyon.gif`
  (GitHub'da satır içi oynatma; ~12 MB üstünde kırpma/ölçek küçültme).
- **Betikler:** kök `npm run video` (Remotion Studio) ve `npm run video:render`
  (MP4 + GIF). Remotion kendi headless Chrome'unu indirir; indirme başarısızsa
  mevcut chrome-headless-shell `--browser-executable` ile kullanılır.
- **Kısıt:** `apps/web` kaynak dosyalarına dokunulmaz (projenin "pano sanatı kilitli"
  taahhüdü). Uyumsuzluk gerekirse `apps/video` yerinde (webpack override/alias) çözülür.

## 2. README yeniden yazımı (Türkçe)

Yapı: simge + başlık + tek paragraf özet → 🎬 simülasyon (GIF satır içi + MP4 bağlantısı)
→ 📸 ekran görüntüleri galerisi (`ui_screens/` altından 6 görsel, 2 sütunlu tablo)
→ Devreler (TEMRİN 4/5/6 tablosu) → Öne çıkanlar (kısabülletler) → Çalıştırma
(dev + video komutları) → Testler (behave.mjs, CHROME env) → Mimari (sıkıştırılmış
klasör haritası, `visual_spec.md` bağlantısı) → T3 Code imzası.

Kırpılanlar: ses sentezi iç detayları (2-3 büllete iner), "dokunulmayan taraflar"
(tek satır), skill araştırma notu (silinir). TTR/kablo özellikleri "Öne çıkanlar"a
yoğunlaştırılır.

## 3. Uygulama

Paralel alt görevler: (A) `apps/video` + render, (B) README. Doğrulama ve commit
ana oturumda. GIF boyutu hedefi ≤ ~12 MB; aşılmursa vurgu bölümü kırpılır.
