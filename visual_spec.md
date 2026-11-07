# Görsel karşılaştırma spec — "Kumanda ve Kontrol Atölyesi 10" panosu

Amaç: web sitesindeki sanal pano çizimini, gerçek eğitim panosuyla birebir tutmaya çalışmak.
Bu dosya GERÇEK fotodan okunmuş yapılandırılmış envanterdir; sitenin çizimi bununla kıyaslanır.

## 0. Kaynaklar

- GERÇEK PANO FOTOĞRAFI (geniş): `C:\Users\Walter\board.jpg`
- GERÇEK PANO FOTOĞRAFI (dar kırpma — koordinat geometrisi bundan modellendi; 1125×2000):
  `C:\Users\Walter\.t3\userdata\attachments\09146663-0317-40ef-a4d5-f8ce17f2032f-bd565656-8ee8-4dee-8096-132eaf6a804f.jpg`
- Resmi iki fotoğraf da AYNI panoyu gösterir (aynı kadraj).
- SİTE ÇİZİMİ (pano SVG, boş pano): `C:\Users\Walter\AppData\Local\Temp\opencode\vis_board_empty.png`
- TAM SAYFA (boş): `C:\Users\Walter\AppData\Local\Temp\opencode\vis_page_empty.png`
- TAM SAYFA (TEMRİN 5 çalışırken): `C:\Users\Walter\AppData\Local\Temp\opencode\vis_page_t5run.png`
- KOD (site gerçekten neyi nereye çiziyor): `apps/web/src/board/geometry.ts` (kilitli soket koordinatları,
  ~115 soket) ve `apps/web/src/board/render.tsx` (cihaz çizimleri + `<BoardLabels/>` etiketleri).

## 1. Koordinat formülü (fotodan geometriye)

Geometri yerel koordinatı = fotoğraf pikseli − (60, 345)   (dar kırpma fotoğrafı için; 1125×2000).
Yani fotoğrafta (560, 720) görünen bir cihaz, geometry.ts'te (500, 375) civarında olur.
geometry.ts'teki koordinatlar KİLİTLİDİR — görsel düzeltmeler çizim/etiket/metin katmanında yapılır;
uç koordinatları ve soket ID'leri değişmez (kablolama kayıtları kırılır).

## 2. Gerçek panonun envanteri (fotodan, soldan sağa / üstten alta)

### Zemin ve çerçeve
- Panel yüzeyi: krem-bej (hardal çalar açık) boya; kullanma izleri, hafif leke/çizik.
- Çerçeve: siyaha yakın koğun ahşap/metal çerçeve, hafif yuvarlatılmış köşeler, pano tüm kenarlardan çerçeveyle çevrili.

### Üst cihaz sırası
1. EMERGENCY butonu (sol üst): büyük SARI yuvarlak plaka + kırmızı mantar buton; "EMERGENCY" siyah harflerle sarı plakada alt yay boyunca.
2. Seçme şalteri: gri/açık yüzey, siyah kol; üzerinde 0 (üst) ve 1 (alt) işaretleri; altında küçük kazıma metin var (okunamıyor).
3. Sinyal/pilot cihazları (5 adet, metal çerçeveli yuvarlak gövdeler): kırmızı, yeşil, amber/sarı, kırmızı, beyaz.

### Pilot altı soket alanı (iki sıra)
- Üst sıra (~5 soket): Siyah=R, Kırmızı=S, Sarı=T, Kırmızı=ikinci R etiketi (sitede "Rc" + siyah soket çizilmiş — RENKİ FARKLI olabilir), siyah soket + ⊗ lamba simgesi.
- Alt sıra: Sarı=U, Sarı=V, Sarı=W, Mavi=Mp; uçta bir siyah soket daha olabilir.

### Sol üst: kesici ve okul yazısı
- 3 kutuplu sigorta/otomat saat: gri metal muhafaza içinde 3 siyah kol → sitede de var (MCB).
- Altında SİYAH bolt BÜYÜK HARF stencil yazısı: "TOPHANE TEKNİK ve ENDÜSTRİ MESLEK LİSESİ" (sitede de var).

### Sol kolon: b1-b4 butonları
- Yuvarlak itici butonlar: b1 KIRMIZI, b2 YEŞİL, b3 KIRMIZI, b4 YEŞİL (siyah çerçeve).
- Her butonun SAĞINDA küçük soket kümesi: 2 kırmızı + 1-2 siyah; buton NC/NO uçlarını gösteren ELLE ÇİZİLMİŞ köprü çizgileri.
- Etiketler b1..b4 kalın siyah harfler, butonların SOLUNDA.

### Orta kolon cihazları (üç ayrı grup)
- **e** (termik röle): gerçek Siemens 3UA tarzı termik röle DUVARDA MONTAJLI — büyük ayar kadranı, gri gövde. ALTTA elle çizilmiş terminaller — foto-crop ile doğrulanmış tek envanter [R5]: en üstte küçük "t~Z" yazısı; tepsi sıraları: 1. sıra SİYAH çift (tn kapı çizimi), 2. sıra KIRMIZI çift (tc), sonra SARI çift ×3 (m1/m2/m3 köprüleri) — 1 siyah + 1 kırmızı + 3 sarı. "e" etiketi kalın sağda; kenarda "Rm şah" kalem notu silik.
- **d1** (takma röle): beyaz DIN gövde — yüzün ALT bölgesinde TEAL etiket bandı (foto R4 crop doğrulandı) — üstten çıkan İKİ SİYAH TEL halkası. Altında sarı çift + sargı simgesi; altında sol KIRMIZI + orta MAVİ + sağ Dİ-KOYU sıra (NC bağlantı çizgileri).
- **d2/ZR** (dijital zaman rölesi): beyaz yüzüklü DİJİTAL kronometre, küçük KIRMIZI 7-segment göstergesi + altında ~4 koyu tuş. Altında (foto-kırpma ile doğrulandı): üstte SİYAH soket çifti (⊤ işaretli hat), altında SARI soket çifti, küçük "ZR" yazılı kutu, sonra iki temas sırası — sol KIRMIZI, orta MAVİ, sağ Dİ-PEN daha KOYU (photo: sağ uç kırmızı DEĞİL, soluncadan koyu/kara; iki çizgiden biri düz, biri dalgalı). [REV R3b: "2 sarı sıra / kırmızı-mavi-kırmızı" yazımı düzeltildi — foto buydu; GLM/DeepSeek foto-okumaları da aynı]

### Motor (sağ üst)
- Gerçek Siemens üç fazlı motor: gümüş-gri, yatay montaj, ŞAFT SOLA bakar (dişli ucu), gövdede soğutma kanatçıkları, sağ FAN KAPAĞI çerçevenin üzerine taşar (foto R4 piksel-ölçüm: kapak sağ ucu ~x965 > çerçeve 961), ÜSTTE büyük KARE klemens kapağı (kabartma SIEMENS yazısı kapak üstünde), gövde altında küçük klemens kutusu ve aşağı kıvrılan BEYAZ kablo (pano girişi ~(765,344)).

### Alt kolonlar: kontaktör bankası C1-C4
- DÖRT gerçek Siemens kontaktörü yatay dizi; KOYU gri gövdeler (foto R4: gövde ön yüz koyu, üstte açık yüz), üstten siyah teller fışkırıyor.
- Her kontaktörün altında sık soket arrays [R4 piksel-ölçüm — ÜSTTEN ALTA: 1 sarı + 2 siyah + 2 kırmızı (her iki sütun) + kutuda 3 siyah]:
  1. üstte SARI bobin çifti (a1/a2),
  2. 2 sıra SİYAH soket (m1/m2), NO köprü baskılı,
  3. 2 sıra KIRMIZI soket (k1/k2) — HER İKİ sütun kırmızı (foto sağ sütun örneği ~(110,42,45)), NC köprü çizgileri,
  4. kutu İÇİNDE 3 sıra SİYAH soket (x1..x3, NO yardımcı),
  5. en altta dekoratif siyah soket çifti (kutunun altında),
  6. bobin satırından alta uzanan MERKEZÎ DİKEY hat (bağlantı noktası daireli) tepsinin ortasında.
- Etiketler kalın siyah (foto-crop doğrulandı: KOYU mürekkep), gövdenin alt-sağ kenarında (~y850-868) — boyutları renderdan büyük: C1 net; C2 kısmen; C3/C4 fotoğrafta kısmen kapalı ("8" gibi görünen glyph C3 olabilir). Sitede dördüne de C1..C4 yazılı.
- C2 ve C3 işlemesi arasında küçük el yazısı rakamlar var.

### Fotoğraf bağlamı (pano DEĞİL — siteye hayır, puanlamaya hayır)
- Panonun ÜSTÜNDE duvara asılı Beyaz MASAÜSTÜ TABLO: elle çizilmiş "c [kontak] d [X] c₁" sembolleri, "MP" ve "CİZEN: ŞÜKRÜ BALCI T12E 263", "ÖĞRT: LEVET BAŞM..." yazısı. Bu duvar tabelası panonun parçası DEĞİL — siteye gelmeyecek.
- Panonun altında ahşap masa, arkada beyaz duvar: SITE svg yalnız pano + çerçevesini gösterir, doğru davranış.

## 3. Sitenin envanteri (vis_board_empty.png'den)

- Krem zemin + koyu çerçeve + gölge ✓
- EMERGENCY sarı yuvarlak plaka + kırmızı mantar; yazı SOL-ALT yayı izler ✓
- Seçme şalteri: geniş açık plaka (~84×80), büyük KOYU kol, 0 üst-orta / 1 sağ-orta ✓
- 5 pilot daire kırmızı/yeşil/amber/kırmızı/beyaz — HEPSİ AYRI AYRI krom çerçeveli; FOTOĞRAFTA TEK METAL ŞERİT YOK, aralarda bej panel görünür [R4: DeepSeek foto doğrulaması — eski "tek şerit" ifadesi yanlıştı]
- MCB: açık bej/beyaz muhafaza, kalın kollar, yanda panel vidaları ✓
- b1-b4 + sağında kırmızı/siyah soket kümesi + köprü çizgileri ✓
- e grubu: KOYU gövdeli 3UA röle (duvar montajı, kadran + kırmızı reset + açık yüz); altında bıçak ayırıcı + t~Z (solda ~382,578) + SİYAH çift (tn) + KIRMIZI çift (tc) + SARI çift ×3 (zigzag termik çentikli köprü); büyük termik kutu baskısı yalnız 3 sarı sırayı sarar ✓
- d1: kısa-dolgun beyaz DIN gövde (~72×132), yüz altında TEAL bant, altta siyah terminal bloğu + sol DIN kıskacı; sarı çift + dik bobin (X); kırmızı-mavi-koyu sıra ✓
- d2: geniş beyaz gövde (~170), üst/alt VİDA terminal sıraları + kırmızı 7-seg + ~4 koyu tuş + siyah çift (üst, ⊤ hat) + sarı çift (dik bobin İÇİNDE "ZR") + kırmızı-mavi-KOYU çift sıra (düz + dalgalı) ✓
- Motor: büyük gövde (~249×240), sağa taşan geniş fan kapağı + ÜSTTE kare SIEMENS klemens kapağı + BEYAZ kablo + sola şaft ✓
- C1-C4: KOYU gövde (foto R4) + açık yüz + alt-sağda AÇIK etiketler; sıralar 1 sarı + 2 siyah + 2 kırmızı + kutuda 3 siyah + merkezî dikey hat ✓
- Üst sağda TAKILAN "SİNYAL LAMBAŞI" kartı: site-ek β (harici lamba simülasyon aracı — panoda yok, bilinçli ekleme; PANODAN puanlamada sayılmasın).

## 4. Puanlama

- 0-10: **10** = gerçek panoyu bilen bir eğitmen, site çizimine baktığında "aynı pano" der; cihazda/sokette/etikette loşudan ayırt edilebilir farklılık kalmamıştır.
- BULGU = eksik cihaz/soket, yanlış konum, yanlış etiket veya metin, yanlış renk, yanlış oran, kaybolan gerçek detay (ör. montaj bulbaları, kablo halkaları, el yazı izleri), fazla kesin yararlı olmayan çizim.
- Şu şeyler puana girmez: WebGL/3D istenmemesi, animasyonlu lamba titreşimi, fotoğrafın dışı (duvar/masa/beyaz таблицa), "SİNYAL LAMBAŞI" yüzen kart.
- Kilitli koordinatlar: geometry.ts'teki soket koordinatları ve ID'leri DEĞİŞMEZ; öneriler çizim stil/etiket katmanında kalmalı.
