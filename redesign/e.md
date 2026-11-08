# e redizayn

## OZET (5 satir)

e (termik röle) bölgesi (lokal x 330..520, y 305..745) gerçek fotoğraf (parts_e.png, kirpim origin foto-px 385,650; LOKAL = foto - (60,345)) üzerinden %100 piksel-dogrulukla tasarlanir. Soketler kilitli: e.tn/tc/m1/m2/m3 a/b, x 356/480, y 551/583/613/644/675, renkler siyah / kirmizi / SARI x 3. Sim kablo katmani yok; cihaza ait govde kablari (ust tel cifti + alt demet) fotoda varsa tasarlanir ve alt demet tn sirasi (y551) uzerinde durur (bej bosluk). Cihabun goerulen HER elemani (vida, kaplama, yazi, ton bandi, golge, kenar isigi) spec'e dökülür; olcum sapmasi hedefi 6px. Komsu (ust, buttons, d1) ile cakisma yok; cihaz bolge siniri 520/745 icinde kalir.

## FOTO vs RENDER BULUNTULAR (madde madde, lokal koordinatli)

- Govde rengi render #2a2a2e; foto daha koyu körpü gri (~#232327). Hafif koyulaştirma önerilir (render zaten çok yakın).
- Üstteki cihaz kablolari render'da kalin siyah döngü (strokeWidth 4.5); foto'da iki daha ince siyah lead yukarı çıkar (kucuk uç ellipsleri var). Çıkış noktaları (govde üstü y+5) ve uç yariçapları foto ile uyarlanacak.
- Alt kablo demeti render'da y≈524'de biter; tn sırası (y551) ile arada bej panel boşluğu bırakır — foto ile uyumlu, korunur.
- Kadran r10 + kırmızı iğne (id "termik-kadran") foto ile uyumlu (bilinen doğrulular, onaylandı). Değiştirilmez.
- "e" etiketi (446,529) fontSize 21, tek bant; foto'da sağda, uyumlu.
- t~Z (404,579) tn(551)/tc(583) arasında; foto'da orta-sol, uyumlu.
- Büyük kutu (360,598,126,104) yalnız 3 sarı sırayı sarar; foto ile uyumlu. Sol kenar 360, sol sütun 356 civarında; simetri gözden geçirilebilir ama kilitlenen uygulama değeri tutulur.
- "Rm şah" (~498,672) silik kalem notu; foto'da sağ kenarda, uyumlu.
- Reset (414,424,r7,kirmizi) + mavi (438,421,r5.5) beyaz yüz üzerinde aynı sıraya konur; foto ile uyumlu.
- Soket renkleri/konumları kilitli (siyah/kirmizi/sarı×3, x356/480, y551..675); bu dosyada dokunulmaz.
- Tüm metinler foto'da okunabilir; okunamayan metin yok.

## SEKILLER (tablo: id | tip | lokal x,y | w,h / r | hex | op | z | not)

| id | tip | lokal x,y | w,h / r | hex | op | z | not |
|---|---|---|---|---|---|---|---|
| e.govde | dikdortgen | 375,345 | 100×135, rx4 | #232327 | 1.00 | 1 | koyu DIN govde (foto körpü gri) |
| e.govdeKenar | kenar-cizgi | 375,345 | 100×135, rx4 | #0f0f12 | 1.00 | 1 | kenar ince siyah, strokeWidth 1.5 |
| ustTerminalBanti | dikdortgen | 378,348 | 94×42, rx2 | #1c1c20 | 1.00 | 2 | koyu üst terminal bandı |
| ustVida | çizgi ×4 | 387/409/431/453, 354→361 | — | #6a6d72 | 1.00 | 2 | 4 dikey vida izi |
| termik-kadran | daire | 410,388 | r10 | #3a3b3f | 1.00 | 2 | koyu ayar kadranı (r10 onaylandı) |
| kadranIgne | çizgi | 410,388 → 416,382 | — | #b9321f | 1.00 | 3 | kırmızı iğne (onaylandı) |
| kadranMerkez | daire | 410,388 | r2 | #17181b | 1.00 | 3 | orta nokta |
| etiketYuzu | dikdortgen | 399,393 | 52×44, rx2.5 | #eceae4 | 1.00 | 2 | küçük beyaz etiket yüzü |
| siemensYazisi | metin | 425,404 | fontSize 7 | #6b6e72 | 1.00 | 3 | "SIEMENS" (okunabilir) |
| termikReset | daire (tıklanabilir) | 414,424 (+tripped -2.5) | r7 | #b9321f | 1.00 | 3 | kırmızı reset, A.termikArm() |
| resetIsigi | daire | 412,421.5 | r2 | #e2614f | 1.00 | 4 | reset vurgu |
| maviDugme | daire | 438,421 | r5.5 | #2a5fa8 | 1.00 | 3 | mavi ayar düğmesi, resetle aynı sıra |
| altTerminalBanti | dikdortgen | 381,433 | 88×20, rx2 | #1c1c20 | 1.00 | 2 | koyu alt terminal bloğu |
| altVidaNoktalari | daire ×4 | 391/409/427/445, 443 | r2.4 | #6a6d72 | 1.00 | 3 | 4 vida noktası |
| telCiftUst | yol ×2 | govde üstü (y+5) → y≈311/313 | — | #1a1a1c | 1.00 | 1 | iki siyah tel lead yukarı |
| kabloDemetiAlt | yol ×2 | govde altı → y≈524 | — | #1a1a1c | 1.00 | 1 | tn(551) üzerine inmez, bej boşluk |
| termicKutu | dikdortgen (boş) | 360,598 | 126×104 | none / #2b2419 | 1.00 | 2 | yalnız 3 sarı sırayı sarar, stroke 1.6 |
| ayracDik | çizgi | 356, 551→583 | strokeWidth 1.6 | #2b2419 | 1.00 | 2 | sol kenar bıçak ayırıcı izi (tn/tc arası) |
| t~Z | metin | 404,579 | fontSize 11 | #2b2419 | 1.00 | 3 | tn/tc arasında, orta-sol |
| rmSah | metin (italik) | 498,672 | fontSize 13 | #6b6350 | 0.40 | 3 | silik kalem notu "Rm şah" |
| etiketE | metin | 446,529 | fontSize 21 | #2b2419 | 1.00 | 4 | "e" tek bant (BoardLabels, öneri) |
| e.tn.a/b | soket | 356/480, 551 | r10.5 | #1c1c20 | 1.00 | 3 | siyah çift (kilitli) |
| e.tc.a/b | soket | 356/480, 583 | r10.5 | #b23a30 | 1.00 | 3 | kırmızı çift (kilitli) |
| e.m1/m2/m3.a/b | soket | 356/480, 613/644/675 | r10.5 | #d9a51e | 1.00 | 3 | sarı çift ×3 (kilitli) |

z-sira notu (e bölgesi): z1 govde/kablolar (cihaz katmani, bastı altta), z2 basim kutu + ayrac (handInk filtresi), z3 soketler + yazilar, z4 etiketE / reset vurgu (en üst). Soketler kablolarin ucunu örter (en sonda çizilir).

## GEOMETRY DEGISIKLIK ONERILERI (sadece gorsel alanlar; soketlere dokunma; BoardLabels icin yalnizca oneri)

- E_UNIT.body fill #2a2a2e → #232327 (foto daha koyu körpü gri); stroke #0f0f12 koru.
- Üst tel çifti: strokeWidth 4.5 → ~3.2, iki lead, uç ellipsleri; çıkış noktaları govde üstü (y+5) olarak kalır.
- termik-kadran (id), r10, kırmızı iğne: koru (bilinen doğrulular, onaylandı).
- Büyük kutu (360,598,126,104) yalnız 3 sarı sırayı sarar: kilitlenen uygulama değeri olarak koru; merkeze (418) simetrikleştirme komşu-spec roundunda tartışılır.
- BoardLabels: "e" (446,529), fontSize 21, tek bant — koru; yalnızca öneri olarak bu dosyada belirtilir.
- Soket koordinatları / ID'leri / renkleri: KİLİTLİ, hiçbir geometri değişikliği yok.
- Diğer komşu (üst, buttons, d1) soketleri/geometrisi bu dosyada değildir.

## TSX (tek pastable kod bloğu)

Aşağıdaki iki fonksiyon, render.tsx'deki mevcut `EUnit({ sim })` ve `ETrayPrints()`'ı tamamen değiştirir. Import yok; `A`, `G`, `MS`, `INK`, `shade`, `Pr*` / `FakeKnob` mevcut kapsamda çağrılabilir kabul edilir. `useStore` kullanımı orijinaldeki gibi kalır (EUnit sim prop üzerinden çalışır). Etkileşim korunur: reset düğmesi clickable + `A.termikArm()` + tripped offset; `id="termik-kadran"` korunur. Soket çizimine (`<Knob>`, `<SocketLabels>`) dokunulmaz.

```tsx
function EUnit({ sim }: { sim: SimOutput | null }) {
  const u = G.E_UNIT;
  const tripped = sim?.dev.termik.armed === false;
  return (
    <g>
      {/* gövde üstünden çıkan tel çifti: foto'da iki ince siyah lead yukarı çıkar (uç ellipsleri) */}
      <path
        d={`M ${u.body.x + 20} ${u.body.y + 5} Q ${u.body.x + 4} ${u.body.y - 16} ${u.body.x + 22} ${u.body.y - 30}`}
        stroke="#1a1a1c"
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${u.body.x + 44} ${u.body.y + 5} Q ${u.body.x + 34} ${u.body.y - 18} ${u.body.x + 50} ${u.body.y - 32}`}
        stroke="#1a1a1c"
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={u.body.x + 22} cy={u.body.y - 30} rx={5} ry={2} fill="#23231f" opacity={0.9} />
      <ellipse cx={u.body.x + 50} cy={u.body.y - 32} rx={5} ry={2} fill="#23231f" opacity={0.9} />
      {/* gövde altından sarkan kablo demeti — tn sırası (y551) üzerine inmez, bej boşluk bırakır */}
      <path
        d={`M ${u.body.x + 18} ${u.body.y + u.body.h - 6} Q ${u.body.x + 2} ${u.body.y + u.body.h + 26} ${u.body.x + 12} ${u.body.y + u.body.h + 40}`}
        stroke="#1a1a1c"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${u.body.x + 34} ${u.body.y + u.body.h - 6} Q ${u.body.x + 26} ${u.body.y + u.body.h + 24} ${u.body.x + 34} ${u.body.y + u.body.h + 38}`}
        stroke="#1a1a1c"
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* foto R5: koyu DIN gövde */}
      <rect
        x={u.body.x}
        y={u.body.y}
        width={u.body.w}
        height={u.body.h}
        rx={4}
        fill="#232327"
        stroke="#0f0f12"
        strokeWidth={1.5}
      />
      {/* üst terminal bandı: iki sıra vida + koyu ayar kadranı */}
      <rect
        x={u.body.x + 3}
        y={u.body.y + 3}
        width={u.body.w - 6}
        height={42}
        rx={2}
        fill="#1c1c20"
        stroke="#0c0c0e"
        strokeWidth={0.8}
      />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={u.body.x + 12 + i * 22}
          y1={u.body.y + 9}
          x2={u.body.x + 12 + i * 22}
          y2={u.body.y + 16}
          stroke="#6a6d72"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      <g id="termik-kadran">
        <circle
          cx={u.topDial.x}
          cy={u.topDial.y}
          r={u.topDial.r}
          fill="#3a3b3f"
          stroke="#0e0e10"
          strokeWidth={1.4}
        />
        <line
          x1={u.topDial.x}
          y1={u.topDial.y}
          x2={u.topDial.x + 6}
          y2={u.topDial.y - 6}
          stroke="#b9321f"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <circle cx={u.topDial.x} cy={u.topDial.y} r={2} fill="#17181b" />
      </g>
      {/* küçük beyaz etiket yüzü: kırmızı reset + mavi düğme aynı sırada */}
      <rect
        x={u.face.x}
        y={u.face.y}
        width={u.face.w}
        height={u.face.h}
        rx={2.5}
        fill="#eceae4"
        stroke="#8f9296"
        strokeWidth={1}
      />
      <text
        x={u.face.x + u.face.w / 2}
        y={u.face.y + 11}
        textAnchor="middle"
        fontFamily={MS}
        fontSize={7}
        fontWeight={700}
        fill="#6b6e72"
      >
        SIEMENS
      </text>
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.termikArm(); }}>
        <circle
          cx={u.reset.x}
          cy={u.reset.y + (tripped ? -2.5 : 0)}
          r={u.reset.r}
          fill="#b9321f"
          stroke="#5e1508"
          strokeWidth={1.6}
        />
        <circle
          cx={u.reset.x - 2}
          cy={u.reset.y - 2.5 + (tripped ? -2.5 : 0)}
          r={2}
          fill="#e2614f"
        />
        <title>Termik sıfırla (e.tc kapatır)</title>
      </g>
      {/* mavi ayar düğmesi — resetle aynı sıra (beyaz yüz) */}
      <circle
        cx={u.blueK.x}
        cy={u.blueK.y}
        r={u.blueK.r}
        fill="#2a5fa8"
        stroke="#173a66"
        strokeWidth={1.3}
      />
      {/* alt terminal bloğu */}
      <rect
        x={u.body.x + 6}
        y={u.body.y + 44 + u.face.h}
        width={u.body.w - 12}
        height={20}
        rx={2}
        fill="#1c1c20"
        stroke="#0c0c0e"
        strokeWidth={0.8}
      />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={u.body.x + 16 + i * 18}
          cy={u.body.y + 44 + u.face.h + 10}
          r={2.4}
          fill="#6a6d72"
        />
      ))}
    </g>
  );
}

function ETrayPrints() {
  const t = G.E_TRAY;
  return (
    <g>
      <rect
        x={t.box.x}
        y={t.box.y}
        width={t.box.w}
        height={t.box.h}
        fill="none"
        stroke={INK}
        strokeWidth={1.6}
      />
      {/* foto: siyah/kırmızı satırları ARASINDA solda dikey ayırıcı (bıçak ağzı), tn ve tc arası */}
      <path d={`M 356 551 L 356 583`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <text
        x={404}
        y={579}
        textAnchor="middle"
        fontFamily={MS}
        fontSize={11}
        fontWeight={700}
        fill={INK}
      >
        t~Z
      </text>
      {/* kenardaki silik kalem yazısı — gerçek kartta "Rm şah" */}
      <text
        x={t.box.x + t.box.w + 12}
        y={t.box.y + 74}
        fontFamily={MS}
        fontSize={13}
        fontStyle="italic"
        fontWeight={600}
        fill="#6b6350"
        opacity={0.4}
      >
        Rm şah
      </text>
      {t.rows.map((row) => {
        const a = t.cols[0];
        const b = t.cols[1];
        const y = row.y;
        if (row.kind === 'ncOpen') return <PrNcOpen key={row.id} a={a} b={b} y={y} />;
        if (row.kind === 'ncT') return <PrNcT key={row.id} a={a} b={b} y={y} />;
        if (row.kind === 'bridge') return <PrNotch key={row.id} a={a} b={b} y={y} />;
        return <PrNc key={row.id} a={a} b={b} y={y} />;
      })}
    </g>
  );
}
```

## SINIR NOTLARI

- Bölge sahiliği: x 330..520, y 305..745. Komsular: üst, buttons, d1.
- Üst komşu: govde üst tel çifti y≈311/313'e kadar çıkar (viewBox üst kenarı 305); 305'ten yukarıya taşmaz, üst komşuyla çakışma yok.
- Alt komşu (d1): alt kablo demeti y≈524'de durur, tn sırası (y551) üzerine inmez (bej boşluk korunur); d1 gövdesi y548'den başlar → e bölgesi ile d1 arasında ~24 px boşluk, çakışma yok.
- Sağ komşu: govde sağ kenarı x475 (375+100), bölge sınırı 520 içinde; büyük kutu sağ kenarı 486, "Rm şah" x498 — hepsi bölge sınırı 520 içinde, taşma yok.
- Sol komşu: büyük kutu sol kenarı 360, dikey ayırıcı x356 — bölge sınırı 330 içinde.
- Kablo katmanı (sim/öğrenci kabloları) bu dosyada yok; sadece cihaza ait govde kablari (üst tel çifti + alt demet) çizilir.
- Tüm yazılar/hex renkler/pozisyonlar fotoğraftan (parts_e.png) orneklenmiştir; tolerans hedefi 6px. "Rm şah" ve "e" metni okunabilir.
- Sınır taşıyan cihaz elementi yok; komşu spec dosyaları (üst, buttons, d1) sonradan redesign klasorunde acilacak, cakisma roundu ayrı aşamada.
