// davranış testleri: node behave.mjs
// T6 mühürleme · T4 durdur · kısa devre termik · ZR zamanlama · kayıt API'si
import puppeteer from 'puppeteer-core';

const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));

const out = {};
const loadPreset = async (id) => {
  await page.evaluate(async (pid) => {
    const kka = window.__kka;
    const mod = await import('/src/presets.ts');
    const p = mod.PRESETS.find((x) => x.id === pid);
    kka.A.loadDoc({ v: 1, cables: mod.presetCables(p), breakers: { motor: true, control: true }, zr: { delayMs: 3000, mode: 'düz' }, termikArmed: true });
  }, id);
  await new Promise((r) => setTimeout(r, 400));
};

/* ---- T4: b1 (S0) basılıyken H1 kırmızı söner ---- */
await loadPreset('t4');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    const before = kka.getState().sim?.ext.red;
    kka.A.pressButton('b1');
    await new Promise((res) => setTimeout(res, 400));
    const during = kka.getState().sim?.ext.red;
    kka.A.releaseButton('b1');
    await new Promise((res) => setTimeout(res, 300));
    const after = kka.getState().sim?.ext.red;
    return { before, during, after };
  });
  out.t4 = r; // beklenen: true / false / true
}

/* ---- T6: mühürleme — b2 bas-bırak → uygularda kalır; b1 → durur ---- */
await loadPreset('t6');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    // b2 bas + bırak
    kka.A.pressButton('b2');
    await new Promise((res) => setTimeout(res, 500));
    const during = { c1: kka.getState().sim?.dev.contactors.c1, motor: kka.getState().sim?.motor.running };
    kka.A.releaseButton('b2');
    await new Promise((res) => setTimeout(res, 500));
    const latched = { c1: kka.getState().sim?.dev.contactors.c1, motor: kka.getState().sim?.motor.running, extGreen: kka.getState().sim?.ext.green };
    // b1 bas-bırak → mühür kopmalı
    kka.A.pressButton('b1');
    await new Promise((res) => setTimeout(res, 400));
    const stopped = { c1: kka.getState().sim?.dev.contactors.c1, motor: kka.getState().sim?.motor.running, extRed: kka.getState().sim?.ext.red };
    kka.A.releaseButton('b1');
    await new Promise((res) => setTimeout(res, 300));
    const after_release = { c1: kka.getState().sim?.dev.contactors.c1, motor: kka.getState().sim?.motor.running };
    return { during, latched, stopped, after_release, stable: kka.getState().sim?.unstable === false };
  });
  out.t6 = r; // beklenen: during {c1:true,motor:true}; latched aynı; stopped {c1:false,motor:false,extRed:true}; after_release duruyor; stable true
}

/* ---- kısa devre: sup.R → sup.S → termik atar → e.tc açılır → K1 düşer ---- */
await loadPreset('t6');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    kka.A.pressButton('b2');
    await new Promise((res) => setTimeout(res, 400));
    const pre = {
      c1: kka.getState().sim?.dev.contactors.c1,
      devArmed: kka.getState().sim?.dev.termik.armed,
    };
    kka.A.clickTerminal('sup.R');
    kka.A.clickTerminal('sup.S');
    await new Promise((res) => setTimeout(res, 700));
    const st = kka.getState();
    // temizle
    kka.A.clearWires();
    kka.A.termikArm();
    kka.A.releaseButton('b2');
    return {
      pre,
      post: {
        storeArmed: st.termikArmed,                    // false (mağaza)
        devArmed: st.sim?.dev.termik.armed,            // false (motor gördü!) — split-brain testi
        c1Dropped: st.sim?.dev.contactors.c1 === false, // e.tc açıldı → kumanda koparı
        motorStopped: st.sim?.motor.running === false,
        shorts: st.sim?.shorts.length ?? 0,
      },
    };
  });
  out.short = r; // beklenen: pre {c1:true,devArmed:true}; post {storeArmed:false,devArmed:false,c1Dropped:true,motorStopped:true,shorts>0}
}

/* ---- ZR: d2 bobinine güç → süre sonunda kontak kapanır ---- */
await loadPreset('t4');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    // gecikmeyi 1 sn'ye çek (min 200)
    kka.A.setZr({ delayMs: 1000 });
    // d2 bobinine faz-wire: sup.Rc → d2.a1, d2.a2 → sup.Mp  (ZR çekilir)
    kka.A.clickTerminal('sup.Rc');
    kka.A.clickTerminal('d2.a1');
    kka.A.clickTerminal('d2.a2');
    kka.A.clickTerminal('sup.Mp');
    await new Promise((res) => setTimeout(res, 350));
    const t0 = kka.getState().sim?.dev.zr;
    await new Promise((res) => setTimeout(res, 1400));
    const t1 = kka.getState().sim?.dev.zr;
    return { duringRun: { energized: t0.energized, closed: t0.closed, elapsed: Math.round(t0.elapsed) }, after: { energized: t1.energized, closed: t1.closed, elapsed: Math.round(t1.elapsed) } };
  });
  out.zr = r; // beklenen: duringRun.energized=true ve 1s sonrasında closed=true
}

/* ---- ZR 'ters' (off-delay): enerjide anında kapatır; enerji kesilince gecikmeli açar ---- */
await loadPreset('t4');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    kka.A.setZr({ delayMs: 800, mode: 'ters' });
    kka.A.clickTerminal('sup.Rc');
    kka.A.clickTerminal('d2.a1');
    kka.A.clickTerminal('d2.a2');
    kka.A.clickTerminal('sup.Mp');
    await new Promise((res) => setTimeout(res, 350));
    const on = kka.getState().sim?.dev.zr; // closed: true (hemen)
    kka.A.toggleBreaker('control');        // F1 off → bobin ölür, kontak tutmaya devam eder
    await new Promise((res) => setTimeout(res, 200));
    const holdEarly = kka.getState().sim?.dev.zr; // closed: true, elapsed = kalan süre
    await new Promise((res) => setTimeout(res, 1100));
    const holdLate = kka.getState().sim?.dev.zr;  // closed: false (gecikme doldu)
    kka.A.toggleBreaker('control');               // F1 geri on
    kka.A.setZr({ delayMs: 3000, mode: 'düz' });
    return {
      onClosed: on?.closed,
      holdEarlyClosed: holdEarly?.closed,
      holdEarlyRemaining: Math.round(holdEarly?.elapsed ?? -1),
      holdLateClosed: holdLate?.closed,
    };
  });
  out.zrTers = r; // beklenen: true / true / <800 / false
}

/* ---- stall: motora tek faz → ~5 sn sonra termik (uğuldama) atar ---- */
await loadPreset('t4');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    kka.A.clickTerminal('sup.R');
    kka.A.clickTerminal('sup.U'); // yalnız 1 faz → akım yolu yok, termik ısınmaz
    await new Promise((res) => setTimeout(res, 1500));
    const early = kka.getState(); // ~1.5 sn: hâlâ armed
    kka.A.clickTerminal('sup.S');
    kka.A.clickTerminal('sup.V'); // 2 faz → sargıdan akım akar (uğuldama)
    await new Promise((res) => setTimeout(res, 5300)); // 5 sn eşiği İKİNCİ fazdan sonra başlar
    const late = kka.getState(); // ~6.8 sn: termik atmış olmalı
    kka.A.clearWires();
    kka.A.termikArm();
    return {
      early: { missing: early.sim?.motor.missingPhase, overCurrent: early.sim?.motor.overCurrent, armed: early.termikArmed },
      late: { storeArmed: late.termikArmed, devArmed: late.sim?.dev.termik.armed },
    };
  });
  out.stall = r; // beklenen: early {missing:true, overCurrent:false, armed:true}; late {storeArmed:false, devArmed:false}
}

/* ---- kayıt API'si ---- */
{
  const doc = await page.evaluate(() => {
    const kka = window.__kka;
    kka.A.clearWires();
    kka.A.clickTerminal('sup.Rc');
    kka.A.clickTerminal('e.tc.a');
    return kka.A.exportDoc();
  });
  const postRes = await page.evaluate(async (d) => {
    const r = await fetch('/api/saves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'test-behave-1', name: 'Test davranış', doc: d }) });
    return { ok: r.ok, status: r.status };
  }, doc);
  const list = await page.evaluate(async () => (await (await fetch('/api/saves')).json()));
  const got = await page.evaluate(async () => (await (await fetch('/api/saves/test-behave-1')).json()));
  const del = await page.evaluate(async () => (await (await fetch('/api/saves/test-behave-1', { method: 'DELETE' })).status));
  out.saveApi = { postRes, listCount: list.length, roundTrip: JSON.stringify(got.doc) === JSON.stringify(doc), deleteStatus: del };
}

/* ---- T5 tekrar hızlı duman ---- */
await loadPreset('t5');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    kka.A.pressButton('b2');
    await new Promise((res) => setTimeout(res, 400));
    const s = kka.getState();
    kka.A.releaseButton('b2');
    return { c1: s.sim?.dev.contactors.c1, motor: s.sim?.motor.running, green: s.sim?.ext.green };
  });
  out.t5smoke = r;
}

/* ---- motor faz dizileri: ileri / geri / tekrarlı faz / eksik faz (sentezik) ---- */
{
  const r = await page.evaluate(async () => {
    const { RelayEngine } = await import('/src/sim/engine.ts');
    const potOf = { L1: 'sup.R', L2: 'sup.S', L3: 'sup.T' };
    const mt = ['sup.U', 'sup.V', 'sup.W'];
    const mk = (orders) => {
      const wires = [];
      for (let i = 0; i < 3; i++) {
        if (orders[i]) wires.push({ a: mt[i], b: potOf[orders[i]] });
      }
      const e = new RelayEngine();
      return e.solve({
        wires,
        contacts: () => [],
        termikArmed: true,
        sources: [
          { tid: 'sup.R', pot: 'L1' }, { tid: 'sup.S', pot: 'L2' },
          { tid: 'sup.T', pot: 'L3' }, { tid: 'sup.Mp', pot: 'N' },
        ],
        dtMs: 0,
        zr: { delayMs: 1000, mode: 'düz' },
        probes: {
          indicators: { red: 'x.a', green: 'x.b', yellow: 'x.c', ctrl: 'x.d' },
          lamp5: ['x.e', 'x.f'],
          ext: { yellow: 'x.g', red: 'x.h', green: 'x.i', gnd: 'x.j' },
          motor: ['sup.U', 'sup.V', 'sup.W'],
          coils: { c1: ['x.1', 'x.2'], c2: ['x.3', 'x.4'], c3: ['x.5', 'x.6'], c4: ['x.7', 'x.8'], d1: ['x.9', 'x.10'], zr: ['x.11', 'x.12'] },
        },
      }).motor;
    };
    return {
      forward: mk(['L1', 'L2', 'L3']),    // running: true, dir: 1, overCurrent: false
      reverse: mk(['L1', 'L3', 'L2']),    // running: true, dir: -1, overCurrent: false
      duplicate: mk(['L1', 'L1', 'L3']),  // running: false, missingPhase: true, overCurrent: true
      missing: mk(['L1', 'L2', null]),    // running: false, missingPhase: true, overCurrent: true (uğuldama)
      onePhase: mk(['L1', null, null]),   // running: false, missingPhase: true, overCurrent: false (akım yolu yok)
    };
  });
  out.motorOrders = r;
}

/* ---- ZR kip değişimi: eski tail yeni kipe sızmamalı (sentezik) ---- */
{
  const r = await page.evaluate(async () => {
    const { RelayEngine } = await import('/src/sim/engine.ts');
    const probes = {
      indicators: { red: 'x.a', green: 'x.b', yellow: 'x.c', ctrl: 'x.d' },
      lamp5: ['x.e', 'x.f'],
      ext: { yellow: 'x.g', red: 'x.h', green: 'x.i', gnd: 'x.j' },
      motor: ['sup.U', 'sup.V', 'sup.W'],
      coils: { c1: ['x.1', 'x.2'], c2: ['x.3', 'x.4'], c3: ['x.5', 'x.6'], c4: ['x.7', 'x.8'], d1: ['x.9', 'x.10'], zr: ['d2.a1', 'd2.a2'] },
    };
    const src = [{ tid: 'sup.Rc', pot: 'L1' }, { tid: 'sup.Mp', pot: 'N' }];
    const onWires = [{ a: 'sup.Rc', b: 'd2.a1' }, { a: 'd2.a2', b: 'sup.Mp' }];
    const e = new RelayEngine();
    const arg = (mode, wires, dt) => ({
      wires, contacts: () => [], termikArmed: true, sources: src, dtMs: dt,
      zr: { delayMs: 800, mode }, probes,
    });
    const t1 = e.solve(arg('ters', onWires, 100)); // enerjide → anında kapalı, tail tazelendi
    const t2 = e.solve(arg('düz', [], 100));       // kip düz'e döndü → iç durum sıfır; bobinsiz
    const t3 = e.solve(arg('ters', [], 100));      // tekrar ters; bobinsiz, tail 0 → kapalı OLMAMALI
    return { t1: t1.dev.zr.closed, t2: t2.dev.zr.closed, t3: t3.dev.zr.closed };
  });
  out.zrModeSwitch = r; // beklenen: true / false / false (fix yoksa t3: true sızardı)
}

/* ---- harici lamba kutup simetrisi: ters bağlantıda da yanmalı (sentezik) ---- */
{
  const r = await page.evaluate(async () => {
    const { RelayEngine } = await import('/src/sim/engine.ts');
    const e = new RelayEngine();
    const out = e.solve({
      wires: [
        { a: 'ext.fazR', b: 'sup.Mp' }, // lambanın "faz" ucuna nötr!
        { a: 'ext.gnd', b: 'sup.Rc' },  // "toprak" ucuna faz!
      ],
      contacts: () => [],
      termikArmed: true,
      sources: [{ tid: 'sup.Rc', pot: 'L1' }, { tid: 'sup.Mp', pot: 'N' }],
      dtMs: 0,
      zr: { delayMs: 1000, mode: 'düz' },
      probes: {
        indicators: { red: 'x.a', green: 'x.b', yellow: 'x.c', ctrl: 'x.d' },
        lamp5: ['x.e', 'x.f'],
        ext: { yellow: 'x.g', red: 'ext.fazR', green: 'x.i', gnd: 'ext.gnd' },
        motor: ['sup.U', 'sup.V', 'sup.W'],
        coils: { c1: ['x.1', 'x.2'], c2: ['x.3', 'x.4'], c3: ['x.5', 'x.6'], c4: ['x.7', 'x.8'], d1: ['x.9', 'x.10'], zr: ['x.11', 'x.12'] },
      },
    });
    return { red: out.ext.red };
  });
  out.extPolarity = r; // beklenen: true (gerçekte lamba faz-N arası yanar, kutup yönü önemsiz)
}

/* ---- salınım tespiti: kendi NC kontağıyla beslenen bobin → unstable ---- */
{
  const r = await page.evaluate(async () => {
    const { RelayEngine } = await import('/src/sim/engine.ts');
    const e = new RelayEngine();
    const out = e.solve({
      wires: [
        { a: 'sup.Rc', b: 'c1.k1.a' },
        { a: 'c1.k1.b', b: 'c1.a1' },
        { a: 'c1.a2', b: 'sup.Mp' },
      ],
      contacts: (coils) => [{ a: 'c1.k1.a', b: 'c1.k1.b', closed: !coils.c1 }],
      termikArmed: true,
      sources: [{ tid: 'sup.Rc', pot: 'L1' }, { tid: 'sup.Mp', pot: 'N' }],
      dtMs: 0,
      zr: { delayMs: 1000, mode: 'düz' },
      probes: {
        indicators: { red: 'x.a', green: 'x.b', yellow: 'x.c', ctrl: 'x.d' },
        lamp5: ['x.e', 'x.f'],
        ext: { yellow: 'x.g', red: 'x.h', green: 'x.i', gnd: 'x.j' },
        motor: ['sup.U', 'sup.V', 'sup.W'],
        coils: { c1: ['c1.a1', 'c1.a2'], c2: ['x.3', 'x.4'], c3: ['x.5', 'x.6'], c4: ['x.7', 'x.8'], d1: ['x.9', 'x.10'], zr: ['x.11', 'x.12'] },
      },
    });
    return { unstable: out.unstable };
  });
  out.unstableDetect = r; // beklenen: true
}

console.log(JSON.stringify(out, null, 1));
console.log('PAGE_ERRORS:', JSON.stringify(errs.slice(0, 6)));
await browser.close();
