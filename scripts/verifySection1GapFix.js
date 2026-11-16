import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\section1_gap_fix';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 Starting Section 1 Gap Fix Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const viewports = [
    { name: '01_iphone_se_375px', w: 375, h: 667, isMobile: true },
    { name: '02_iphone_14_390px', w: 390, h: 844, isMobile: true },
    { name: '03_pixel_7_412px', w: 412, h: 915, isMobile: true },
    { name: '04_iphone_promax_430px', w: 430, h: 932, isMobile: true },
    { name: '05_ipad_768px', w: 768, h: 1024, isMobile: false },
    { name: '06_desktop_1280px', w: 1280, h: 800, isMobile: false }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 400));

    // Inspect image bounding box
    const info = await page.evaluate(() => {
      const img = document.querySelector('#landing-hero-section img[alt*="Mekara"]');
      const container = document.querySelector('#landing-hero-section');
      if (!img || !container) return null;
      const iRect = img.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        container: { x: cRect.x, y: cRect.y, w: cRect.width, h: cRect.height },
        img: { x: iRect.x, y: iRect.y, w: iRect.width, h: iRect.height },
        leftGap: iRect.left,
        rightGap: window.innerWidth - iRect.right
      };
    });

    console.log(`[${vp.name}] Layout Info:`, info);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}_landing.png`) });
  }

  // Test interactive scroll down on mobile 390px
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));

  // Click scroll indicator
  const scrollBtn = await page.$('#landing-hero-section button');
  if (scrollBtn) {
    await scrollBtn.click();
    await new Promise(r => setTimeout(r, 900));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_mobile_390px_after_scroll.png') });

  // Test halfway transition
  await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_mobile_390px_halfway_transition.png') });

  await browser.close();
  console.log('✅ All verification screenshots saved to', OUTPUT_DIR);
})();
