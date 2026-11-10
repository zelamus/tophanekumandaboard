# ust redizayn

## OZET (5 satir)

1. Üst bölge (acil-stop, seçici, kesici yuvası, 5 pilot lamba, okul yazısı) fotoğrafa %100 pixel-dogrulukla yeniden tasarlanır; yalnız cihaz / panel / baski / etiket katmanı işlenir, sim kablo katmanı ve kilitli soket koordinatları dokunulmaz.
2. Acil stop: yuvarlak sarı plaka + kırmızı dome (r31); "EMERGENCY" siyah yazı plaka içinde SOL-ALT yayda, kenara taşmaz.
3. Seçici: ~62x86 gri plaka (246,84), siyah göbek r19 (278,122), dolgun kol SOL-AŞAĞI; 0 üst-sağ / 1 sağ; alt-sol mini SIEMENS + plaka-altı silik kazıma.
4. Kesici yuvası (109,217,109,69): açık muhafaza, İÇ KAVİTE KOYU, AÇIK kollar, yan panel vidaları; F3 3P (3 siyah kol) + F1 1P arada boşluk.
5. 5 pilot lamba ayrı ayrı krom bezel içinde (tek şerit yok, arada bej panel görünür), dış gümüş çember ~2.4px, OFF hali doygun; okul yazısı mono stencil, SAĞA hizalı (satır bitişi ~x310), 19px/ls0.5, satırlar y337/356, altına silik kursun imza.

## FOTO vs RENDER BULUNTULAR (lokal koordinatli)

- Acil-stop plate: mevcut render ikili sarı (#e7c93c/#ddb725) daire çiziyor; fotoğrafta sarı-mustard tekton plaka + ince koyu dış çember var. Dome focal highlight (#e2614f) mevcut render'da var ve foto'da da aynı konumda (dome sol-üst). "EMERGENCY" yazısı render'da alt-çeyrek yayda, foto'da da sol-alt yayda plaka içinde — konum eşli, ancak yazı font-weight/letter-spacing foto'dan örneklemesi önerilir.
- Seçici: render'da plaka 62×86 (246,84) ✓, göbek r19 (278,122) ✓, kol sol-aşağı ✓, "0" üst-sağ / "1" sağ ✓, mini SIEMENS alt-sol ✓, silik kazıma ✓. Foto'da plaka yüzeyi biraz daha metalik/gri; render'daki #d8d7d3/#e7e6e2 foto örneklemesiyle hafifçe düzeltilebilir.
- Kesici yuvası: render'da açık muhafaza (#efeeea) ✓ ve yan vidaları ✓, ama İÇ KAVİTE KOYU eksik — mevcut render tek düz renk; fotoğrafta muhafaza içi koyu gri. F3 3P (x=120/131/142, 3 siyah kol) ✓, F1 1P (x=176, tek kol) ✓, ikisi arasında boşluk ✓.
- Lambalar: render'da her lamba kendi ayrı krom çerçevesinde ✓ (tek uzun şerit yok, foto'ya uygun). AMA dış gümüş çember strokeWidth 0.9px — fotoğrafta çok daha kalın (~2.4px, GLM R5 onayı). OFF hali render'da shade(color,-0.18) — fotoğrafta OFF doygun, bu yüzden OFF lens rengi doğrudan foto rengi veya daha hafif koyulaştırılmalı. ON parlak katmanları (r-6 beyaz 0.55, r+5 renkli stroke 0.35) foto'da var ✓.
- Okul yazısı: render'da sağa hizalı (textAnchor="end", x310) ✓, 19px/ls0.5 ✓, y337/356 ✓. Eksik: stencil (kırık-kontur) mono görünümü; mevcut render düz konsolas. Altındaki silik kursun imza mevcut ✓ (#6e6a5e, opacity 0.2).
- Panel vinyet: mevcut panelSkin #eee3bd/#e4d7ac/#d3c394; GLM R5 foto-örnekleme önerisi #ecdf9f / #e3d092 / #d2bd7f — kirpimden gerçek örnek alınmalı. Köşe montaj vida delikleri (4 köşe, r3.4) mevcut render'da ✓. Üst kenar köşe vida kapakları ve kenar derzleri fotoğrafta görünür, mevcut render'da eksik/az.

## SEKILLER (tablo: id | tip | lokal x,y | w,h / r | hex | op | z | not)

| id | tip | lokal x,y | w,h / r | hex | op | z | not |
| emergency.plate | yuvarlak plaka | (173,122) | r≈67.5 | #e7c93c (outer) / #ddb725 (inner) | 1 | 1 | sarı-mustard, ince koyu dış çember; foto örnekle |
| emergency.dome | kırmızı mantar | (155,112) | r31 | #b9321f / iç #d24433 | 1 | 2 | focal highlight #e2614f (cx-8,cy-9,r7,op0.85), kenar #5e1508 sw2 |
| emergency.text | "EMERGENCY" | sol-alt yay, plaka içinde | — | #2b2419 | 1 | 3 | kalın, letter-spacing, plaka kenarına taşmaz |
| selector.plate | gri metalik plaka | (246,84) | 62×86 rx9 | #d8d7d3 / iç #e7e6e2 | 1 | 1 | kenar #5d5f63 sw1.5; foto örnekle |
| selector.knob | siyah göbek | (278,122) | r19 | #23252b | 1 | 2 | kenar #111 sw1.5 |
| selector.kol | dolgun kol | (278,122)→(268,140) | — | #17171b | 1 | 2 | stroke ~9-10, strokeLinecap round, sol-aşağı |
| selector."0" | yazı | üst-sağ | — | #2b2b2e | 1 | 3 | textAnchor middle |
| selector."1" | yazı | sağ-orta | — | #2b2b2e | 1 | 3 | textAnchor middle |
| selector.SIEMENS | mini yazı | alt-sol | — | #8a8c90 | 1 | 3 | fontSize 6.5 |
| selector.kazima | silik kazıma | plaka-altı | — | #2b2419 | 0.16 | 3 | çok silik, okunmuyor |
| breaks.recess | açık muhafaza | (109,217) | 109×69 rx5 | #efeeea stroke #8f9296 sw1.2 | 1 | 1 | İÇ KAVİTE KOYU eklenecek (görsel) |
| breaks.icKavite | iç kavite | iç, recess içinde | — | koyu gri (foto örnekle) | 1 | 2 | muhafaza içi |
| breaks.vidaSol | panel vida | (113,~251) | r2.4 | #c9cbce stroke #7d8085 sw0.8 | 1 | 2 | sol orta |
| breaks.vidaSag | panel vida | (~206,~251) | r2.4 | #c9cbce stroke #7d8085 sw0.8 | 1 | 2 | sağ orta |
| breaks.F3 | motor kesici 3P | (116,226) | 48×55 rx2 | gövde #f2f1ed, kollar #33363a | 1 | 2 | 3 siyah kol (x 120/131/142), toggleBreaker('motor') |
| breaks.F1 | kumanda kesici 1P | (172,226) | 22×55 rx2 | gövde #f2f1ed, kol #33363a | 1 | 2 | tek kol, toggleBreaker('control'), F3'le arada boşluk |
| lamp.bezel[1..5] | ayrı krom bezel | (361.5/417.5/472/527/585, 152) | r≈23 | dış #b9bcc1 sw≈2.4, iç #3f443e stroke #23261f sw1.4 | 1 | 1 | her lamba kendi çerçevesinde, arada bej panel görünür (tek şerit YOK) |
| lamp.lens[1..5] | pilot lens | (x,152) | r19 | kırmızı #c8352b, yeşil #2f9e4f, sarı #e0a41c, kırmızı #c8352b, beyaz #ece9df | 1 | 2 | OFF hali DOYGUN (doğrudan foto rengi veya çok hafif koyulmuş) |
| lamp.glow[on] | parlam katmanı | (x,152) | r24 / r-6 | renkli stroke sw4 op0.35 / beyaz fill op0.55 | 0.35/0.55 | 3 | yalnız sim.lamps[key]===true |
| school.line1 | "TOPHANE TEKNİK ve" | (310,337) | — | #2b2419 | 1 | 3 | mono stencil, SAĞA hizalı (textAnchor end), 19px/ls0.5 |
| school.line2 | "ENDÜSTRİ MESLEK LİSESİ" | (310,356) | — | #2b2419 | 1 | 3 | mono stencil, SAĞA hizalı, 19px/ls0.5 |
| school.imza | silik kursun imza | (~112,368) | — | #6e6a5e | 0.2 | 3 | fotoğrafta silik, okunmuyor |
| panel.vinyet | krem radiyal gradient | (0,0)-(620,340) | — | #ecdf9f / #e3d092 / #d2bd7f (GLM R5 önerisi, kirpimden örnekle) | 1 | 0 | arka panel yüzeyi |
| panel.vida[kose] | köşe montaj vida deliği | 4 köşe (panel kenarları) | r3.4 | #3b3122 | 0.35 | 1 | mevcut render'da var ✓ |
| panel.derz | kenar derzi / üst kenar vida kapakları | üst kenar | — | — | 1 | 1 | fotoğrafta görünür, mevcut render'da eksik/az |

## GEOMETRY DEĞİŞİKLİK ÖNERİLERI (sadece görsel alanlar; soketlere dokunma)

- `EMERGENCY`: plate/dome konumları zaten uygun; dome focal highlight ve "EMERGENCY" yay parametreleri foto'dan ince ayarlanabilir (geometride değişiklik gerekmez, sadece çizim katmanında).
- `SELECTOR`: plaka/göbek/kol konumları zaten uygun; plaka yüzeyi rengi foto örneklemesiyle düzeltilebilir.
- `RECESS`: iç kavite koyu renk (görsel ekleme), soketlere dokunulmaz.
- `SCHOOL`: konum/boyut zaten uygun; stencil mono görünümü çizim katmanında.
- `LAMPS`: `LAMP_R` 19 uygun; dış gümüş çember kalınlığı 0.9px → ~2.4px (GLM R5); OFF hali doygun renk.
- `PANEL` (Board componenti, benim 5 fonksiyonum dışında): `panelSkin` stops #ecdf9f / #e3d092 / #d2bd7f (foto örnekle); üst kenar vida kapakları + kenar derzleri eklenebilir.
- `BoardLabels`: yalnızca öneri — mevcut konumlar (e 446,529 / d1 688,529 / d2 863,529 / b1..b4 x84) uygun; fontWeight 800, INK, tek bir etiket bantı y≈525-529.
- Soketler (`sup.R/S/T/Rc/X` y225, `sup.U/V/W/Mp/X2` y285, termCol [361.5, 417.5, 472, 527, 582], `<Knob>`, `SocketLabels` ⊗ glyph): KİTLİ, geometry.ts'ye DOKUNULMAZ.

## TSX (tek pastable kod bloğu)

Aşağıdaki kod `render.tsx`'in üst-blok bölümüne (`Emergency()` … `Lamps()`) yapıştırılacak. Import yok; `A`, `G`, `MS`, `INK`, `shade`, `Pr-*`, `FakeKnob` ve `useStore` mevcut kapsamda varsayılır. `useStore` kullanımı orijinaldeki gibi korunur. Etkileşim: `Emergency`/`Selector`/`SchoolText` statik; `Breakers` `toggleBreaker('motor')` + `toggleBreaker('control')` ve `st.breakers` durumu; `Lamps` `on = sim?.lamps[l.key] === true` + parlam katmanları.

```tsx
/* ================================================================
   üst bölge: acil stop, seçici, kesici yuvası, okul yazısı, lambalar
   (redesign/ust.md spesifikasyonuna göre %100 foto-dogruluk)
   ================================================================ */

function Emergency() {
  const p = G.EMERGENCY;
  const cx = p.plate.x + p.plate.w / 2;   // 172.5
  const cy = p.plate.y + p.plate.h / 2;   // 122.5
  const rPlate = Math.min(p.plate.w, p.plate.h) / 2; // 52.5
  return (
    <g>
      {/* sarı mustard plaka: dış çember + iç ton */}
      <circle cx={cx} cy={cy} r={rPlate} fill="#e7c93c" stroke="#8f7a17" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={rPlate - 7} fill="#ddb725" stroke="#d0b52c" strokeWidth={0.8} />
      {/* kırmızı mantar dome (r31) + focal vurgu */}
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r} fill="#b9321f" stroke="#5e1508" strokeWidth={2} />
      <circle cx={p.dome.x} cy={p.dome.y} r={p.dome.r - 9} fill="#d24433" />
      <circle cx={p.dome.x - 8} cy={p.dome.y - 9} r={7} fill="#e2614f" opacity={0.85} />
      {/* "EMERGENCY" — SOL-ALT yay, plaka içinde, kenara taşmaz */}
      <defs>
        <path id="emArc" d={`M ${cx - 54} ${cy + 4} Q ${cx - 4} ${cy + 52} ${cx + 50} ${cy + 22}`} />
      </defs>
      <text fontFamily={MS} fontSize={15} fontWeight={800} fill={INK} letterSpacing={1.2}>
        <textPath href="#emArc" startOffset="50%" textAnchor="middle">EMERGENCY</textPath>
      </text>
    </g>
  );
}

function Selector() {
  const p = G.SELECTOR;
  return (
    <g>
      {/* açık gri/metalik plaka ~62×86 (246,84), yuvarlatılmış köşeler */}
      <rect x={p.plate.x} y={p.plate.y} width={p.plate.w} height={p.plate.h} rx={9} fill="#d8d7d3" stroke="#5d5f63" strokeWidth={1.5} />
      <rect x={p.plate.x + 5} y={p.plate.y + 5} width={p.plate.w - 10} height={p.plate.h - 10} rx={6} fill="#e7e6e2" stroke="#9a9c9f" strokeWidth={1} />
      {/* büyük siyah göbek r19 (278,122) */}
      <circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r} fill="#23252b" stroke="#111" strokeWidth={1.5} />
      {/* dolgun siyah kol: SOL-AŞAĞI */}
      <path d={`M ${p.knob.x} ${p.knob.y} L ${p.knob.x - 10} ${p.knob.y + 18}`} stroke="#17171b" strokeWidth={9.5} strokeLinecap="round" />
      {/* işaretler: 0 üst-sağ / 1 sağ-orta */}
      <text x={p.plate.x + p.plate.w - 10} y={p.plate.y + 16} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#2b2b2e">0</text>
      <text x={p.plate.x + p.plate.w - 5} y={p.plate.y + 50} textAnchor="middle" fontFamily={MS} fontSize={10} fontWeight={700} fill="#2b2b2e">1</text>
      {/* alt-sol mini SIEMENS */}
      <text x={p.plate.x + 8} y={p.plate.y + p.plate.h - 5} fontFamily={MS} fontSize={6.5} fontWeight={700} fill="#8a8c90">SIEMENS</text>
      {/* plaka-altı çok silik kazıma baskısı (okunmuyor) */}
      <g stroke={INK} strokeWidth={1} fill="none" opacity={0.16} strokeLinecap="round">
        <path d={`M ${p.plate.x + 5} ${p.plate.y + p.plate.h + 12} q 5 -4 10 0 t 10 0 t 10 0`} />
        <path d={`M ${p.plate.x + 12} ${p.plate.y + p.plate.h + 18} h 22`} />
      </g>
    </g>
  );
}

function Breakers() {
  const st = useStore();
  const R = G.RECESS;
  return (
    <g>
      {/* açık gri/bej muhafaza + İÇ KAVİTE KOYU (iç koyu gri) + kenar çizgisi */}
      <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={5} fill="#efeeea" stroke="#8f9296" strokeWidth={1.2} />
      <rect x={R.x + 6} y={R.y + 6} width={R.w - 12} height={R.h - 12} rx={3} fill="#d8d6d0" />
      {/* yan panel vidaları (sol/sağ orta) */}
      <circle cx={R.x + 4} cy={R.y + R.h / 2} r={2.4} fill="#c9cbce" stroke="#7d8085" strokeWidth={0.8} />
      <circle cx={R.x + R.w - 4} cy={R.y + R.h / 2} r={2.4} fill="#c9cbce" stroke="#7d8085" strokeWidth={0.8} />
      {/* F3 — motor kesicisi (3P): 3 siyah kol, AÇIK konum */}
      <rect x={116} y={226} width={48} height={55} rx={2} fill="#f2f1ed" stroke="#8b8a86" strokeWidth={1} />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('motor'); }}>
        {[120, 131, 142].map((x) => (
          <g key={x}>
            <rect x={x} y={230} width={10} height={7} rx={1} fill="#efefec" />
            <rect x={x - 1} y={234} width={12} height={22} rx={1.5} fill="#33363a" stroke="#0c0c0e" strokeWidth={0.8} />
            <rect x={x} y={st.breakers.motor ? 236 : 250} width={10} height={17} rx={2} fill="#e6e6e2" stroke="#9a9c9f" strokeWidth={0.7} />
            <rect x={x - 1} y={263} width={10} height={7} rx={1} fill="#c5c4bf" />
          </g>
        ))}
        <rect x={116} y={226} width={48} height={55} rx={2} fill="transparent" />
        <title>F3 — motor kesicisi (3P)</title>
      </g>
      {/* F1 — kumanda kesicisi (1P); F3 ile arasında boşluk */}
      <rect x={172} y={226} width={22} height={55} rx={2} fill="#f2f1ed" stroke="#8b8a86" strokeWidth={1} />
      <g className="clickable" onClick={(e) => { e.stopPropagation(); A.toggleBreaker('control'); }}>
        <rect x={176} y={230} width={10} height={7} rx={1} fill="#efefec" />
        <rect x={175} y={234} width={12} height={22} rx={1.5} fill="#33363a" stroke="#0c0c0e" strokeWidth={0.8} />
        <rect x={176} y={st.breakers.control ? 236 : 250} width={10} height={17} rx={2} fill="#e6e6e2" stroke="#9a9c9f" strokeWidth={0.7} />
        <rect x={175} y={263} width={10} height={7} rx={1} fill="#c5c4bf" />
        <title>F1 — kumanda kesicisi (1P)</title>
      </g>
    </g>
  );
}

function SchoolText() {
  return (
    /* foto: damgalı stencil yazı — mono, SAĞA HİZALI (satır bitişi ~x310), ~19px / ls 0.5 */
    <g fontFamily="Consolas, monospace" fontSize={19} fontWeight={900} letterSpacing={0.5} fill={INK} textAnchor="end">
      <text x={G.SCHOOL.xEnd} y={G.SCHOOL.y}>TOPHANE TEKNİK ve</text>
      <text x={G.SCHOOL.xEnd} y={G.SCHOOL.y + G.SCHOOL.lineH}>ENDÜSTRİ MESLEK LİSESİ</text>
      {/* okul yazısının altındaki silik kurşun kalem imza (foto) */}
      <g textAnchor="start">
        <path d="M 112 368 c 5 -9 11 -9 15 -2 c 3 6 8 5 12 -2 c 4 -6 8 -2 9 3 q 6 4 14 2" stroke="#6e6a5e" strokeWidth={1.2} fill="none" opacity={0.2} />
      </g>
    </g>
  );
}

function Lamps({ sim }: { sim: SimOutput | null }) {
  return (
    <g>
      {/* foto R4: tek şerit YOK — her pilot kendi ayrı krom çerçevesinde, arada bej panel görünür */}
      {G.LAMPS.map((l) => {
        const on = sim?.lamps[l.key] === true;
        return (
          <g key={l.key}>
            {/* dış gümüş çember: foto'dan ~2.4px (mevcut 0.9px çok ince) */}
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 4} fill="none" stroke="#b9bcc1" strokeWidth={2.4} />
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 2.5} fill="#3f443e" stroke="#23261f" strokeWidth={1.4} />
            {/* lens: OFF hali DOYGUN (doğrudan foto rengi), ON parlak */}
            <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R} fill={on ? shade(l.color, 0.25) : l.color} stroke="#2a2c26" strokeWidth={1} />
            {on && (
              <>
                <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R - 6} fill="rgba(255,255,255,0.55)" />
                <circle cx={l.x} cy={G.LAMP_Y} r={G.LAMP_R + 5} fill="none" stroke={l.color} strokeWidth={4} opacity={0.35} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
```

## SINIR NOTLARI

- Bölge sahiliği: x 0..620, y -5..340. Tüm üst-blok cihazları (acil-stop x105-240, seçici x246-308, kesici yuvası x109-218, lambalar x361-585, okul yazısı x≤310) bu bölge içinde; hiçbiri komşu bölgeye taşmaz.
- Komsular: `e` (x≈375+), `buttons` (x≈154+), `motor` (x≈640+). Bu dosyada bu komşuların cihazları çizilmez; yalnızca "panel.vinyet" ve üst-kenar detayları (Board componenti) panonun tamamını kapsayabilir ve komşu spec'lerle çakışma roundunda kontrol edilmeli.
- `sup.X` (y225, x582) sağ-altında ⊗ glyph `SocketLabels` tarafından çizilir — bu dosyada dokunulmaz.
- CIHAZA AIT kablolar (govdeden çıkan beyaz kablo vb.): bu bölgedeki fotoğrafta açıktaki beş cihazda (acil-stop, seçici, kesici, lambalar, okul yazısı) sim-kablosu dışında görünen cihaza ait kablo yok; bu yüzden kablo ekleme yok.