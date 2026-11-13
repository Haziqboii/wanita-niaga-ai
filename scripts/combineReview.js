import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function combine() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }
          .card { background: #2a2a2a; padding: 10px; border-radius: 8px; text-align: center; }
          img { width: 100%; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h2>Mobile Hero Height Tests (390px Viewport)</h2>
        <div class="grid">
          <div class="card">
            <h4>h320 (320px)</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_mobile_h320.png" />
          </div>
          <div class="card">
            <h4>h360 (360px)</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_mobile_h360.png" />
          </div>
          <div class="card">
            <h4>h400 (400px)</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_mobile_h400.png" />
          </div>
          <div class="card">
            <h4>h440 (440px)</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_mobile_h440.png" />
          </div>
          <div class="card">
            <h4>h_auto_fit</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_mobile_h_auto_fit.png" />
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'compare_mobile_heights.png') })
  console.log('Saved compare_mobile_heights.png')
  await browser.close()
}

combine()
