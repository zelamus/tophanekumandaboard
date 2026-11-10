import puppeteer from 'puppeteer-core';
const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1300, height: 1000 } });
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));
const parts = [
  ['ust', '0 -5 625 400'],
  ['buttons', '70 345 230 410'],
  ['e', '325 305 205 440'],
  ['d1', '515 325 195 420'],
  ['d2', '695 295 200 490'],
  ['motor', '595 -10 400 360'],
  ['c', '110 710 830 475'],
];
for (const [name, vb] of parts) {
  await page.evaluate((v) => { document.querySelector('svg.boardSvg').setAttribute('viewBox', v); }, vb);
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: `C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\rz_${name}.png` });
}
console.log('PARTS OK');
await browser.close();
