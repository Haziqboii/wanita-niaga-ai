import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 900, height: 1000, deviceScaleFactor: 2 })

  const beforeBase64 = fs.readFileSync(path.join(ARTIFACT_DIR, '.user_uploaded', 'media_1794548261404_d4d958f2.jpg')).toString('base64')
  const afterBase64 = fs.readFileSync(path.join(OUTPUT_DIR, 'hero_fixed_390px.png')).toString('base64')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', sans-serif;
          background: #28152F;
          padding: 30px;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        .title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #FFF5FA;
          margin-bottom: 6px;
        }
        .subtitle {
          font-size: 14px;
          color: #F1D3E3;
        }
        .cards {
          display: flex;
          gap: 28px;
          justify-content: center;
          width: 100%;
        }
        .card-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 390px;
        }
        .tag {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tag-before {
          background: #FFE4E6;
          color: #E11D48;
          border: 1px solid #FDA4AF;
        }
        .tag-after {
          background: #D1FAE5;
          color: #059669;
          border: 1px solid #6EE7B7;
        }
        .img-frame {
          width: 380px;
          height: 780px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
          border: 2px solid rgba(255,255,255,0.15);
          background: white;
        }
        .img-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Perbandingan Hero Banner Mudah Alih (Mobile)</h1>
        <p class="subtitle">Isu pemotongan ilustrasi watak telah dibetulkan sepenuhnya</p>
      </div>
      <div class="cards">
        <div class="card-col">
          <div class="tag tag-before">❌ Sebelum (Watak Terpotong)</div>
          <div class="img-frame">
            <img src="data:image/jpeg;base64,${beforeBase64}">
          </div>
        </div>
        <div class="card-col">
          <div class="tag tag-after">✅ Selepas (Watak & Komputer Riba Penuh)</div>
          <div class="img-frame">
            <img src="data:image/png;base64,${afterBase64}">
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  await page.setContent(html, { waitUntil: 'networkidle0' })
  const outPath = path.join(OUTPUT_DIR, 'hero_banner_comparison.png')
  await page.screenshot({ path: outPath, fullPage: true })
  console.log(`Saved comparison to ${outPath}`)

  fs.copyFileSync(outPath, path.join(ARTIFACT_DIR, 'hero_banner_comparison.png'))
  console.log('Copied to artifacts directory')

  await browser.close()
}

run().catch(console.error)
