const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\redesigned_mapping';
  fs.mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();
  
  // 1. Mobile viewport (iPhone 14 / modern smartphone: 390x844)
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

  await new Promise(r => setTimeout(r, 600));

  // Screenshot 1: Upload state showing "Muat Turun Contoh Templat Excel"
  await page.screenshot({ path: path.join(outDir, '01_mobile_upload_template_button.png') });
  console.log('Saved 01_mobile_upload_template_button.png');

  // Upload file
  const fileInput = await page.waitForSelector('input[type="file"]');
  const filePath = path.resolve('C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx');
  await fileInput.uploadFile(filePath);

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 2: Mobile with redesigned "Ubah Padanan Kolum" button (no emoji)
  await page.screenshot({ path: path.join(outDir, '02_mobile_redesigned_summary_card.png') });
  console.log('Saved 02_mobile_redesigned_summary_card.png');

  // Click "Ubah Padanan Kolum"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ubahBtn = btns.find(b => b.textContent.includes('Ubah Padanan Kolum'));
    if (ubahBtn) ubahBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 3: Mobile with redesigned "Padanan Kolum Fail" form (no emojis, system style)
  await page.screenshot({ path: path.join(outDir, '03_mobile_redesigned_mapping_form.png') });
  console.log('Saved 03_mobile_redesigned_mapping_form.png');

  // Click "Kolum Tambahan (Pilihan)" to expand optional fields
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const extraBtn = btns.find(b => b.textContent.includes('Kolum Tambahan'));
    if (extraBtn) extraBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Screenshot 4: Expanded optional fields
  await page.screenshot({ path: path.join(outDir, '04_mobile_optional_columns_expanded.png') });
  console.log('Saved 04_mobile_optional_columns_expanded.png');

  // Scroll down to see bottom action
  await page.evaluate(() => window.scrollBy(0, 450));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '05_mobile_bottom_action.png') });
  console.log('Saved 05_mobile_bottom_action.png');

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
