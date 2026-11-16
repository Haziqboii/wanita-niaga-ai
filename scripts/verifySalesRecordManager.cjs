const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\urus_rekod_jualan';
  fs.mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();

  // 1. Mobile viewport (390 x 844)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Click "Masuk →"
  const masukBtn = await page.waitForSelector('button[aria-label="Masuk ke Mekara"]');
  await masukBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  // If there's a saved report, click "Mula Rekod Baharu"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Mula Rekod Baharu'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Click "Muatkan Data" (Sample Demo Data) to populate records
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.textContent.includes('Muatkan Data'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to Urus Rekod Jualan
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const editBtn = btns.find(b => b.textContent.includes('Tukar Data') || b.textContent.includes('Kemaskini Data'));
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 1: Mobile default list
  await page.screenshot({ path: path.join(outDir, '01_mobile_default_list.png') });
  console.log('Saved 01_mobile_default_list.png');

  // Open "+ Tambah Jualan" form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Tambah Jualan'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 2: Mobile with Add Form open
  await page.screenshot({ path: path.join(outDir, '02_mobile_add_form_open.png') });
  console.log('Saved 02_mobile_add_form_open.png');

  // Close Add Form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancelBtn = btns.find(b => b.textContent.includes('Batal'));
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Search "Kuih Lapis" (which matches records)
  const searchInput = await page.$('input[placeholder="Cari nama produk..."]');
  if (searchInput) {
    await searchInput.type('Kuih Lapis');
  }
  await new Promise(r => setTimeout(r, 400));

  // Open "Tapis" panel
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const filterBtn = btns.find(b => b.textContent.includes('Tapis'));
    if (filterBtn) filterBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Screenshot 3: Mobile showing search + filter results
  await page.screenshot({ path: path.join(outDir, '03_mobile_search_filter_results.png') });
  console.log('Saved 03_mobile_search_filter_results.png');

  // Click "Padam" on the first visible card
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const deleteBtn = btns.find(b => b.textContent.trim() === 'Padam');
    if (deleteBtn) deleteBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 4: Mobile delete confirmation modal
  await page.screenshot({ path: path.join(outDir, '04_mobile_delete_dialog.png') });
  console.log('Saved 04_mobile_delete_dialog.png');

  // Cancel delete dialog
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancelBtn = btns.find(b => b.textContent.trim() === 'Batal');
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Clear search
  await page.evaluate(() => {
    const clearBtn = document.querySelector('button[title="Padam carian"]');
    if (clearBtn) clearBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Close filter panel
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const filterBtn = btns.find(b => b.textContent.includes('Tapis'));
    if (filterBtn) filterBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 2. Desktop viewport (1280 x 800)
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.screenshot({ path: path.join(outDir, '05_desktop_record_management.png') });
  console.log('Saved 05_desktop_record_management.png');

  // 3. Narrow 320px mobile viewport (iPhone SE / older smartphones)
  await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2 });
  await page.screenshot({ path: path.join(outDir, '06_narrow_320px_mobile.png') });
  console.log('Saved 06_narrow_320px_mobile.png');

  await browser.close();
  console.log('Done capturing all screenshots!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
