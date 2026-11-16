import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  for (const [w, h, name] of [
    [375, 667, 'iPhone SE (375x667)'],
    [390, 844, 'iPhone 14/15/16 (390x844)'],
    [412, 915, 'Pixel 7 (412x915)'],
    [430, 932, 'iPhone Pro Max (430x932)'],
    [768, 1024, 'iPad (768x1024)'],
    [1280, 800, 'Desktop (1280x800)']
  ]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    const info = await page.evaluate(() => {
      const section = document.querySelector('#landing-hero-section');
      const img = document.querySelector('#landing-hero-section img[alt*="Mekara"]');
      if (!img || !section) return null;
      const sRect = section.getBoundingClientRect();
      const iRect = img.getBoundingClientRect();
      
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const elementRatio = iRect.width / iRect.height;
      let renderedW = iRect.width;
      let renderedH = iRect.height;
      let gapX = 0;
      let gapY = 0;
      
      if (elementRatio > naturalRatio) {
        renderedW = iRect.height * naturalRatio;
        gapX = (iRect.width - renderedW) / 2;
      } else {
        renderedH = iRect.width / naturalRatio;
        gapY = (iRect.height - renderedH) / 2;
      }

      return {
        section: { w: sRect.width, h: sRect.height },
        imgTag: { x: iRect.x, y: iRect.y, w: iRect.width, h: iRect.height },
        renderedImage: { w: renderedW, h: renderedH, gapLeftRight: gapX, gapTopBottom: gapY },
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      };
    });
    console.log(`=== ${name} ===`);
    console.log(info);
  }

  await browser.close();
})();
