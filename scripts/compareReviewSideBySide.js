import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const REF3_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794514975904_b20f7acb.png'

async function compareSideBySide() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1450, height: 920, deviceScaleFactor: 1.5 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #fff; padding: 24px; }
          .header { margin-bottom: 20px; }
          .header h1 { font-size: 20px; color: #f472b6; font-weight: bold; }
          .header p { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .row { display: flex; gap: 20px; align-items: flex-start; justify-content: center; }
          .card { background: #1e293b; padding: 14px; border-radius: 14px; border: 1px solid #334155; }
          h3 { margin-bottom: 12px; color: #fdf2f8; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
          .badge { background: #be1e72; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 999px; }
          img { border-radius: 8px; display: block; border: 1px solid #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UI Redesign 03: Sales Data Review & Confirmation ("Semak Maklumat")</h1>
          <p>Side-by-side design fidelity verification against reference mockup</p>
        </div>
        <div class="row">
          <div class="card" style="flex: 1; max-width: 440px;">
            <h3><span class="badge">Reference</span> User Provided Mockup</h3>
            <img src="file:///${REF3_PATH}" style="width: 100%; height: auto;" />
          </div>
          <div class="card" style="flex: 1; max-width: 440px;">
            <h3><span class="badge" style="background: #0d9488;">Built</span> Mobile View (390px iPhone)</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/review_390px.png" style="width: 100%; height: auto;" />
          </div>
          <div class="card" style="flex: 1; max-width: 500px;">
            <h3><span class="badge" style="background: #7c3aed;">Interactive</span> Added + Edited Record</h3>
            <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/review_390px_edited.png" style="width: 100%; height: auto;" />
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  const outPath = path.join(OUTPUT_DIR, 'review_side_by_side.png')
  await page.screenshot({ path: outPath, fullPage: true })
  console.log('Saved review_side_by_side.png to screenshots')

  if (fs.existsSync(ARTIFACTS_DIR)) {
    fs.copyFileSync(outPath, path.join(ARTIFACTS_DIR, 'review_side_by_side.png'))
    console.log('Copied to artifacts dir')
  }

  await browser.close()
}

compareSideBySide().catch(err => {
  console.error(err)
  process.exit(1)
})
