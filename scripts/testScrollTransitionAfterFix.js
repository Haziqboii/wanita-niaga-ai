import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\transition_test_after_fix';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Apply the fix in page:
  await page.evaluate(() => {
    const sectionContainer = document.querySelector('#landing-hero-section');
    sectionContainer.className = 'relative w-full h-[calc(100svh-57px)] sm:h-[calc(100svh-61px)] shrink-0 overflow-hidden';

    const heroSection = sectionContainer.querySelector('section');
    heroSection.className = 'relative w-full h-full overflow-hidden bg-gradient-to-b from-[#FAF0EB] via-[#FDF5F1] to-[#F7E7E0] flex items-center justify-center select-none';
    heroSection.style.height = '100%';
    heroSection.style.minHeight = '100%';

    const ambient = heroSection.querySelector('div[aria-hidden="true"]');
    if (ambient) {
      ambient.className = 'absolute inset-0 pointer-events-none overflow-hidden opacity-40 select-none';
    }

    const innerDiv = heroSection.querySelector('div.relative.z-10');
    innerDiv.className = 'relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-0 m-0';

    const img = innerDiv.querySelector('img');
    img.className = 'w-full h-full object-cover object-[center_top] sm:h-full sm:w-auto sm:max-w-full sm:object-contain sm:object-center sm:drop-shadow-[0_10px_40px_rgba(128,0,32,0.08)] select-none pointer-events-none';
  });

  // 1. Initial Section 1
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_initial_section1.png') });

  // 2. Scroll 300px
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_scrolled_300px.png') });

  // 3. Scroll to full Section 2 reveal
  await page.evaluate(() => window.scrollTo({ top: 787, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_section2_revealed.png') });

  // 4. Test clicking the scroll button
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 200));
  const scrollBtn = await page.$('#landing-hero-section button');
  if (scrollBtn) {
    await scrollBtn.click();
    await new Promise(r => setTimeout(r, 900));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_after_scroll_button_click.png') });

  await browser.close();
  console.log('Saved transition tests');
})();
