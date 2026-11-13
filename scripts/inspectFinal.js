import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function inspectFinal() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 1100 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 20px; }
          .row { display: flex; gap: 24px; align-items: flex-start; }
          .card { background: #1e293b; padding: 14px; border-radius: 12px; }
          h3 { margin-bottom: 10px; color: #f472b6; font-size: 15px; }
          img { border-radius: 8px; display: block; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="card">
            <h3>Phone Viewport (390px - iPhone)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/homepage_390px.png" style="width: 320px; height: auto;" />
          </div>
          <div class="card" style="flex: 1;">
            <h3>Desktop / Laptop Viewport (1280px)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/homepage_desktop.png" style="width: 100%; height: auto;" />
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'final_hero_review.png') })
  console.log('Saved final_hero_review.png')
  await browser.close()
}

inspectFinal()
