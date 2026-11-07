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
- **e** (termik röle): gerçek Siemens 3UA tarzı termik röle DUVARDA MONTAJLI — büyük ayar kadranı, gri gövde. ALTTA elle çizilmiş terminaller: üstte küçük "t~Z" çifti, sonra üst sıra 2 kırmızı + 2 siyah (kıvrımlı köprü çizgileri), orta sıra 4 sarı, alt sıra 2 sarı. "e" etiketi kalın sağda; kenarda "Rm şah" el yazısı silik.
- **d1** (zaman rölesi): beyaz/mavi DIN ray rölesi, üstten çıkan İKİ SİYAH TEL halkası. Altında sarı çift + sargı simgesi; altında kırmızı-mavi-kırmızı sıra (NC bağlantı çizgileri).
- **d2/ZR** (dijital zaman rölesi): beyaz yüzüklü DİJİTAL kronometre, küçük KIRMIZI 7-segment göstergesi + altında ~4 koyu tuş. Altında (foto-kırpma ile doğrulandı): üstte SİYAH soket çifti (⊤ işaretli hat), altında SARI soket çifti, küçük "ZR" yazılı kutu, sonra iki temas sırası — sol KIRMIZI, orta MAVİ, sağ Dİ-PEN daha KOYU (photo: sağ uç kırmızı DEĞİL, soluncadan koyu/kara; iki çizgiden biri düz, biri dalgalı). [REV R3b: "2 sarı sıra / kırmızı-mavi-kırmızı" yazımı düzeltildi — foto buydu; GLM/DeepSeek foto-okumaları da aynı]

### Motor (sağ üst)
- Gerçek Siemens üç fazlı motor: gümüş-gri, yatay montaj, ŞAFT SOLA bakar (dişli ucu), gövdede soğutma kanatçıkları, altında kablo kutusu ve aşağı kıvrılan siyah kablo.

### Alt kolonlar: kontaktör bankası C1-C4
- DÖRT gerçek Siemens kontaktörü yatay dizi; gümüş gövdeler, üstten siyah teller fışkırıyor.
- Her kontaktörün altında sık soket arrays:
  1. üstte 2 kolon × 4 sıra SARI soket (cihaz bacak soketleri),
  2. 2 sıra KIRMIZI soket (yarısı siyah partnerli), temas köprü çizgileri var,
  3. kutu içinde 3 adet NO temas çizimi, yine kırmızı soketler,
  4. altta siyah soket çiftleri.
- Etiketler kalın siyah, kontaktörlerin altına yakın: C1 net; C2 kısmen; C3/C4 fotoğrafta kısmen kapalı ("8" gibi görünen glyph C3 olabilir). Sitede dördüne de C1..C4 yazılı.
- C2 ve C3 işlemesi arasında küçük el yazısı rakamlar var.

### Fotoğraf bağlamı (pano DEĞİL — siteye hayır, puanlamaya hayır)
- Panonun ÜSTÜNDE duvara asılı Beyaz MASAÜSTÜ TABLO: elle çizilmiş "c [kontak] d [X] c₁" sembolleri, "MP" ve "CİZEN: ŞÜKRÜ BALCI T12E 263", "ÖĞRT: LEVET BAŞM..." yazısı. Bu duvar tabelası panonun parçası DEĞİL — siteye gelmeyecek.
- Panonun altında ahşap masa, arkada beyaz duvar: SITE svg yalnız pano + çerçevesini gösterir, doğru davranış.

## 3. Sitenin envanteri (vis_board_empty.png'den)

- Krem zemin + koyu çerçeve + gölge ✓
- EMERGENCY sarı yuvarlak plaka + kırmızı mantar ✓ (biçim sade)
- Seçme şalteri: küçük siyah yüzey, 0/1 ✓
- 5 pilot daire: kırmızı/yeşil/amber/kırmızı/beyaz, ORTAK ÇERÇE/Başlık yok (gerçekte tek metal şerit içinde dururlar)
- Soket sıraları: R S T Rc ⊗ / U V W Mp ⊗ (Rc = siyah soket)
- MCB + okul yazısı ✓
- b1-b4 + sağında kırmızı/siyah soket kümesi + köprü çizgileri ✓
- e grubu: beyaz kapaklı sade röle kutusu; altında t-z çizimi, 2 kırmızı sıra + 4 sarı + 2 sarı ✓
- d1: beyaz/mavi kutu; sarı çift + sargı; kırmızı-mavi-kırmızı ✓
- d2: beyaz dikdörtgen + kırmızı 7-seg + ~4 koyu tuş + siyah çift (üst, ⊤ hat) + sarı çift + ZR kutu + kırmızı-mavi-KOYU çift sıra (düz + dalgalı) ✓ [REV R3b: foto-açıklamalı]
- Motor: gri kesik gövde + SIEMENS yazısı + sola şaft ✓
- C1-C4: koyu gövde + beyaz kapak + noktalar; altında sarı 2×4 + kırmızı/kutulu NO grupları ✓
- Üst sağda TAKILAN "SİNYAL LAMBAŞI" kartı: site-ek β (harici lamba simülasyon aracı — panoda yok, bilinçli ekleme; PANODAN puanlamada sayılmasın).

## 4. Puanlama

- 0-10: **10** = gerçek panoyu bilen bir eğitmen, site çizimine baktığında "aynı pano" der; cihazda/sokette/etikette loşudan ayırt edilebilir farklılık kalmamıştır.
- BULGU = eksik cihaz/soket, yanlış konum, yanlış etiket veya metin, yanlış renk, yanlış oran, kaybolan gerçek detay (ör. montaj bulbaları, kablo halkaları, el yazı izleri), fazla kesin yararlı olmayan çizim.
- Şu şeyler puana girmez: WebGL/3D istenmemesi, animasyonlu lamba titreşimi, fotoğrafın dışı (duvar/masa/beyaz таблицa), "SİNYAL LAMBAŞI" yüzen kart.
- Kilitli koordinatlar: geometry.ts'teki soket koordinatları ve ID'leri DEĞİŞMEZ; öneriler çizim stil/etiket katmanında kalmalı.
