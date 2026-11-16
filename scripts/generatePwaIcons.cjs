const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const symbolBase64 = fs.readFileSync('public/images/mekara-symbol.png').toString('base64');
  const symbolSrc = 'data:image/png;base64,' + symbolBase64;

  const page = await browser.newPage();

  async function generateIcon(size, filename, maskable = false) {
    const radius = maskable ? 0 : Math.round(size * 0.22);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
          .icon-container {
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, #800020 0%, #600018 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: ${radius}px;
            box-shadow: 0 ${Math.round(size * 0.04)}px ${Math.round(size * 0.1)}px rgba(0,0,0,0.25);
          }
          img {
            width: ${Math.round(size * 0.65)}px;
            height: ${Math.round(size * 0.65)}px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="icon-container">
          <img src="${symbolSrc}" />
        </div>
      </body>
      </html>
    `;
    await page.setViewport({ width: size, height: size });
    await page.setContent(html);
    await page.screenshot({ path: path.join('public/images', filename), omitBackground: true });
    console.log('Generated', filename, size, 'x', size);
  }

  await generateIcon(192, 'icon-192.png');
  await generateIcon(512, 'icon-512.png');
  await generateIcon(512, 'icon-maskable-512.png', true);
  await generateIcon(180, 'apple-touch-icon.png');

  await browser.close();
  console.log('All PWA icons generated!');
}

run().catch(console.error);
