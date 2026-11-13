import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const REF_IMAGE_PATH = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\.user_uploaded\\media_1794542756319_57de365e.jpg'
const BASE_URL = 'http://localhost:5173'

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    // Test 390px mobile viewport (iPhone 12/13/14)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // 1. Click "Cuba Data Contoh" on Homepage
    const sampleBtn = await page.$('button ::-p-text(Cuba Data Contoh)')
    if (!sampleBtn) throw new Error('Cuba Data Contoh button not found')
    await sampleBtn.click()
    await new Promise(r => setTimeout(r, 600))

    // 2. Click "Tanya Pembantu AI" button on Dashboard
    const askAiBtn = await page.$('button ::-p-text(Tanya Pembantu AI)')
    if (!askAiBtn) throw new Error('Tanya Pembantu AI button not found')
    await askAiBtn.click()
    await new Promise(r => setTimeout(r, 600))

    console.log('Navigated to Chat page.')

    // 3. Verify Subtitle is strictly "Nasihat perniagaan ringkas dan mudah" (no "santai untuk puan")
    const pageText = await page.evaluate(() => document.body.innerText)
    if (pageText.toLowerCase().includes('santai untuk puan')) {
      throw new Error('FAIL: "santai untuk puan" still found in page text!')
    }
    if (!pageText.includes('Nasihat perniagaan ringkas dan mudah')) {
      throw new Error('FAIL: "Nasihat perniagaan ringkas dan mudah" was not found!')
    }
    console.log('PASS: Subtitle is exactly "Nasihat perniagaan ringkas dan mudah".')

    // 4. Verify no GEMINI teal badge in header
    const hasTealBadge = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(
        e => e.textContent === 'Gemini' && window.getComputedStyle(e).color.includes('13, 148, 136')
      )
      return !!el
    })
    if (hasTealBadge) {
      throw new Error('FAIL: Teal GEMINI badge was found!')
    }
    console.log('PASS: No GEMINI teal badge.')

    // 5. Verify horizontal scroll action is present on the chips row AND has no-scrollbar class
    const scrollInfo = await page.evaluate(() => {
      const row = document.querySelector('.no-scrollbar')
      if (!row) return null
      return {
        hasNoScrollbarClass: row.classList.contains('no-scrollbar'),
        scrollWidth: row.scrollWidth,
        clientWidth: row.clientWidth,
        canScrollHorizontally: row.scrollWidth > row.clientWidth,
      }
    })
    console.log('PASS: Quick question scroll verification:', scrollInfo)
    if (!scrollInfo || !scrollInfo.canScrollHorizontally) {
      throw new Error('FAIL: Quick question row cannot scroll horizontally!')
    }

    // 6. Verify NO visible scroller UI / arrow helper bar
    const hasArrowNav = await page.evaluate(() => {
      return document.body.innerText.includes('Gelongsor atau tekan anak panah')
    })
    if (hasArrowNav) {
      throw new Error('FAIL: Arrow navigation bar was found!')
    }
    console.log('PASS: No scroller UI / arrow helper bar.')

    // 7. Test scroll action horizontally via page.evaluate
    await page.evaluate(() => {
      const row = document.querySelector('.no-scrollbar')
      if (row) row.scrollLeft = 120
    })
    await new Promise(r => setTimeout(r, 300))

    // 8. Test clicking a suggested question
    const firstSuggested = await page.$('button ::-p-text(Produk mana paling laris?)')
    if (firstSuggested) {
      console.log('Clicking suggested question: "Produk mana paling laris?"')
      await firstSuggested.click()
      await new Promise(r => setTimeout(r, 800))
    }

    // 9. Test composer input: Type "Terima kasih" and click "Hantar"
    const input = await page.$('input[placeholder="Taip soalan Puan di sini..."]')
    if (input) {
      console.log('Typing user message: "Bagus, terima kasih!"')
      await input.type('Bagus, terima kasih!')
      const sendBtn = await page.$('button ::-p-text(Hantar)')
      if (sendBtn) {
        await sendBtn.click()
        await new Promise(r => setTimeout(r, 800))
      }
    }

    // 10. Capture 390px full page
    const shot390 = path.join(OUTPUT_DIR, 'chat_390px.png')
    await page.screenshot({ path: shot390, fullPage: true })
    console.log('Saved chat_390px.png')

    // 11. Capture 360px viewport
    await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise(r => setTimeout(r, 300))
    const shot360 = path.join(OUTPUT_DIR, 'chat_360px.png')
    await page.screenshot({ path: shot360, fullPage: true })
    console.log('Saved chat_360px.png')

    // 12. Capture 430px viewport
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise(r => setTimeout(r, 300))
    const shot430 = path.join(OUTPUT_DIR, 'chat_430px.png')
    await page.screenshot({ path: shot430, fullPage: true })
    console.log('Saved chat_430px.png')

    // 13. Capture Desktop viewport (1200px)
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 })
    await new Promise(r => setTimeout(r, 400))
    const shotDesktop = path.join(OUTPUT_DIR, 'chat_desktop.png')
    await page.screenshot({ path: shotDesktop, fullPage: true })
    console.log('Saved chat_desktop.png')

    // 14. Create Side-by-Side Comparison HTML Page
    const compPage = await browser.newPage()
    await compPage.setViewport({ width: 1400, height: 1150, deviceScaleFactor: 2 })
    await compPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #FDF2F8;
              color: #28152F;
              padding: 24px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .badge {
              display: inline-block;
              background: #BE1E72;
              color: white;
              font-size: 11px;
              font-weight: 800;
              padding: 4px 12px;
              border-radius: 9999px;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            h1 { font-size: 22px; color: #28152F; margin-bottom: 4px; }
            p.sub { font-size: 13px; color: #68586B; }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .card {
              background: #FFFFFF;
              border: 1.5px solid #F1D3E3;
              border-radius: 20px;
              padding: 16px;
              box-shadow: 0 4px 16px rgba(190, 30, 114, 0.06);
            }
            .card-title-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #F1D3E3;
            }
            .status-tag-ref {
              background: #EFF6FF;
              color: #1D4ED8;
              font-size: 12px;
              font-weight: 700;
              padding: 3px 10px;
              border-radius: 6px;
              border: 1px solid #BFDBFE;
            }
            .status-tag-live {
              background: #FDF2F8;
              color: #BE1E72;
              font-size: 12px;
              font-weight: 700;
              padding: 3px 10px;
              border-radius: 6px;
              border: 1px solid #F1D3E3;
            }
            .img-container {
              background: #FAF5F8;
              border-radius: 12px;
              padding: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 520px;
            }
            .img-container img {
              max-height: 700px;
              max-width: 100%;
              border-radius: 8px;
              display: block;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            }
            .points {
              margin-top: 12px;
              font-size: 12px;
              line-height: 1.5;
              color: #4A3A4D;
            }
            .points li {
              margin-left: 16px;
              margin-bottom: 3px;
            }
            .summary-box {
              background: #FFFFFF;
              border: 1.5px solid #BE1E72;
              border-radius: 16px;
              padding: 14px 18px;
              display: flex;
              gap: 14px;
              align-items: center;
            }
            .summary-icon {
              font-size: 22px;
              background: #FCE7F3;
              color: #BE1E72;
              width: 40px;
              height: 40px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .summary-text h3 {
              font-size: 14px;
              color: #BE1E72;
              margin-bottom: 2px;
            }
            .summary-text p {
              font-size: 12px;
              color: #28152F;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">KEMAS KINI MAKLUM BALAS</span>
            <h1>Pembantu Niaga AI (Chatbot) — Skrol Pantas Halus Tanpa Bar UI</h1>
            <p class="sub">Tindakan Skrol Dikekalkan &bull; Sifar Bar Skrol / Butang UI &bull; Tiada Lencana Teal &bull; "Nasihat perniagaan ringkas dan mudah"</p>
          </div>

          <div class="grid">
            <!-- RUJUKAN AWAL -->
            <div class="card">
              <div class="card-title-bar">
                <h2 style="font-size: 15px; font-weight: 800; color: #28152F;">Rujukan Awal Pengguna</h2>
                <span class="status-tag-ref">🎨 Rujukan Awal</span>
              </div>
              <div class="img-container">
                <img src="file:///${REF_IMAGE_PATH.replace(/\\/g, '/')}" />
              </div>
              <ul class="points">
                <li>Mempunyai bar anak panah navigasi di bawah soalan pantas.</li>
                <li>Mempunyai lencana GEMINI teal.</li>
                <li>Sari kata: "Nasihat perniagaan ringkas & santai untuk Puan".</li>
              </ul>
            </div>

            <!-- SELEPAS KEMAS KINI -->
            <div class="card">
              <div class="card-title-bar">
                <h2 style="font-size: 15px; font-weight: 800; color: #28152F;">Kemas Kini Terkini (Live 390px)</h2>
                <span class="status-tag-live">✨ Skrol Halus Tanpa Bar UI</span>
              </div>
              <div class="img-container">
                <img src="file:///${shot390.replace(/\\/g, '/')}" />
              </div>
              <ul class="points">
                <li>✅ <strong>Tindakan Skrol Mendatar Aktif:</strong> Soalan pantas berada dalam satu baris yang boleh diskrol/dileret secara mendatar (touch swipe & trackpad).</li>
                <li>✅ <strong>Tiada UI Scroller:</strong> Bar anak panah dibuang dan bar skrol pelayar disembunyikan sepenuhnya (<code>no-scrollbar</code>).</li>
                <li>✅ <strong>Tiada Lencana Teal GEMINI:</strong> Header ringkas dan selaras Berry Pop.</li>
                <li>✅ <strong>Sari Kata Ditukar:</strong> Tepat "Nasihat perniagaan ringkas dan mudah".</li>
              </ul>
            </div>
          </div>

          <div class="summary-box">
            <div class="summary-icon">✨</div>
            <div class="summary-text">
              <h3>Hasil: Skrol Sentuh Yang Sangat Lancar Tanpa Sebarang Gangguan Visual</h3>
              <p>Pengguna boleh meleret barisan cip soalan pantas dengan sangat mudah tanpa melihat bar skrol kelabu yang mengganggu atau butang tambahan, mengekalkan estetik Berry Pop yang bersih dan moden.</p>
            </div>
          </div>
        </body>
      </html>
    `)

    await new Promise(r => setTimeout(r, 600))
    const compShotPath = path.join(OUTPUT_DIR, 'chat_side_by_side.png')
    await compPage.screenshot({ path: compShotPath })
    console.log('Saved chat_side_by_side.png')

    // Copy all to brain artifacts directory
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
    }
    fs.copyFileSync(shot390, path.join(ARTIFACTS_DIR, 'chat_390px.png'))
    fs.copyFileSync(shot360, path.join(ARTIFACTS_DIR, 'chat_360px.png'))
    fs.copyFileSync(shot430, path.join(ARTIFACTS_DIR, 'chat_430px.png'))
    fs.copyFileSync(shotDesktop, path.join(ARTIFACTS_DIR, 'chat_desktop.png'))
    fs.copyFileSync(compShotPath, path.join(ARTIFACTS_DIR, 'chat_side_by_side.png'))
    console.log('All artifacts copied successfully.')
  } finally {
    await browser.close()
  }
}

verify().catch(err => {
  console.error(err)
  process.exit(1)
})
