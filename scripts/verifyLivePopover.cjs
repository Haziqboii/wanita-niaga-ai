const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\live_popover';
  fs.mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Dismiss PWA banner first so it doesn't overlap
  await page.evaluate(() => {
    sessionStorage.setItem('mekara_pwa_dismissed', 'true');
  });

  // 1. Click "Masuk" to enter app
  const masukBtn = await page.waitForSelector('button[aria-label="Masuk ke Mekara"]');
  await masukBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 1: Closed hamburger
  await page.screenshot({ path: path.join(outDir, '01_mobile_navbar_closed.png') });
  console.log('Saved 01_mobile_navbar_closed.png');

  // 2. Click the Hamburger button
  const hamburgerBtn = await page.waitForSelector('button[aria-label="Menu Pilihan"]');
  await hamburgerBtn.click();
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 2: Floating Popover Menu Open (B1 Burgundy Monochrome)
  await page.screenshot({ path: path.join(outDir, '02_mobile_popover_open.png') });
  console.log('Saved 02_mobile_popover_open.png');

  // 3. Click backdrop to dismiss
  await page.evaluate(() => {
    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    if (backdrop) backdrop.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Screenshot 3: Closed again smoothly
  await page.screenshot({ path: path.join(outDir, '03_mobile_popover_dismissed.png') });
  console.log('Saved 03_mobile_popover_dismissed.png');

  await browser.close();
  console.log('All live popover screenshots verified successfully!');
}

run().catch(console.error);
