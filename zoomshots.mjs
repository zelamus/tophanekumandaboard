import puppeteer from 'puppeteer-core';
const exe = process.env.CHROME ?? 'C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\pw\\chrome-headless-shell\\win64-157.0.8103.38\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));
const shots = [
  ['motor', '600 10 400 360'],
  ['eunit', '330 250 220 340'],
  ['ust', '80 40 350 280'],
];
for (const [name, vb] of shots) {
  await page.evaluate((v) => { document.querySelector('svg.boardSvg').setAttribute('viewBox', v); }, vb);
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: `C:\\Users\\Walter\\AppData\\Local\\Temp\\opencode\\zm_${name}.png` });
}
console.log('ZOOM OK');
await browser.close();
