// görsel karşılaştırma malzemeleri: node boardshot.mjs
// 1) boş pano (sadece SVG öğesi) · 2) boş pano tam sayfa · 3) T5 çalışır tam sayfa
import puppeteer from 'puppeteer-core';

const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const dir = 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));

// boş pano — yalnızca SVG öğesi
const el = await page.$('svg.boardSvg');
await el.screenshot({ path: `${dir}\\vis_board_empty.png` });
await page.screenshot({ path: `${dir}\\vis_page_empty.png` });

// T5 çalışır durum — tam sayfa (çipler + lambalar görünür)
await page.evaluate(async () => {
  const kka = window.__kka;
  const mod = await import('/src/presets.ts');
  const p = mod.PRESETS.find((x) => x.id === 't5');
  kka.A.loadDoc({ v: 1, cables: mod.presetCables(p), breakers: { motor: true, control: true }, zr: { delayMs: 3000, mode: 'düz' }, termikArmed: true });
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => window.__kka.A.pressButton('b2'));
await new Promise((r) => setTimeout(r, 600));
const st = await page.evaluate(() => { const s = window.__kka.getState(); return { motor: s.sim?.motor.running, c1: s.sim?.dev.contactors.c1 }; });
await page.screenshot({ path: `${dir}\\vis_page_t5run.png` });
console.log('STATE', JSON.stringify(st));
console.log('PAGE_ERRORS', JSON.stringify(errs.slice(0, 6)));
await browser.close();
