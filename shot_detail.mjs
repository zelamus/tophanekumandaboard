// yaklaştırılmış kontrol görüntüleri (kalite kontrol): node shot_detail.mjs
import puppeteer from 'puppeteer-core';

const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const dir = 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));

const zoomShots = [
  ['c1 tepsi', '100 850 260 320'],
  ['d2 ekran', '770 395 140 100'],
  ['acil + seçici', '95 55 230 180'],
  ['c4 + d2 teysi', '700 630 280 190'],
];
const svg = await page.$('svg.boardSvg');
for (const [name, vb] of zoomShots) {
  await page.evaluate((v) => { document.querySelector('svg.boardSvg').setAttribute('viewBox', v); }, vb);
  await new Promise((r) => setTimeout(r, 150));
  const file = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  await svg.screenshot({ path: `${dir}\\det_${file}.png` });
}
console.log('DETAILS OK');
await browser.close();
