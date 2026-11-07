// headless ekran görüntüsü: node shot.mjs <url> <out.png> [genişlik yükseklik]
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\shot.png';
const w = Number(process.argv[4] ?? 1500);
const h = Number(process.argv[5] ?? 1000);
const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';

const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: w, height: h } });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: out });
console.log('OK', out);
if (errs.length) console.log('PAGE_ERRORS:', JSON.stringify(errs.slice(0, 8), null, 1));
await browser.close();
