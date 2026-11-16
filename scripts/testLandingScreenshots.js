import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\landing_fill_test';

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
  
  // Test both object-cover styles
  const viewports = [
    { name: '375x667_iphone_se', w: 375, h: 667 },
    { name: '390x844_iphone14', w: 390, h: 844 },
    { name: '412x915_pixel7', w: 412, h: 915 },
    { name: '430x932_promax', w: 430, h: 932 },
    { name: '768x1024_ipad', w: 768, h: 1024 },
    { name: '1280x800_desktop', w: 1280, h: 800 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, `current_${vp.name}.png`) });
  }

  await browser.close();
  console.log('Current screenshots saved to', OUTPUT_DIR);
})();
