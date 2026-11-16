import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\cover_experiments';

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

  // Test on various phone sizes:
  // 375x667 (iPhone SE)
  // 390x844 (iPhone 14)
  // 390x700 (iPhone 14 with Safari address bar + bottom bar)
  // 430x932 (iPhone 14 Pro Max)
  // 768x1024 (iPad)
  // 1280x800 (Desktop)
  const tests = [
    { name: 'iphone_se_375x667', w: 375, h: 667 },
    { name: 'iphone_14_390x844', w: 390, h: 844 },
    { name: 'iphone_safari_chrome_390x690', w: 390, h: 690 },
    { name: 'iphone_promax_430x932', w: 430, h: 932 },
    { name: 'ipad_768x1024', w: 768, h: 1024 },
    { name: 'desktop_1280x800', w: 1280, h: 800 }
  ];

  // Variations to test by injecting styles:
  // Variant 1: object-cover object-top, no pt/pb padding
  // Variant 2: object-cover object-[center_15%], etc.
  
  for (const t of tests) {
    await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Apply Style 1: Full bleed object-cover
    await page.evaluate(() => {
      const section = document.querySelector('#landing-hero-section');
      const innerDiv = section.querySelector('div.relative.z-10');
      const img = section.querySelector('img[alt*="Mekara"]');
      
      // Remove any pt/pb on container
      innerDiv.className = "relative z-10 w-full h-full flex items-center justify-center overflow-hidden";
      // Make image fill screen
      img.className = "w-full h-full object-cover object-top select-none pointer-events-none";
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, `v1_cover_top_${t.name}.png`) });

    // Apply Style 2: For desktop/tablet, what if we keep contain on wide screens or how does cover look?
    if (t.w >= 768) {
      // Test desktop with centered hero and matching warm gradient extension
      await page.evaluate(() => {
        const section = document.querySelector('#landing-hero-section');
        const innerDiv = section.querySelector('div.relative.z-10');
        const img = section.querySelector('img[alt*="Mekara"]');
        
        // Full bleed desktop cover
        img.className = "w-full h-full object-cover object-[center_20%] select-none pointer-events-none";
      });
      await page.screenshot({ path: path.join(OUTPUT_DIR, `v2_desktop_cover_20_${t.name}.png`) });
    }
  }

  await browser.close();
  console.log('Saved experiments to', OUTPUT_DIR);
})();
