import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\desktop_fill_experiments';

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
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Experiment 1: Desktop object-cover object-center
  await page.evaluate(() => {
    const section = document.querySelector('#landing-hero-section');
    section.className = "relative w-full h-[100svh] min-h-[100svh] shrink-0 overflow-hidden";
    const img = section.querySelector('img[alt*="Mekara"]');
    img.className = "w-full h-full object-cover object-center select-none pointer-events-none";
    const inner = section.querySelector('div.relative.z-10');
    inner.className = "relative z-10 w-full h-full overflow-hidden p-0 m-0";
  });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'exp1_desktop_cover_center.png') });

  // Experiment 2: Desktop object-cover object-[center_35%] (shows woman + kuih + headline)
  await page.evaluate(() => {
    const img = document.querySelector('#landing-hero-section img[alt*="Mekara"]');
    img.className = "w-full h-full object-cover object-[center_35%] select-none pointer-events-none";
  });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'exp2_desktop_cover_35.png') });

  // Experiment 3: Seamless edge-to-edge backdrop blending:
  // Background matches exact edge colors of the artwork (#FCEFE9 / #F7E0D7), with subtle radial bloom and full-bleed ambient cover,
  // while the uncropped artwork is centered and seamlessly blends into the edges without any visible box or border!
  await page.evaluate(() => {
    const section = document.querySelector('#landing-hero-section section');
    section.className = "relative w-full h-full overflow-hidden bg-gradient-to-r from-[#F6DED5] via-[#FCF1EC] to-[#F7D8D0] flex items-center justify-center select-none";
    
    // Ambient blur layer at high opacity so it fills the screen with the exact same tones and warm atmosphere
    const ambient = section.querySelector('div[aria-hidden="true"]');
    ambient.className = "absolute inset-0 pointer-events-none overflow-hidden opacity-60 select-none";
    ambient.querySelector('img').className = "w-full h-full object-cover blur-2xl scale-110 brightness-105";

    const inner = section.querySelector('div.relative.z-10');
    inner.className = "relative z-10 w-full h-full flex items-center justify-center p-0 m-0 max-w-none";

    const img = inner.querySelector('img');
    img.className = "h-full w-auto max-w-full object-contain object-center drop-shadow-[0_20px_50px_rgba(128,0,32,0.12)] select-none pointer-events-none";
  });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'exp3_seamless_ambient_blend.png') });

  // Experiment 4: Full bleed split hero on desktop:
  // Left side: Elegant typography and headline + Mekara butterfly
  // Right side: Illustrated artwork contained beautifully
  // Wait, the prompt says DO NOT redraw or add a second copy of headline. So Experiment 4 is not allowed.

  await browser.close();
  console.log('Saved desktop experiments');
})();
