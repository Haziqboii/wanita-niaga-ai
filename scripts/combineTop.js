import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function combineTop() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .card { background: #2a2a2a; padding: 10px; border-radius: 8px; text-align: center; }
          img { width: 100%; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h2>Mobile Top-Aligned Hero Tests</h2>
        <div class="grid">
          <div class="card">
            <h4>480px</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_top_480.png" />
          </div>
          <div class="card">
            <h4>520px</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_top_520.png" />
          </div>
          <div class="card">
            <h4>560px</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_top_560.png" />
          </div>
          <div class="card">
            <h4>600px</h4>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/test_top_600.png" />
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'compare_top_aligned.png') })
  console.log('Saved compare_top_aligned.png')
  await browser.close()
}

combineTop()
