# CONTACTORS — pixel-accuracy spesifikasyonu (kirpim: parts_c.png; LOKAL=crop+(110,710))

## OZET
- Tek şablon x4 (kilitli front 94x155,y737; trayL/trayR + C_ROW_Y dokunulmaz). Foto: gövde İÇİNE yerleşmiş koyu tel demeti (46px kütlesel dome; foto'da front üstü 710..747 bandı PANEL boş), altında ~66px koyu terminal bandı, dar (48px) buz-beyaz yüz, sağ tarafta koyu perde.
- Tepsi: X kutusu kilit (168..257 / 1047..1152 foto-ink doğrulandı), sıra baskıları kilit konumlarında; kanca kablosu tek sağ-alt; deco siyah çift kilit y1143.

## BULUNTULAR
1. Foto'da gerçek gövde dolgusu c1'de yalnız x194..262'e uzanıyor (kilit front'un sağ ~26px'i panelde); yüz c1'de 36px, c4'te 62px görünüyor — ünite-başına perspektif var; şablon 48px yüz + sağ perde ortalaması olarak çizilir.
2. Dome: render f.y-46'ya taşıyor; foto'da dome kütlesi rel f.y+1..+55 (46px) ve gövde İÇİndedir, hemen altında (rel +55..+68) koyu band, yüz (foto 806) onu izler.
3. Sağ-üstte VIDA BAŞLI koyu kapak fını (rel f.x+54..+88, f.y+16..+66; c1'de 253..282 teyitli); 3 pabuc elipsler terminal bandı üstünde (foto).
4. Kanca kablosu SAG-ALT köşeden (f.x+86,f.y+138 → m+20,916) iner; render'daki soldaki kalın kanca foto'da YOK. İki ink print eğrisi konum teyitli (sol op .7, sağ op .9).
5. xBox baskı kenarları foto ink kesişimlerle uyuşuyor (crop x58/147, y~332/447); alt kenar foto'da panel çerçeve bandıyla birleşiyor.
6. Kalem yazıları teyitli: "44" ~ (517,1006), "9" ~ (524,1031); soluk gri (#8b7d63 op~.5), c2-c3 arası boşlukta.
7. Deco siyah çift photo y~1150 (c4-sag tam 1143); kilit 1143 — korunur; c1-sol deco foto'da zor seçilir.
8. Ust-sol sınır köşesi (crop y0..45, x0..190) SAF BEJ PANEL — buttons'un koyu kablo domeleri o alanda kırpikte yok.

## SEKILLER (lokale; tip|coord|string hex|op|z; ozel durumlar son 2)
| id | tip | lokal x,y | w,h/r | hex | op | z | not |
|---|---|---|---|---|---|---|---|
| cPrints | grup(handInk) | 168,1047 | 89x105 | INK 1.6 | 1 | 0 | xBox + PrCoil(24x50 @206,896) + 2PrNo + 2PrNc + 3PrAux + 2 hook eğrisi (Q kontrol row0-34) |
| cVline | grup | m,915 | →1132 | INK 1.6 | .85 | 1 | dikey hat + 8 daire r3.2 @C_ROW_Y |
| cHookC | path | 280,875 | →(238,916) | #23231f w3.5 | 1 | 2 | Q (+52,918); foto tek kalin kanca saga |
| cBody | rect r6 | 194,737 | 94x155 | url(#darkBody) / str#212327 1.4 | 1 | 3 | kilitli front |
| cPerde | path | 228,739 | →286,887 | #202126 | .5 | 4 | M+36,+2 L+88,+16 Q+93,+44 +82,+68 L+60,+66 Q+58,+120 +62,+153 L+30,+153 Z (yüz üstünü örter, altında kalir) |
| cBand | grup | 196,792 | 66x13 r2 #141418; 3 elips rx3 ry2.3 | #23231f | 1 | 5 | band f.x+2,+55; lugs @ f.x+16/+33/+49, cy+56 |
| cDome | path | 186,738 | kütlesel h ~46 (rel +1..+55) | #1a1a1f str#0d0d10 | 1 | 6 | M-8,+50 C-11,+16 +14,+1 +32,+7 C+54,0 +63,+12 +58,+38 C+54,+56 +26,+60 +6,+56 C-2,+54 Z |
| cStrand | path grup | f.x-10..+40 | 4 adet | #3a3f47 w1.2 | .7 | 7 | M (o-10,+32) Q (o-8,+12) (o,+2); o=8,20,32,44 |
| cTips | elips grup | -9..+9 | 4x rx2.6 ry4 | #9f5d6b str#6b3f4a .8 | 1 | 8 | (-8,+18) (-3,+29) (+2,+60) (+9,+62) |
| cFin | path+circle | 248,753 | →282,+66 /r4 | #26241f /#4e5056 | .92 | 9 | M+54,+16 L+86,+20 Q+91,+40 +81,+66 L+57,+64 Z; vida @(+71,+31) + artı işaret #33343a |
| cFace | rect r3 | 197,807 | 48x79 | #e4e8f0 str #9aa0ab 1.2 | 1 | 10 | acik yuz — kilit pense noktası (f.x+3, f.y+70) |
| cScrew | grup 2x4 circle | cy f.y+85 / f.y+138 | r3 / r3.2 | #26262a rim #6a7078 .8 | 1 | 11 | cx f.x+7/+19/+31/+43 (c4 yüz-rel kalibrasyon; üst satır koyu) |
| cLev | rect r1 | 203,845 | 6x8 | #1b1a1e | 1 | 12 | pencere kolu (face-rel +6) |
| cIn0 | rect r1.5 + text | 218,845 | 26x10; sz6 | #f6f5f2 str #b9bcc2 | 1 | 13 | IN/0 plakası; text (f.x+34,+117) {on?'IN':'0'} #45484e |
| cSie | text | 202,841 | sz6 w700 ls.4 | #4c515b | .8 | 14 | "SIEMENS" mini — yüz sol-üst (fotodan) |
| cLabel | text | 258,868 | sz26 w800 | #221e16 | 1 | 15 | kilit konum f.x+64/y868; "C1..C4" |
| cDeco | grup 2xFakeKnob | 156/281,1143 | r8 | KNOB_COLOR.black | 1 | 16 | kilit y — tıklanmaz |
| cPencil | grup handInk | 517,1006 / 521,1031 | sz11 | #8b7d63 | .5 | 17 | yalnızca k.id==='c2' çıktısında TEK çizim ("44", "9") |

## GEOMETRY ONERILERI (yüz/etiket/perspektif; soketler KILITLI)
1. cFace 88→48px daralt; artan sağ bölge cPerde ile koyu kalsın (c1 foto yüz 36px, c4 62px — tek şablon ortası; c1'e birebir, c4'e %77 uyum).
2. Dome'u f.y+1'den başlat; gövde üst kenarı boşluksuz dome'a geçmeli (foto: local 710..747 PANEL, dome kütle 747'de başlıyor); kütle bittiği yerde band (+55..+68) başlar — kubbe-band birleşiminde net seam yok.
3. SIEMENS baskısını gövde altından YÜZ sol-üstüne taşı; IN/0 plakası 38x14→26x10 (c4 yüz-rel ölçek ~.78) — yüzden taşmıyor.
4. cHook: soldaki kalın kanca KALDIRILDI; tek sağ-alt kanca (280,875→238,916).
5. C etiket fontu 24→26 (foto "C1" yazı genişliği ~30px, cap ~18) — konum/renk kilit korunur.

## TSX
```tsx
function ContactorUnit({ k, on }: { k: G.ContactorDef; on: boolean }) {
  const f = k.front;
  const left = k.trayL, right = k.trayR;
  const m = Math.round((left + right) / 2);
  const R = G.C_ROW_Y;
  return (
    <g pointerEvents="none">
      {/* tepsi baskilari — kilit satir y'leri */}
      <g filter="url(#handInk)" stroke={INK} fill="none" strokeLinecap="round">
        <rect x={left + 12} y={R[5] - 20} width={right - left - 24} height={(R[7] - R[5]) + 28} strokeWidth={1.6} />
        <PrCoil a={left} b={right} y={R[0]} />
        <PrNo a={left} b={right} y={R[1]} />
        <PrNo a={left} b={right} y={R[2]} />
        <PrNc a={left} b={right} y={R[3]} />
        <PrNc a={left} b={right} y={R[4]} />
        <PrAux a={left} b={right} y={R[5]} />
        <PrAux a={left} b={right} y={R[6]} />
        <PrAux a={left} b={right} y={R[7]} />
        <path d={`M ${left + 4} ${R[0] - 14} Q ${left + 30} ${R[0] - 34} ${f.x + 30} ${f.y + f.h}`} strokeWidth={1.5} opacity={0.7} />
        <path d={`M ${right - 4} ${R[0] - 14} Q ${right - 26} ${R[0] - 34} ${f.x + 52} ${f.y + f.h}`} strokeWidth={1.5} opacity={0.9} />
      </g>
      {/* merkez dikey hat — kilit */}
      <g stroke={INK} opacity={0.85} fill="none">
        <line x1={m} y1={915} x2={m} y2={1132} strokeWidth={1.6} />
        {R.map((ry) => <circle key={ry} cx={m} cy={ry} r={3.2} strokeWidth={1.4} />)}
      </g>
      {/* kanca — tek, saga katlanir (kirpipten) */}
      <path d={`M ${f.x + 86} ${f.y + 138} Q ${f.x + 52} 918 ${m + 20} 916`} stroke="#23231f" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {/* gövde: koyu dikdörtgen + sağ perde + dome içinde */}
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={6} fill="url(#darkBody)" stroke="#212327" strokeWidth={1.4} />
      <path d={`M ${f.x + 36} ${f.y + 2} L ${f.x + 88} ${f.y + 16} Q ${f.x + 93} ${f.y + 42} ${f.x + 82} ${f.y + 68} L ${f.x + 60} ${f.y + 66} Q ${f.x + 58} ${f.y + 120} ${f.x + 62} ${f.y + f.h - 2} L ${f.x + 30} ${f.y + f.h - 2} Z`} fill="#202126" opacity={0.5} />
      <rect x={f.x + 2} y={f.y + 55} width={66} height={13} rx={2} fill="#141418" />
      {[[f.x + 16, f.y + 56], [f.x + 33, f.y + 55.5], [f.x + 49, f.y + 56]].map(([lx, ly]) => (
        <ellipse key={lx} cx={lx} cy={ly} rx={3} ry={2.3} fill="#23231f" />
      ))}
      <path d={`M ${f.x - 8} ${f.y + 50} C ${f.x - 11} ${f.y + 16} ${f.x + 14} ${f.y + 1} ${f.x + 32} ${f.y + 7} C ${f.x + 54} ${f.y} ${f.x + 63} ${f.y + 12} ${f.x + 58} ${f.y + 38} C ${f.x + 54} ${f.y + 56} ${f.x + 26} ${f.y + 60} ${f.x + 6} ${f.y + 56} C ${f.x - 2} ${f.y + 54} Z`} fill="#1a1a1f" stroke="#0d0d10" strokeWidth={1} />
      {[8, 20, 32, 44].map((o) => (
        <path key={o} d={`M ${f.x + o - 10} ${f.y + 32} Q ${f.x + o - 8} ${f.y + 12} ${f.x + o} ${f.y + 2}`} stroke="#3a3f47" strokeWidth={1.2} fill="none" opacity={0.7} />
      ))}
      {[[-8, 18], [-3, 29], [2, 60], [9, 62]].map(([tx, ty], i) => (
        <ellipse key={i} cx={f.x + tx} cy={f.y + ty} rx={2.6} ry={4} fill="#9f5d6b" stroke="#6b3f4a" strokeWidth={0.8} />
      ))}
      <path d={`M ${f.x + 54} ${f.y + 16} L ${f.x + 86} ${f.y + 20} Q ${f.x + 91} ${f.y + 40} ${f.x + 81} ${f.y + 66} L ${f.x + 57} ${f.y + 64} Z`} fill="#26241f" opacity={0.92} />
      <circle cx={f.x + 71} cy={f.y + 31} r={4} fill="#4e5056" />
      <path d={`M ${f.x + 68.5} ${f.y + 28.5} L ${f.x + 73.5} ${f.y + 33.5} M ${f.x + 73.5} ${f.y + 28.5} L ${f.x + 68.5} ${f.y + 33.5}`} stroke="#33343a" strokeWidth={1} />
      {/* yüz + iç öğeler — c4'ten tam bakış kalibrasyonu (face-rel) */}
      <rect x={f.x + 3} y={f.y + 70} width={48} height={79} rx={3} fill="#e4e8f0" stroke="#9aa0ab" strokeWidth={1.2} />
      {[7, 19, 31, 43].map((o) => (
        <circle key={o} cx={f.x + o} cy={f.y + 85} r={3} fill="#26262a" stroke="#6a7078" strokeWidth={0.8} />
      ))}
      {[7, 19, 31, 43].map((o) => (
        <circle key={'b' + o} cx={f.x + o} cy={f.y + 138} r={3.2} fill="#26262a" stroke="#6a7078" strokeWidth={0.8} />
      ))}
      <rect x={f.x + 6} y={f.y + 109} width={6} height={8} rx={1} fill="#1b1a1e" />
      <rect x={f.x + 21} y={f.y + 109} width={26} height={10} rx={1.5} fill="#f6f5f2" stroke="#b9bcc2" strokeWidth={0.9} />
      <text x={f.x + 34} y={f.y + 117} textAnchor="middle" fontFamily={MS} fontSize={6} fill="#45484e">{on ? 'IN' : '0'}</text>
      <text x={f.x + 5} y={f.y + 104} fontFamily={MS} fontSize={6} fontWeight={700} fill="#4c515b" opacity={0.8} letterSpacing={0.4}>SIEMENS</text>
      <text x={f.x + 64} y={868} textAnchor="middle" fontFamily={MS} fontSize={26} fontWeight={800} fill="#221e16">{k.id.toUpperCase()}</text>
      <FakeKnob x={left} y={R[7] + 19} color={G.KNOB_COLOR.black} />
      <FakeKnob x={right} y={R[7] + 19} color={G.KNOB_COLOR.black} />
      {k.id === 'c2' && (
        <g filter="url(#handInk)" opacity={0.5} fontSize={11} fontFamily={MS} fill="#8b7d63" pointerEvents="none">
          <text x={517} y={1006} textAnchor="middle">44</text>
          <text x={521} y={1031} textAnchor="middle">9</text>
        </g>
      )}
      <title>{k.id.toUpperCase()} — kontaktör</title>
    </g>
  );
}
```

## SINIR NOTLARI
- Ust-sol köşe (x110..300 y710..755) kirpigi temiz panel: buttons spec'teki koyu kablo domeleriyle çakışma — onlar buttons sahibinin; ben eklemiyorum, isimli dağılımda çözülsün.
- Sağ-üstten inen kırmızı-siyah kablo demeti c3 etiketi üzerisinden geçiyor (kablosudur → sim katmanı; cihaz specinde çizilmedi); üst/komşu bölge sahibi eklerse c3 label'le çakışma ihtimali var.
