import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const REF_IMG = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794511897165_8472d880.jpg'
const DESKTOP_BANNER = 'C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-desktop.jpg'
const MOBILE_BANNER = 'C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg'

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  
  // Crop mobile hero area from reference
  await page.setViewport({ width: 1200, height: 1200 })
  await page.setContent(`
    <html>
      <body style="margin:0; background:#eee;">
        <img id="ref" src="file:///${REF_IMG.replace(/\\/g, '/')}" style="position:absolute; left:0; top:0;" />
      </body>
    </html>
  `)
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 500))
  
  // Mobile phone screen bounding in the reference image:
  // In reference (682 x 1024):
  // Phone starts around x: 10, y: 15, width: 280, height: 980
  // Phone hero card starts around y: 110 to y: 360
  // Phone Ceritakan card starts around y: 370 to y: 510
  
  // Desktop screen in reference:
  // Starts around x: 430, y: 35, width: 540, height: 500
  // Desktop hero card starts around y: 110 to y: 300
  
  console.log('Inspection script loaded successfully.')
  await browser.close()
}

inspect()
