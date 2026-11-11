import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'C:\\Users\\Walter\\.t3\\projects\\tophanekumandaboard\\ui_screens';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const exe = process.env.CHROME || 'C:\\Users\\Walter\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1248\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: { width: 1540, height: 960, deviceScaleFactor: 2 }
});

const page = await browser.newPage();
// Sistem teması artık 'system' (prefers-color-scheme) — koyu çekimler için emüle et
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));

// 1. Dark overview
await page.screenshot({ path: path.join(outDir, '01_dark_overview.png') });
console.log('Saved 01_dark_overview.png');

// 2. Header close-up
const header = await page.$('.appHeader');
if (header) {
  await header.screenshot({ path: path.join(outDir, '02_header_detail.png') });
  console.log('Saved 02_header_detail.png');
}

// 3. Status bar close-up
const statusBar = await page.$('.appStatusBar');
if (statusBar) {
  await statusBar.screenshot({ path: path.join(outDir, '03_statusbar_detail.png') });
  console.log('Saved 03_statusbar_detail.png');
}

// 4. Sidebar tabs
const sidebar = await page.$('.appleSidebar');
// Tab 1: Cihazlar (default)
if (sidebar) {
  await sidebar.screenshot({ path: path.join(outDir, '04_sidebar_cihazlar.png') });
  console.log('Saved 04_sidebar_cihazlar.png');
}

// Tab 2: Devreler
const tabs = await page.$$('.appleSidebar button[role="tab"]');
if (tabs.length >= 2) {
  await tabs[1].click();
  await new Promise(r => setTimeout(r, 500));
  if (sidebar) await sidebar.screenshot({ path: path.join(outDir, '05_sidebar_devreler.png') });
  console.log('Saved 05_sidebar_devreler.png');
}

// Tab 3: Kayıtlar
if (tabs.length >= 3) {
  await tabs[2].click();
  await new Promise(r => setTimeout(r, 500));
  if (sidebar) await sidebar.screenshot({ path: path.join(outDir, '06_sidebar_kayitlar.png') });
  console.log('Saved 06_sidebar_kayitlar.png');
}

// Tab 4: Ayarlar
if (tabs.length >= 4) {
  await tabs[3].click();
  await new Promise(r => setTimeout(r, 500));
  if (sidebar) await sidebar.screenshot({ path: path.join(outDir, '07_sidebar_ayarlar.png') });
  console.log('Saved 07_sidebar_ayarlar.png');
}

// Switch back to Cihazlar tab
if (tabs.length >= 1) {
  await tabs[0].click();
  await new Promise(r => setTimeout(r, 300));
}

// Toggle to Light mode (etiket dinamik: "Görünüm — şu an X")
const themeBtn = await page.$('button[aria-label^="Görünüm"]');
if (themeBtn) {
  await themeBtn.click();
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '08_light_overview.png') });
  console.log('Saved 08_light_overview.png');

  if (sidebar) {
    await sidebar.screenshot({ path: path.join(outDir, '09_sidebar_light.png') });
    console.log('Saved 09_sidebar_light.png');
  }
}

// Geri koyu temaya (üç durumlu döngü: sistemi → system → light → dark)
const themeBtn2 = await page.$('button[aria-label^="Görünüm"]');
if (themeBtn2) {
  await themeBtn2.click();
  await new Promise(r => setTimeout(r, 600));
}

// Telefon ölçüsü 390×844 — R3 DeepSeek #2: 360–760px aralığı kanıtsızdı
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.reload({ waitUntil: 'networkidle0' }); // gerçek telefon yüklemesi: çekmece kapalı doğar (R3 kanıt disiplini)
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: path.join(outDir, '10_mobile_dark.png') });
console.log('Saved 10_mobile_dark.png');

// Açık tema telefon: tercihi System'a döndür + emülasyon açık tut
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
const themeBtn3 = await page.$('button[aria-label^="Görünüm"]');
if (themeBtn3) {
  await themeBtn3.click(); // dark → system (emülasyon açık → light çözülür)
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(outDir, '11_mobile_light.png') });
  console.log('Saved 11_mobile_light.png');
}

// R4 GLM öneri: onay diyaloğu çekimi — settle yolu artık görsel sabitasyona tabi
// (12. kare, mobil çekimlerden SONRA; 04–07 aynen kalsın)
await page.setViewport({ width: 1540, height: 960, deviceScaleFactor: 2 });
await page.evaluate(() => {
  const seed = { id: 'demo-seed', name: 'Demo Kayıt', updatedAt: new Date().toISOString(), source: 'yerel' };
  localStorage.setItem('kayitlar', JSON.stringify([seed]));
});
await page.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));

const tabs12 = await page.$$('.appleSidebar button[role="tab"]');
if (tabs12.length >= 3) {
  await tabs12[2].click(); // Kayıtlar
  await new Promise(r => setTimeout(r, 500));
  const delBtn = await page.$('button[aria-label="\\"Demo Kayıt\\" kaydını sil"]');
  if (delBtn) {
    await delBtn.click();
    await new Promise(r => setTimeout(r, 500)); // diyaloğun açılması
    await page.screenshot({ path: path.join(outDir, '12_confirm_dialog.png') });
    console.log('Saved 12_confirm_dialog.png');
    await page.keyboard.press('Escape'); // fixten sonra artık gerçekten kapanır
    await new Promise(r => setTimeout(r, 300));
  } else {
    console.log('WARN: delete button not found — 12 not captured');
  }
}

await browser.close();
console.log('All screenshots captured successfully in', outDir);
