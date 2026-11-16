import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\gap_fix_options';

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

  const devices = [
    { name: 'iphone_se_375x667', w: 375, h: 667 },
    { name: 'iphone_14_390x844', w: 390, h: 844 },
    { name: 'iphone_safari_390x700', w: 390, h: 700 },
    { name: 'ipad_768x1024', w: 768, h: 1024 },
    { name: 'desktop_1280x800', w: 1280, h: 800 }
  ];

  for (const d of devices) {
    await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Option A:
    await page.evaluate(() => {
      const sectionContainer = document.querySelector('#landing-hero-section');
      sectionContainer.className = "relative w-full h-[calc(100svh-57px)] shrink-0 overflow-hidden";
      
      const heroSection = sectionContainer.querySelector('section');
      heroSection.className = "relative w-full h-full overflow-hidden flex items-center justify-center select-none";
      heroSection.style.height = "100%";
      heroSection.style.minHeight = "100%";

      const innerDiv = heroSection.querySelector('div.relative.z-10');
      innerDiv.className = "relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-0 m-0";

      const img = innerDiv.querySelector('img');
      img.className = "w-full h-full object-cover object-[center_top] select-none pointer-events-none";
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, `optA_no_neg_margin_${d.name}.png`) });

    // Option B:
    await page.evaluate(() => {
      const header = document.querySelector('header');
      header.className = "sticky top-0 z-30 shrink-0 bg-transparent border-b-0";

      const sectionContainer = document.querySelector('#landing-hero-section');
      sectionContainer.className = "relative w-full h-[100svh] min-h-[100svh] -mt-[57px] shrink-0";

      const heroSection = sectionContainer.querySelector('section');
      heroSection.className = "relative w-full h-full overflow-hidden flex items-center justify-center select-none";
      heroSection.style.height = "100svh";

      const innerDiv = heroSection.querySelector('div.relative.z-10');
      innerDiv.className = "relative z-10 w-full h-full flex items-center justify-center overflow-hidden pt-[60px] pb-2";

      const img = innerDiv.querySelector('img');
      img.className = "w-full h-full object-cover object-[center_top] select-none pointer-events-none";
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, `optB_transparent_header_${d.name}.png`) });

    // Option C:
    await page.evaluate(() => {
      const sectionContainer = document.querySelector('#landing-hero-section');
      sectionContainer.className = "relative w-full h-[100svh] min-h-[100svh] shrink-0 overflow-hidden";
      
      const heroSection = sectionContainer.querySelector('section');
      heroSection.className = "relative w-full h-full overflow-hidden select-none";
      heroSection.style.height = "100svh";

      const innerDiv = heroSection.querySelector('div.relative.z-10');
      innerDiv.className = "absolute inset-0 w-full h-full overflow-hidden";

      const img = innerDiv.querySelector('img');
      img.className = "w-full h-full object-cover object-[center_top] select-none pointer-events-none";
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, `optC_full_bleed_hero_${d.name}.png`) });
  }

  await browser.close();
  console.log('Saved options to', OUTPUT_DIR);
})();
