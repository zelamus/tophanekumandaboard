# buttons redizayn

## OZET (5 satır)

1. Bölge b1–b4, foto-crop (parts_buttons.png, 230×410, lokal x 70..300 / y 345..755, 1:1 px) ile satır-satır yeniden ölçüldü; her sıra: kir leke grubu (z0) → köprü baskısı (z1, handInk) → düğme altı gölge (z1.5) → bezel yığını (z2) → etkileşim çemberi (z3, r13 basılı / r17 boşta, `<title>` + pointer handlers AYNEN) → cap içi açık dişler (z3.2). Kablo katmanı YOK; soket koordinat/id/renk KİLİTLİ.
2. Foto cap kütlesi r≈19.5 + koyu dişli yaka (knurl) + açık dış rim; mevcut render'da sadece r17 düz disk + r26 tek siyah disk var. Cap gradient'leri: KIRMIZI #8e2a34→#a0353f(46%)→#b34450 (aşağı doğru aydınlanan gloss, dikey), TEAL #026260→#006f69(52%)→#147d76 (sol-üst→sağ-alt çapraz).
3. b2/b4 foto rengi TEAL (#006f69 merkez) — mevcut render #2f9e4f YEŞİL hatalı (doğrulanmış aday 1). Cap dome profili + kenar "derzi" foto'da VAR: koyu dişli yaka + skirt (doğrulanmış aday 2).
4. "b4 üstü işaret" VAR: b3–b4 arası kurşun garabeti lokal ~x 128..165 / y 604..630 (#94866b..#9b9679); mevcut render versiyonu ~30px solda → öneri (kurşun katmanı global). Etiketler (BoardLabels, global): foto fontSize≈23 / merkez x≈108; mevcut 21 / x84 → öneri.
5. Bej panel tonu foto'da bu bölgede #b3b19a..#c0b99c (render panelSkin daha parlak) — global-panel notu; alt sınırda y≥693 koyu kontaktör kablo domeleri komşu bölgeye ait (sadece not).

## FOTO vs RENDER BULUNTULAR (lokal koordinatlı)

- Doğrulanmış 4 aday:
  - **b2/b4 gerçek renk** = teal. Örneklem: merkez (155,488) #006f69, sol-üst #026260, sağ-alt #147d76, cap kenar içi açık dişler ~#5fb2a1. Render'da `#2f9e4f` — düzeltilecek.
  - **Cap dome profili/derz**: foto kubbe gloss'lu (kırmızı: alt daha açık #b34450), cap çevresinde ~2–4px KOYU DİŞLİ yaka (knurl r≈19–21.7) + dışında açık metal rim (~r22.6, üst-sol #b4b5ad). Render'da derz yok. Etkileşim ölçeği (13/17) korunarak statik skirt+yaka+dişler ile kapanacak.
  - **"b4 üstü işaret"**: VAR. zb_top/zb_all: b3–b4 arasında kurşun scrawl kümesi lokal (x 128..165, y 604..630), tonlar #94866b..#9b9679; üstte b1'in üstünde ayrı açık kurşun imza/garabet ~ (x ~100..190, y 350..375) "(okunmuyor)". Render'daki "11"+kıvılcım (122,622)/(100..116,606..613) foto'daki yerden ~30px solda → sınır notu/öneri (kurşun notları global katman).
  - **Taban gölge/ton**: düğme altı yumuşak gölge merkez ~ (b.x−2, b.y+29), rx≈26 ry≈7, op≈0.13 (ör. (154,433) #9a9581, (170,435) #b0aa94; m-run y421). Soket kümeleri arkasında kir lekesi: (237,b.y+3) op~0.16 #6b6555, (287,b.y+4) op~0.13 #55503f (ör. (235,399) #8f897b, (235,488) #64635e, (266,399) #a2a296, (298,488) #a6a289 — dışı açık, çekirdek koyu). Render'da ikisi de yok.
- Köprü baskı topografyası (render TAMAMEN yanlış): mevcut render dikey kırmızı kol (x220, b.y±28) + siyah sütuna çatal/kıvrım eğileri çiziyor; foto'da dikey kol + çatal YOK. Foto (b1 sırası): açık kutu (193.4..200.2 × b.y−7.4..+10), dolu T-post bar (x 209.8..213.4, b.y−9.8..+10.6), çizgi üstünde sağ ucuna ok ucu (~206→213.4, h≈4.8), ÇİFT yatay hat (b.y−1.2 sw2.2 ve b.y+2.4 sw≈1.9) x213.4→271.5, siyah sütun yanına iki kıvrım (halka üst (279.4,b.y−7), alt (281.5,b.y+9)) ve sütun bağlantı halkaları: kırmızı (219.6,b.y−7)/(220.4,b.y+6.6), siyah (279.4,b.y−7)/(281.5,b.y+9), r≈3.2–3.4.
- Etiketler: "b1" x97..119 / b.y+1.5..+9.5 (ascender h≈17 → fontSize≈23–24), "b2" x100..113, "b3" x103..116, "b4" x99..119 (en geniş). Hepsinde merkez ≈x108. Render: x84, fontSize21 → öneri (BoardLabels).
- Soket düğmeleri foto'da r≈9–10 görünür + dişli flank + koyu şaft; ama SOKET KİLİTLİ (r8.5, koordinat/id/renk) — sadece global knob çizimi için öneri notu, bu bölgede değişiklik yok.
- Panel ton: bu bölge foto bej #b3b19a..#c0b99c; render panelSkin (#eee3bd→#d3c394) daha parlak — global not.
- b1.c1 knob üstü y≈360 (boundary 345 içinde), b4.no (281.5,683) alt sınır içinde ✓; bölge dışına taşan çizim yok.

## SEKILLER (tablo: id | tip | lokal x,y | w,h / r | hex | op | z | not)

Her satır 4 kez çizilir: b1 (154,399) kırmızı, b2 (155,488) teal, b3 (158,570) kırmızı, b4 (157,655) teal. `b.y+Δ` formülleri satıra göre çözülür.

| id | tip | lokal x,y | w,h / r | hex | op | z | not |
|---|---|---|---|---|---|---|---|
| bt.grime.1 | soft ellipse | (237, b.y+3) | rx19, ry11 | #6b6555 | 0.16 | 0 | kırmızı sütun arkası; örneklem (235,399) #8f897b, (235,488) #64635e |
| bt.grime.2 | soft ellipse | (287, b.y+4) | rx13, ry10 | #55503f | 0.13 | 0 | siyah sütun arkası; dış örnek (298,488) #a6a289 (çekirdek koyu) |
| bt.pr.box | dikdörtgen kontur | (193.4, b.y−7.4) | 6.8×17.4, rx0.6 | #26241a (stroke 1.5) | 1 | 1 | açık-kutu görünümü; içi panel açık kalır |
| bt.pr.bar | dolu dikdörtgen | (209.8, b.y−9.8) | 3.6×20.4, rx1 | #16140e | 1 | 1 | T-post bar; foto x210..213 |
| bt.pr.arrow | üçgen (dolu) | (206→213.4, b.y±2.4) | gen 7.4, h 4.8 | #0c0c0a | 1 | 1 | hat üzerinde sağ-yönlü ok ucu |
| bt.pr.line1 | çizgi | (213.4→271.5, b.y−1.2) | sw 2.2 | #0c0c0a | 1 | 1 | üst hat (kalın), round cap |
| bt.pr.line2 | çizgi | (217→270, b.y+2.4) | sw 1.9 | #17150f | 0.95 | 1 | alt hat; birlikte çift-hat görünümü |
| bt.pr.elbowT | polilayn | (271.5, b.y−1.2)→(276.6, b.y−6)→(279, b.y−6.9) | sw 2 | #0c0c0a | 1 | 1 | üst siyah halkaya kıvrım |
| bt.pr.elbowB | polilayn | (270.5, b.y+2.4)→(277.4, b.y+8.2)→(280.6, b.y+9) | sw 2 | #0c0c0a | 1 | 1 | alt siyah halkaya kıvrım |
| bt.pr.ringRT | halka | (219.6, b.y−7) | r3.3, sw1.6 | #0e0c0a | 1 | 1 | kırmızı üst bağlantı halkası; knob'ların ARASINDA (boşlukta), soket çiziminin üstüne binmez |
| bt.pr.ringRB | halka | (220.4, b.y+6.6) | r3.3, sw1.6 | #0e0c0a | 1 | 1 | kırmızı alt bağlantı halkası |
| bt.pr.ringBT | halka | (279.4, b.y−7) | r3.2, sw1.7 | #0c0c0a | 1 | 1 | siyah üst bağlantı halkası |
| bt.pr.ringBB | halka | (281.5, b.y+9) | r3.4, sw1.7 | #0c0c0a | 1 | 1 | siyah alt bağlantı halkası |
| bt.shadow | soft ellipse | (b.x−2, b.y+29) | rx26, ry7 | #14100a | 0.13 | 1.5 | düğme altı gölge; örnek (154,433) #9a9581 |
| bt.bar | dikdörtgen | (118.5, b.y−8.5) | 6.5×17, rx3 | #141414 | 0.92 | 1.8 | HER sıranın sol dışı koyu bar (y b.y±~8; üst/alt yok) — zb_all/probe profile'da hep görünür |
| bt.bezel.disc | daire | (b.x, b.y) | r21.8 | #26221d, stroke #17140f 1.2 | 1 | 2 | koyu bezel gövdesi; foto bezel r≈19..23 |
| bt.bezel.glow | alt yay | (b.x, b.y) r≈20.3, alt 100°..260° | sw2.2 | #452c2b | 0.8 | 2.1 | yalnız kırmızı sıralar (b1/b3): bezel içi alt ışıma; foto örneği #472f2f |
| bt.bezel.rim | çember kontur | (b.x, b.y) | r22.6, sw1.7 | #b4b5ad | 0.8 | 2.2 | açık dış metal rim (üst-sol #b4b5ad→alt #979984; tek tonla çizilir) |
| bt.cap.collar | çember kontur | (b.x, b.y) | r19.8, sw3.8 | #1b1613 | 1 | 2.3 | statik koyu yaka = cap kenarı basıncı; r17 etkileşim çemberiyle arada ~0.9px dudak |
| bt.cap.teeth | kesikli çember | (b.x, b.y) | r19.4, sw2.6, dash 2.3/2.5 | #0d0b09 | 1 | 2.35 | dişli/knurl "derz" (r17 etkileşim çemberi çoğunu kapatır; boşta dış yarısı, basınca daha fazlası görünür) |
| bt.cap.skirt | daire | (b.x, b.y) | r19.5 | url(#cap-{id}) op0.5 | — | 2.4 | STATİK dome kütlesi; etkileşim çemberi dışındaki 2.5px halka olarak görünür (foto r≈19.5'i kapatır) |
| btn.hit | daire (etkileşim) | (b.x, b.y) | r17 boşta / r13 basılı | url(#cap-{id}), stroke #1a0b07 1.5 | 1 | 3 | MUST: pointer handlers + ölçek + `<title>` AYNEN korunur |
| btn.gloss | ellipse | (b.x−5.5, b.y−6.5) | rx5.4, ry3.2 | #ffffff | 0.20 | 3.1 | cam parlama (etkileşim grubu İÇİNDE) |
| bt.cap.serr | kesikli çember | (b.x, b.y) | r17.7, sw1.5, dash 1.8/2.1 | kırmızı #c26a70 / teal #5fb2a1 | 0.38 | 3.2 | cap içi açık serration (zb_cap2'de teal'de net) |

- Gradient tanımları (her sıra, id `cap-b1`..`cap-b4` — benzersiz, çakışma yok): KIRMIZI linearGradient dikey (0,0)→(0,1): #8e2a34 / #a0353f @46% / #b34450; TEAL çapraz (0,0)→(0.85,0.85): #026260 / #006f69 @52% / #147d76.
- ⛳ KİLİTLİ (bu bölgede çizilmez, global katmana bağlı; referans): c1/c2 @ (220, b.y−28)/(220, b.y+28) r8.5 #b23a30; nc/no @ (281.5, b.y±28) r8.5 #1c1c20 — koordinat+id+renk dokunulmaz.
- ⛳ Etiket b1..b4: BoardLabels (global, non-interactive) — bu bölgede çizilmez; öneri ONERILER bölümünde.

## GEOMETRY DEGISIKLIK ONERILERI ("uygulama yok, öneri")

- **geometry.ts / soketler**: DEĞİŞİKLİK YOK. BUTTONS (154/155/158/157, y 399/488/570/655) ve BTN_COL (red 220, black 281.5, dy 28) foto ile birebir doğrulandı; R_BTN_SOCKET 8.5 kalsın (foto knoblar ~r9–10 görünse de koordinat kilitli; sadece global knob çizimine dişli-flank önerisi eklenebilir).
- **Etkileşim çemberi r13/r17** fonksiyonel olarak korundu; foto'daki r≈19.5 cap kütlesi STATIC skirt + collar + teeth + rim ile verildi (geometry.ts'e dokunulmaz).
- **BoardLabels (öneri)**: b1–b4 satırı `x={84} y={b.y+7} fontSize={21}` → `x={108} y={b.y+9.5} fontSize={23}`, fontWeight 800 kalsın. Ölçüm: "b1" x97..119 (merkez ~108), ascender h≈17 → ~23px; "b4" en geniş (x99..119) — x108 ortalaması hepsine uyar.
- **Kurşun notları (öneri — global katman "kurşun kalem notları")**: b3–b4 arası küme (x 128..165, y 604..630, #94866b..#9b9679, kurşun leke daireleri r≈4..6); mevcut "11"(122,622)+kıvılcım (100..116,606..613) foto'dan ~30px sağa çekilmeli. b1 üstü açık garabet (x ~100..190, y 350..375) mevcut değilse eklenir, "(okunmuyor)". b1 üstü kuyruk (150..155, 345..347) koyu uç (#453b2a yakını) — ilk hattın 2px altında.
- **Panel (global)**: bu bölgede foto bej #b3b19a..#c0b99c; panelSkin (#eee3bd→#d3c394) daha açık/parlak. Global ton önerisi ayrı dosyada işlensin (d1/ust ile aynı konu).
- **Global knob çizimi (öneri)**: foto soket knob'larında r≈9–10 dişli flank + koyu şaft + alt-kenar gölgesi var; `<Knob>`/`<SocketLabels>` global altyapısına ince dişli-flank ve şaft eklenmesi önerisi — koordinat değişmez.

## TSX

Aşağıdaki blok `render.tsx` içindeki `ButtonUnit({ b, pressed })` fonksiyonunun TAMAMINI değiştirir. Import yok (modül scope'unda `G`, `A`, `INK`, `MS`, `shade`, `url(#handInk)` hazır). Kilitliler: dışarıdan gelen `b` (G.BUTTONS) konumu/renk/id'si; fonksiyon yalnızca dekoratif çizim yapar; interaktif `<g className="bhit">` davranışı birebir korunur.

```tsx
function ButtonUnit({ b, pressed }: { b: G.ButtonDef; pressed: boolean }) {
  const press = pressed;
  const red = b.color === 'red';
  const gid = `cap-${b.id}`;
  return (
    <g className={press ? 'btn pressed' : 'btn'}>
      {/* cap dome gradyanı — her butona benzersiz id (cap-b1..cap-b4) */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2={red ? '0' : '0.85'} y2={red ? '1' : '0.85'}>
          {red ? (
            <>
              <stop offset="0" stopColor="#8e2a34" />
              <stop offset="0.46" stopColor="#a0353f" />
              <stop offset="1" stopColor="#b34450" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#026260" />
              <stop offset="0.52" stopColor="#006f69" />
              <stop offset="1" stopColor="#147d76" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* z0 — soket sütunları arkası kir lekesi */}
      <g pointerEvents="none">
        <ellipse cx={G.BTN_COL.red + 17} cy={b.y + 3} rx={19} ry={11} fill="#6b6555" opacity={0.16} />
        <ellipse cx={G.BTN_COL.black + 5.5} cy={b.y + 4} rx={13} ry={10} fill="#55503f" opacity={0.13} />
      </g>

      {/* z1 — foto köprü baskısı: açık kutu + T-post bar + ok, çift hat, sütun bağlantı halkaları ve kıvrımlar */}
      <g filter="url(#handInk)" pointerEvents="none">
        <rect x={193.4} y={b.y - 7.4} width={6.8} height={17.4} rx={0.6} fill="none" stroke="#26241a" strokeWidth={1.5} />
        <rect x={209.8} y={b.y - 9.8} width={3.6} height={20.4} rx={1} fill="#16140e" />
        <path d={`M ${206.2} ${b.y - 2.4} L ${213.4} ${b.y} L ${206.2} ${b.y + 2.4} Z`} fill="#0c0c0a" />
        <path d={`M ${213.4} ${b.y - 1.2} L ${271.5} ${b.y - 1.2}`} stroke="#0c0c0a" strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <path d={`M ${217} ${b.y + 2.4} L ${270} ${b.y + 2.4}`} stroke="#17150f" strokeWidth={1.9} strokeLinecap="round" fill="none" opacity={0.95} />
        <path d={`M ${271.5} ${b.y - 1.2} L ${276.6} ${b.y - 6} L ${279} ${b.y - 6.9}`} stroke="#0c0c0a" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d={`M ${270.5} ${b.y + 2.4} L ${277.4} ${b.y + 8.2} L ${280.6} ${b.y + 9}`} stroke="#0c0c0a" strokeWidth={2} strokeLinecap="round" fill="none" />
        <circle cx={219.6} cy={b.y - 7} r={3.3} fill="none" stroke="#0e0c0a" strokeWidth={1.6} />
        <circle cx={220.4} cy={b.y + 6.6} r={3.3} fill="none" stroke="#0e0c0a" strokeWidth={1.6} />
        <circle cx={279.4} cy={b.y - 7} r={3.2} fill="none" stroke="#0c0c0a" strokeWidth={1.7} />
        <circle cx={281.5} cy={b.y + 9} r={3.4} fill="none" stroke="#0c0c0a" strokeWidth={1.7} />
      </g>

      {/* z1.5 — düğme altı gölge + her sıranın sol dışı koyu bar */}
      <g pointerEvents="none">
        <ellipse cx={b.x - 2} cy={b.y + 29} rx={26} ry={7} fill="#14100a" opacity={0.13} />
        <rect x={118.5} y={b.y - 8.5} width={6.5} height={17} rx={3} fill="#141414" opacity={0.92} />
      </g>

      {/* z2 — bezel: koyu disk, (kırmızı) alt iç ışıma, açık dış rim, koyu yaka + dişli derz, statik dome skirt */}
      <g pointerEvents="none">
        <circle cx={b.x} cy={b.y} r={21.8} fill="#26221d" stroke="#17140f" strokeWidth={1.2} />
        {red && (
          <path d={`M ${b.x - 14.9} ${b.y + 13.6} A 20.3 20.3 0 0 0 ${b.x + 14.9} ${b.y + 13.6}`}
            stroke="#452c2b" strokeWidth={2.2} fill="none" opacity={0.8} />
        )}
        <circle cx={b.x} cy={b.y} r={22.6} fill="none" stroke="#b4b5ad" strokeWidth={1.7} opacity={0.8} />
        <circle cx={b.x} cy={b.y} r={19.8} fill="none" stroke="#1b1613" strokeWidth={3.8} />
        <circle cx={b.x} cy={b.y} r={19.4} fill="none" stroke="#0d0b09" strokeWidth={2.6} strokeDasharray="2.3 2.5" />
        <circle cx={b.x} cy={b.y} r={19.5} fill={`url(#${gid})`} opacity={0.5} />
      </g>

      {/* z3 — etkileşim: bas/aç davranışı ve ölçeği (r13 basılı / r17 boşta) birebir korunur */}
      <g className="bhit"
        onPointerDown={(e) => { e.stopPropagation(); A.pressButton(b.id as 'b1'); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sentetik olay */ } }}
        onPointerUp={(e) => { e.stopPropagation(); A.releaseButton(b.id as 'b1'); }}
        onPointerCancel={() => A.releaseButton(b.id as 'b1')}
        onClick={(e) => e.stopPropagation()}
      >
        <circle cx={b.x} cy={b.y} r={press ? 13 : 17} fill={`url(#${gid})`} stroke="#1a0b07" strokeWidth={1.5} />
        <ellipse cx={b.x - 5.5} cy={b.y - 6.5} rx={5.4} ry={3.2} fill="rgba(255,255,255,0.20)" />
        <title>{b.id.toUpperCase()} — bas-tut</title>
      </g>

      {/* z3.2 — cap kenar içi açık dişler (foto serration) */}
      <g pointerEvents="none">
        <circle cx={b.x} cy={b.y} r={17.7} fill="none" stroke={red ? '#c26a70' : '#5fb2a1'} strokeWidth={1.5} strokeDasharray="1.8 2.1" opacity={0.38} />
      </g>
    </g>
  );
}
```

Notlar (uygulamaya dair):
- İsim çakışması yok, import yok; JSX içinde `{/* ... */}` yorumları serbest.
- Gradient id ile çakışma yok (`cap-` ön eki + buton id'si; Board()'un tanımlarındaki `motorSkin`/`panelSkin`/`handInk` ile benzerlik değil).
- `filter url(#handInk)` referansı global (`Board()` defs) — olduğu gibi çalışır.
- Ölçek davranışı görsel olarak korunur: boşta çember r17 gradient kubbe, dışarısı (17..21.8) bezel/collar; basınca r13 ile kubbe içeri çöker, collar+skirt görünür kalır → foto'daki yaka görünümü korunur.

## SINIR NOTLARI

1. `y 345..356` üst şerit: okul stencil 2. satırın alt sliveri ("…MESLEK LİSESİ", sağa hizalı satır bitişi ~x310) → **ust** bölgesine ait (SchoolText). Buraya çizmiyoruz.
2. b1 üstü kurşun garabeti (~x100..190, y350..375) ve (150..155, 345..347) kuyruk → **kurşun katmanı GLOBAL** ("kurşun kalem notları" grubu) — sınır değil, ama bu yüzden ONERİ bölümünde.
3. `y ≥ 693` alt şerit: x~195..245 ve x~264..299 koyu kablo domeleri (c1 kontaktör terminali üstü) **kontaktörler bölgesinden** bölgeye giriyor — buraya çizmiyoruz; öneri kontaktörler bölgesinin kendi dosyasında işlenir.
4. sağ `x > 300` boş; en sağda çizilen: bt.grime.2 dış kenarı ~x300 ve bt.pr.ringBB ~x285.9 — tüm çizimler sınır içinde, taşan yok.
5. sol `x < 118` boş panel; x~70..73'te foto'da panonun koyu sol dikişi var mı belirsiz (panel tonuna gömük) — **pano kenarı/derz** çözümü global not.
6. Klavye/odak yok, sadece pointer; etkileşim `<g className="bhit">` dört sıra bağımsız; z sırası korunmalı — etiket layer (BoardLabels) SONRA çizilir ve non-interactive (öneriyle x108'e çekilir; bt.bar'la bitiş — ~1px örtüşme kabul edilebilir).
7. Soket id/renk/koordinat KİLİTLİ listesi (c1/c2/nc/no) sim motoru ve devre prefabrik'leriyle eşli — hiçbir öneri bu alanlara dokunmaz.
