import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function makeIntegCollage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 950 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 20px; }
          .row { display: flex; gap: 20px; margin-bottom: 20px; }
          .card { background: #1e293b; padding: 12px; border-radius: 12px; }
          h3 { margin-bottom: 8px; color: #f472b6; font-size: 14px; }
          img { border-radius: 8px; display: block; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="card">
            <h3>360px Mobile</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/integ_360.png" style="height: 380px;" />
          </div>
          <div class="card">
            <h3>390px Mobile</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/integ_390.png" style="height: 380px;" />
          </div>
          <div class="card">
            <h3>430px Mobile</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/integ_430.png" style="height: 380px;" />
          </div>
        </div>
        <div class="row">
          <div class="card">
            <h3>1024px Laptop</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/integ_1024.png" style="width: 480px;" />
          </div>
          <div class="card">
            <h3>1280px Desktop</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/integ_1280.png" style="width: 480px;" />
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'collage_integ.png') })
  console.log('Saved collage_integ.png')
  await browser.close()
}

makeIntegCollage()
