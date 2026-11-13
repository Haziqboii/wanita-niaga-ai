import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function check() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  
  // Create an HTML page showing:
  // 1. Reference image
  // 2. Image 1 (desktop)
  // 3. Image 2 (phone)
  await page.setViewport({ width: 1400, height: 1000 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #222; color: #fff; padding: 20px; }
          .row { display: flex; gap: 20px; align-items: flex-start; }
          .col { background: #333; padding: 15px; border-radius: 12px; }
          img { border-radius: 8px; display: block; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="col">
            <h3>Reference (media_1794511897165_8472d880.jpg)</h3>
            <img src="file:///C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794511897165_8472d880.jpg" style="height: 600px; width: auto;" />
          </div>
          <div class="col">
            <h3>User Upload 1 (Desktop: 1024x431)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-desktop.jpg" style="width: 500px; height: auto;" />
          </div>
          <div class="col">
            <h3>User Upload 2 (Phone: 388x769)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg" style="width: 250px; height: auto;" />
          </div>
        </div>
      </body>
    </html>
  `)
  
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'compare_inputs.png') })
  console.log('Saved compare_inputs.png')
  await browser.close()
}

check()
