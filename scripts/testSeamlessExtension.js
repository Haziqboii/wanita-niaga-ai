import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\seamless_extension_test';

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

  // Test across responsive breakpoints
  const devices = [
    { name: '320px_narrow', w: 320, h: 600, isMobile: true },
    { name: '360px_galaxy', w: 360, h: 740, isMobile: true },
    { name: '375px_iphone_se', w: 375, h: 667, isMobile: true },
    { name: '390px_iphone14', w: 390, h: 844, isMobile: true },
    { name: '412px_pixel7', w: 412, h: 915, isMobile: true },
    { name: '430px_promax', w: 430, h: 932, isMobile: true },
    { name: '768px_ipad', w: 768, h: 1024, isMobile: false },
    { name: '1024px_ipad_pro', w: 1024, h: 1366, isMobile: false },
    { name: '1280px_desktop', w: 1280, h: 800, isMobile: false },
    { name: '1440px_macbook', w: 1440, h: 900, isMobile: false }
  ];

  for (const d of devices) {
    await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    await page.evaluate((isMob) => {
      // 1. Remove negative margin so section sits naturally under sticky header, filling (100svh - headerHeight)
      const sectionContainer = document.querySelector('#landing-hero-section');
      sectionContainer.className = 'relative w-full h-[calc(100svh-57px)] sm:h-[calc(100svh-61px)] shrink-0 overflow-hidden';

      const heroSection = sectionContainer.querySelector('section');
      // Background gradient matching exact edge colors: #f7e0d7 to #fcefe9
      heroSection.className = 'relative w-full h-full overflow-hidden bg-gradient-to-b from-[#FAF0EB] via-[#FDF5F1] to-[#F7E7E0] flex items-center justify-center select-none';
      heroSection.style.height = '100%';
      heroSection.style.minHeight = '100%';

      // Ambient full-bleed backdrop layer (extends artwork colors across entire screen seamlessly)
      const ambient = heroSection.querySelector('div[aria-hidden="true"]');
      if (ambient) {
        ambient.className = 'absolute inset-0 pointer-events-none overflow-hidden opacity-40 select-none';
        const ambImg = ambient.querySelector('img');
        if (ambImg) {
          ambImg.className = 'w-full h-full object-cover blur-3xl scale-125 brightness-105';
        }
      }

      // Main image container
      const innerDiv = heroSection.querySelector('div.relative.z-10');
      innerDiv.className = 'relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-0 m-0';

      const img = innerDiv.querySelector('img');
      if (isMob) {
        // Mobile: 100% full-bleed edge-to-edge, zero gaps!
        img.className = 'w-full h-full object-cover object-[center_top] select-none pointer-events-none';
      } else {
        // Desktop / Tablet: contained height, seamless full-width ambient backdrop, drop shadow
        img.className = 'h-full w-auto max-w-full object-contain object-center drop-shadow-[0_10px_40px_rgba(128,0,32,0.08)] select-none pointer-events-none';
      }
    }, d.isMobile);

    await page.screenshot({ path: path.join(OUTPUT_DIR, `seamless_${d.name}.png`) });
  }

  await browser.close();
  console.log('Saved seamless tests to', OUTPUT_DIR);
})();
