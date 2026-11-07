// etkileşim testi: node interact.mjs
import puppeteer from 'puppeteer-core';

const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600));

const openAndKur = async (idx) => {
  await page.evaluate((i) => {
    const t = document.querySelector(`.panel:nth-of-type(1) .preset:nth-of-type(${i + 1}) .presetToggle`)
      ?? [...document.querySelectorAll('.panel')].flatMap((p) => [...p.querySelectorAll('.preset')])[i]?.querySelector('.presetToggle');
    t?.click();
  }, idx);
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.presetBody .btnP')][0];
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 500));
};

// ---- TEMRİN 4 ----
await openAndKur(0);
await page.screenshot({ path: 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\penoT4.png' });

let b1 = (await page.$$('.btn .bhit'))[0];
let box = await b1.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\penoT4pressed.png' });
await page.mouse.up();
await new Promise((r) => setTimeout(r, 300));

// ---- TEMRİN 5 ----
await openAndKur(1);
await page.screenshot({ path: 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\penoT5.png' });

let b2 = (await page.$$('.btn .bhit'))[1];
box = await b2.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\penoT5hold.png' });
await page.mouse.up();
await new Promise((r) => setTimeout(r, 400));

console.log('PAGE_ERRORS:', JSON.stringify(errs.slice(0, 8), null, 1));
await browser.close();
