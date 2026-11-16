const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\pwa_install';
  fs.mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();
  
  // Mobile viewport (iPhone 14 / modern smartphone: 390x844)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Wait 2.5s for floating banner to slide up
  await new Promise(r => setTimeout(r, 2600));

  // Screenshot 1: Floating banner at bottom of screen
  await page.screenshot({ path: path.join(outDir, '01_mobile_floating_pwa_banner.png') });
  console.log('Saved 01_mobile_floating_pwa_banner.png');

  // Click "Pasang" button to open Apple-style bottom sheet
  const clicked = await page.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="Pemasangan Aplikasi Mekara"]');
    if (!aside) return false;
    const btn = Array.from(aside.querySelectorAll('button')).find(b => b.textContent.trim() === 'Pasang');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Pasang:', clicked);

  await new Promise(r => setTimeout(r, 800));

  // Screenshot 2: Apple-style Bottom Sheet Drawer
  await page.screenshot({ path: path.join(outDir, '02_mobile_apple_bottom_sheet.png') });
  console.log('Saved 02_mobile_apple_bottom_sheet.png');

  // Test Android User-Agent
  const pageAndroid = await browser.newPage();
  await pageAndroid.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pageAndroid.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');
  await pageAndroid.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2600));

  await pageAndroid.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="Pemasangan Aplikasi Mekara"]');
    if (aside) {
      const btn = Array.from(aside.querySelectorAll('button')).find(b => b.textContent.trim() === 'Pasang');
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await pageAndroid.screenshot({ path: path.join(outDir, '03_mobile_android_bottom_sheet.png') });
  console.log('Saved 03_mobile_android_bottom_sheet.png');

  await browser.close();
  console.log('PWA screenshots captured successfully!');
}

run().catch(console.error);
