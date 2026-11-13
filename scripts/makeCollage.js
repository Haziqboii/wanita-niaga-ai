import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function makeCollage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1500, height: 1100 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 24px; }
          h2 { margin-bottom: 16px; color: #f472b6; }
          .section { margin-bottom: 24px; }
          .row { display: flex; gap: 16px; align-items: flex-start; }
          .card { background: #1e293b; padding: 12px; border-radius: 12px; border: 1px solid #334155; }
          .card h4 { margin-bottom: 8px; font-size: 13px; color: #94a3b8; }
          img { border-radius: 8px; display: block; }
          .mobile-img { height: 420px; width: auto; }
          .desktop-img { width: 440px; height: auto; }
        </style>
      </head>
      <body>
        <h2>Hero Banner Responsive Layout Review</h2>
        <div class="section">
          <h3 style="margin-bottom: 10px; font-size: 16px;">Mobile (Using Image 2: hero-banner-mobile.jpg)</h3>
          <div class="row">
            <div class="card">
              <h4>360px Mobile</h4>
              <img class="mobile-img" src="file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_360px.png" />
            </div>
            <div class="card">
              <h4>390px Mobile</h4>
              <img class="mobile-img" src="file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_390px.png" />
            </div>
            <div class="card">
              <h4>430px Mobile</h4>
              <img class="mobile-img" src="file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_430px.png" />
            </div>
          </div>
        </div>

        <div class="section">
          <h3 style="margin-bottom: 10px; font-size: 16px;">Tablet / Laptop / Desktop (Using Image 1: hero-banner-desktop.jpg)</h3>
          <div class="row">
            <div class="card">
              <h4>768px Tablet</h4>
              <img class="desktop-img" src="file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_768px.png" />
            </div>
            <div class="card">
              <h4>1024px Laptop</h4>
              <img class="desktop-img" src="file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_1024px.png" />
            </div>
            <div class="card">
              <h4>1280px Desktop</h4>
              <img class="desktop-img" src="file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_1280px.png" />
            </div>
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'collage_hero_responsive.png') })
  console.log('Saved collage_hero_responsive.png')
  await browser.close()
}

makeCollage()
