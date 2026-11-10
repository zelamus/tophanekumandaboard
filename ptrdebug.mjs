// pointer olay hedefi debug: node ptrdebug.mjs
import puppeteer from 'puppeteer-core';

const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));

await page.evaluate(async () => {
  const kka = window.__kka;
  const mod = await import('/src/presets.ts');
  const t5 = mod.PRESETS.find((x) => x.id === 't5');
  kka.A.clearWires();
  kka.A.loadDoc({ v: 1, cables: mod.presetCables(t5), breakers: { motor: true, control: true }, zr: { delayMs: 3000, mode: 'düz' }, termikArmed: true });
  window.__evlog = [];
  document.querySelector('svg').addEventListener('pointerdown', (e) => window.__evlog.push('pd@' + (e.target?.getAttribute?.('class') ?? e.target.tagName ?? '?') + ' client=' + Math.round(e.clientX) + ',' + Math.round(e.clientY)), true);
});
await new Promise((r) => setTimeout(r, 300));

const hits = await page.$$('.btn .bhit');
const box = await hits[1].boundingBox();
console.log('b2 box', JSON.stringify(box));
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await new Promise((r) => setTimeout(r, 600));

const r = await page.evaluate(() => ({
  log: window.__evlog,
  pressed: window.__kka.getState().pressed,
  c1: window.__kka.getState().sim?.dev.contactors.c1,
  motor: window.__kka.getState().sim?.motor.running,
}));
console.log(JSON.stringify(r, null, 1));
await page.mouse.up();
await browser.close();
