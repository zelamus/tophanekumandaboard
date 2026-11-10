# motor — SALT TASARIM (pixel-dogruluk)

Ornekleme disiplini: kirpimden TEK PowerShell cagrisi, 12 piksel — (268,62)(240,215)(200,131)(132,178)(65,178)(96,178)(45,180)(340,120)(168,72)(258,305)(170,335)(100,320). Sim kablo katmani yok sayildi; beyaz kablo = DEVRE kablosu (tasarlanir). Soket yok — tum degisiklik gorsel katmanda.

## OZET
- Mevcut render'da zil KAPSUL (706..776, 95..245 rx32) ve ince mil; kirpikte gercegi YUVARLAK disk (r63 @727,168) + koyu HUB (r35, #555F68) + KALIN KOYU celik mil (h~30) dir.
- Plaka (780..905, 60..190) + 4 KOSE HEX vida, kucuk/koyu SIEMENS (fs18 dar, #4b4e53) ve fan kapagi (896..968, ~4 dikey oluk, taban #9CACC5) yeni cizilir.
- tBox kirpikte (800..874, 229..286); beyaz kablo tBox altindan (837,284) duz-ivir delige (765,325) iner.
- 12 sekil id; TSX tek fonksiyon (18 node), data-running korunur; animasyon CSS'te.

## BULUNTULAR
1. Zil kapsul yanlis: kirpikte yuvarlak disk merkez (727,168) r~62-72; merkezindeki koyu yuvarlak (probl #555F68) HUB'dir, mil oraya girer.
2. Mil cok ince: kirpikte KOYU celik h~30 (problar #3F434C/@65,178 ve #373A41/@96,178), sol uc acik ton "pu" (#BAB89F @45,180) — mil 628..712 user sayisi korunur.
3. SIEMENS mevcut fs22/ls2.5 ~2x fazla genis; kirpikte harf blok ~790..882 (y~122..140) → fs18/ls2, dolgu koyu (#4b4e53; kenar tonu problari #818E9F).
4. Plaka + hex vidalar mevcut ESLESME YOK: kabartma plaka (780..905, 60..~190; alt derz probl #040811 @835,205); top vidalar kirpikte baslari (763,62)/(887,64) okundu → user ±30 tol icinde (788,72)/(888,72) sabitlendi.
5. Fan kapagi konum mevcut dogru (898..968) ama kirpikte ~4 oluk ve pastel mavimsi taban (#9CACC5 @935,110); yatay-olduk sorun ozellikler içte.
6. tBox kirpikte (800..874, 229..286) — mevcut (785..857, 215..285) ~20px sol/ust; kablo cikisi govde altindir.
7. Band (=pano delimiter) ust kenari ~y322 (695,310 probl #97916F panel; 765,325 probl #606465 band tonu); beklenen delik (765,325) band icinde uygun.
8. Kirpikte govde ust tonu pastel-mavi (#C1D2F0 @268,62) — mevcut #motorSkin garcezi gri; govde/gradient/rize entegrasyonda retint edilebilir (gorsel katman).

## SEKILLER (id | tip | lokal x,y | w,h/r | hex | op | z | not)
| # | id | tip | lokal x,y | w,h/r | hex | op | z | not |
|---|----|-----|-----------|-------|-----|----|----|----|
| 1 | altGolge | rect | 698,274 | 258x12 rx6 | #56585c | 0.38 | 1 | govde alti zemin golgesi |
| 2 | beyazKablo | path+ellipse | 837,284 → 765,325; Q 866,308 826,318 · Q 792,326 | sw6.5 cap round; delik rx9.5 ry4.5 | #ece9e2; delik #3a3e41 | .95/1 | 2-3 | tBox alt → band girisi (765,325) |
| 3 | govde | rect | 688,45 | 280x235 rx8 | url(#motorSkin) + #7c7f84 1.6 | 1 | 4 | kirpikte ust tonum mavimsi (B8) |
| 4 | oluk | 8x line | 694..962 · y 76+27(i-1) | sw3 | #828589 | 0.6 | 5 | aday 0.6/3 korundu |
| 5 | plaka | rect | 780,60 | 125x130 rx3 | #c8cccf + #8b8e93 1.3 | 1 | 6 | kabartma; alt derz kirpik #040811 (entegre seam) |
| 6 | vida | 4x hex r7.5 | (788,72)(888,72)(796,188)(888,188) | #7d8a99 + #4c5765 1 | 1 | 7 | sol-alt 796: bell ricice uzak; sag ikili cowl (896+) disinda |
| 7 | siemens | text | 833,134 | fs18 ls2 w800 | #4b4e53 + #b9c0c9 1.1 | 1 | 8 | paintOrder bevel |
| 8 | zil | circle | 727,168 | r63 | #b9c3cf + #8b95a1 2 | 1 | 9 | YUVARLAK disk (kapsul DEGIL) + ince rim |
| 9 | mil | 4 parca | pu 628,155 18x28 rx5 · mil 644,153 68x30 rx4 · bevel 652..706 y159 · collar 678,149 16x38 | #b6b4a8/#8f8d82 · #383c43/#191c20 · #6b7078..0.75 · #23262b/#101215 | 1 | 10-13 | KOYU celik h30; sag collar; sol pu |
| 10 | hub | circle | 727,168 | r35 | #596169 + #3c4148 1.4 | 1 | 14 | mil ucu (692..712) altina girer |
| 11 | fan | rect + 4x line | 896,40 · 72x244 rx10 · x 910/926/942/958 y52..272 | #9dabbe + #7e8a9a; oluk #6f7a8b sw3 | 1/.6 | 15-16 | govde ~5 tasik; sag kenar 968 |
| 12 | tBox | rect + line | 800,229 · 74x57 rx5 · lid y247 (810..864) | #bcbfc4 + #84878d; lid #85888d | 1 | 17-18 | kablo altindan cikar (837,284) |

## GEOMETRY ONERILERI (gorsel alan — soket yok)
1. `shaft: { x: 628, y: 153, w: 84, h: 30 }` — TSX pu/mil/collar bevel bu alandan turetilir.
2. Yeni: `bell: { x: 727, y: 168, r: 63 }`, `hub: { x: 727, y: 168, r: 35 }`.
3. Yeni: `plate: { x: 780, y: 60, w: 125, h: 130 }`, `bolts: [[788,72],[888,72],[796,188],[888,188]]`.
4. Yeni: `fan: { x: 896, y: 40, w: 72, h: 244, louvers: [910,926,942,958] }`; `label: { x: 833, y: 134, fontSize: 18, letterSpacing: 2 }`.
5. `tBox: { x: 800, y: 229, w: 74, h: 57 }`; `body`/`hole` mevcut degerler sabit.

## TSX (tek fonksiyon; import yok; A/G·G.MOTOR/MS/INK/scope uyanik — yeni alanlar inlineliteral)
```tsx
function Motor({ running }: { running: boolean }) {
  const M = G.MOTOR;
  const b = M.body;
  const sx = M.shaft.x, sy = M.shaft.y, sw = M.shaft.w;
  return (
    <g data-running={running ? '1' : '0'}>
      {/* zemin golgesi + band deligi + beyaz DEVRE kablosu (sim degil) */}
      <rect x={698} y={b.y + b.h - 6} width={258} height={12} rx={6} fill="#56585c" opacity={0.38} />
      <ellipse cx={M.hole.x} cy={M.hole.y} rx={9.5} ry={4.5} fill="#3a3e41" />
      <path d={`M ${M.tBox.x + 37} ${M.tBox.y + 55} Q 866 308 826 318 Q 792 326 ${M.hole.x} ${M.hole.y}`}
        stroke="#ece9e2" strokeWidth={6.5} strokeLinecap="round" fill="none" />
      {/* govde + yatay oluklar; kabartma plaka → hex vidalar → SIEMENS (bevel) */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill="url(#motorSkin)" stroke="#7c7f84" strokeWidth={1.6} />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={i} x1={b.x + 6} x2={b.x + b.w - 6} y1={b.y + 31 + (i - 1) * 27} y2={b.y + 31 + (i - 1) * 27}
          stroke="#828589" strokeWidth={3} opacity={0.6} />
      ))}
      <rect x={780} y={60} width={125} height={130} rx={3} fill="#c8cccf" stroke="#8b8e93" strokeWidth={1.3} />
      {[[788, 72], [888, 72], [796, 188], [888, 188]].map(([hx, hy]) => (
        <polygon key={hx + '-' + hy} points={[0, 60, 120, 180, 240, 300].map((a) =>
          `${(hx + 7.5 * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(hy + 7.5 * Math.sin((a * Math.PI) / 180)).toFixed(1)}`).join(' ')}
          fill="#7d8a99" stroke="#4c5765" strokeWidth={1} />
      ))}
      <text x={833} y={134} textAnchor="middle" fontFamily={MS} fontSize={18} fontWeight={800} letterSpacing={2}
        fill="#4b4e53" stroke="#b9c0c9" strokeWidth={1.1} paintOrder="stroke">SIEMENS</text>
      {/* yuvarlak zil (kapsul degil) + KOYU celik mil: pu → mil → collar; HUB en üstte, mil oraya girer */}
      <circle cx={727} cy={168} r={63} fill="#b9c3cf" stroke="#8b95a1" strokeWidth={2} />
      <rect x={sx} y={sy + 2} width={18} height={28} rx={5} fill="#b6b4a8" stroke="#8f8d82" strokeWidth={1.2} />
      <rect x={sx + 16} y={sy} width={sw - 16} height={30} rx={4} fill="#383c43" stroke="#191c20" strokeWidth={1.2} />
      <line x1={sx + 24} y1={sy + 6} x2={sx + 78} y2={sy + 6} stroke="#6b7078" strokeWidth={1.7} opacity={0.75} />
      <rect x={sx + 50} y={sy - 4} width={16} height={38} rx={3} fill="#23262b" stroke="#101215" strokeWidth={1.2} />
      <circle cx={727} cy={168} r={35} fill="#596169" stroke="#3c4148" strokeWidth={1.4} />
      {/* fan kapagi (govdeyi ~5 tasik) + dikey panjur; klemens kutusu (kablo altindan) */}
      <rect x={896} y={40} width={72} height={244} rx={10} fill="#9dabbe" stroke="#7e8a9a" strokeWidth={1.2} />
      {[910, 926, 942, 958].map((lx) => (
        <line key={lx} x1={lx} x2={lx} y1={52} y2={272} stroke="#6f7a8b" strokeWidth={3} opacity={0.6} />
      ))}
      <rect x={M.tBox.x} y={M.tBox.y} width={M.tBox.w} height={M.tBox.h} rx={5} fill="#bcbfc4" stroke="#84878d" strokeWidth={1.4} />
      <line x1={M.tBox.x + 10} y1={M.tBox.y + 18} x2={M.tBox.x + M.tBox.w - 10} y2={M.tBox.y + 18} stroke="#85888d" strokeWidth={1.2} />
    </g>
  );
}
```
Not: 18 node / 12 sekil id (oluk-oluk-vidalar/pantograf map'leri tek id sayar); yorum 4 adet; animasyon TSX'te yok — `[data-running='1']` CSS disarida.

## SINIR NOTLARI
Kirpimin ust/solundaki beyaz alan ve koyu sac bandi (y ≲ 45) ile sagdaki (995+) koyu serit GLOBAL pano/FRAME katmanindadir — motor dokunmaz; fan sag kenar 968'te biter, bolge (x 600..1030) tamamen sahipli.
Alt-sol koyu blok (~595..660, 290..342) komsu 'c/d2' cihazina aittir; beyaz kablonun band girisi kirpikte ~ (830..860, ~330) okunurken beklenen delik (765,325) korunur — d2 sahibiyle ±30px teyit onerilir.
