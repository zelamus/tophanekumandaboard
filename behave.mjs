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
    return { during, latched, stopped, after_release };
  });
  out.t6 = r; // beklenen: during {c1:true,motor:true}; latched aynı; stopped {c1:false,motor:false,extRed:true}; after_release duruyor
}

/* ---- kısa devre: sup.R → sup.S → termik atar ---- */
await loadPreset('t6');
{
  const r = await page.evaluate(async () => {
    const kka = window.__kka;
    kka.A.clickTerminal('sup.R');
    kka.A.clickTerminal('sup.S');
    await new Promise((res) => setTimeout(res, 700));
    const st = kka.getState();
    return { armed: st.termikArmed, shorts: st.sim?.shorts.length ?? 0, controlLamp: st.sim?.lamps.ctrl };
  });
  out.short = r; // beklenen: armed=false, shorts>0
  // sıfırla
  await page.evaluate(() => window.__kka.A.termikArm());
  await page.evaluate(() => {
    const st = window.__kka.getState();
    const bad = [...st.cables].filter((c) => (c.a === 'sup.R' && c.b === 'sup.S') || (c.a === 'sup.S' && c.b === 'sup.R'));
    bad.forEach((c) => window.__kka.A.delCable(c.id));
  });
  await new Promise((r2) => setTimeout(r2, 200));
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

console.log(JSON.stringify(out, null, 1));
console.log('PAGE_ERRORS:', JSON.stringify(errs.slice(0, 6)));
await browser.close();
