import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const REF2_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794514127168_6dbfa349.png'

async function compareSideBySide() {
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
          .row { display: flex; gap: 20px; align-items: flex-start; }
          .card { background: #1e293b; padding: 14px; border-radius: 12px; }
          h3 { margin-bottom: 10px; color: #f472b6; font-size: 15px; }
          img { border-radius: 8px; display: block; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="card" style="flex: 1;">
            <h3>User Reference Mockup (media_1794514127168_6dbfa349.png)</h3>
            <img src="file:///${REF2_PATH}" style="width: 100%; height: auto;" />
          </div>
          <div class="card" style="flex: 1;">
            <h3>Our Implementation (story_desktop.png)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/story_desktop.png" style="width: 100%; height: auto;" />
          </div>
          <div class="card">
            <h3>Our Implementation (story_390px.png)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/story_390px.png" style="width: 320px; height: auto;" />
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_side_by_side.png') })
  console.log('Saved story_side_by_side.png')
  await browser.close()
}

compareSideBySide()
