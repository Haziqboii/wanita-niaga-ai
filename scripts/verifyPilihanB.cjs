const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\pilihan_b';
  fs.mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();
  
  // 1. Mobile viewport (iPhone 14 / modern smartphone)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Click "Masuk →" to enter Section 2
  const masukBtn = await page.waitForSelector('button[aria-label="Masuk ke Mekara"]');
  await masukBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // If "Mula Rekod Baharu" is visible, click it to see methods
  const mulaBaru = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Mula Rekod Baharu'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (mulaBaru) {
    await new Promise(r => setTimeout(r, 600));
  }

  // Click "Muat Naik Excel" article
  await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    const uploadArticle = articles.find(a => a.textContent.includes('Muat Naik Excel'));
    if (uploadArticle) {
      uploadArticle.click();
    }
  });

  // Wait for file input
  const fileInput = await page.waitForSelector('input[type="file"]');
  const filePath = path.resolve('C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx');
  await fileInput.uploadFile(filePath);

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Mobile with Pilihan B (Auto-skipped mapping, directly seeing preview & smart badge)
  await page.screenshot({ path: path.join(outDir, '01_mobile_auto_skipped_preview.png') });
  console.log('Saved 01_mobile_auto_skipped_preview.png');

  // Click "Semak / Ubah Kolum"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ubahBtn = btns.find(b => b.textContent.includes('Semak / Ubah Kolum'));
    if (ubahBtn) ubahBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 2: Mobile with expanded mapping
  await page.screenshot({ path: path.join(outDir, '02_mobile_expanded_mapping.png') });
  console.log('Saved 02_mobile_expanded_mapping.png');

  // Click "✕ Tutup Padanan"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tutupBtn = btns.find(b => b.textContent.includes('Tutup Padanan'));
    if (tutupBtn) tutupBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 2. Desktop viewport (1280x800)
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.screenshot({ path: path.join(outDir, '03_desktop_auto_skipped_preview.png') });
  console.log('Saved 03_desktop_auto_skipped_preview.png');

  await browser.close();
  console.log('Done verifying Pilihan B!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
