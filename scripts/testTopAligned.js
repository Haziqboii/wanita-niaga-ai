import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function testTopAligned() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

  const heights = [480, 520, 560, 600]

  for (const h of heights) {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #FFF5FA; padding: 16px; color: #28152F; }
            .hero {
              position: relative;
              border-radius: 28px;
              overflow: hidden;
              border: 1.5px solid #F1D3E3;
              background-color: #FFF5FA;
              background-image: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg');
              background-size: 100% auto;
              background-position: center top;
              background-repeat: no-repeat;
              height: ${h}px;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              padding: 24px 20px;
              box-shadow: 0 2px 8px rgba(190, 30, 114, 0.06);
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: rgba(255, 235, 245, 0.95);
              border: 1px solid #FBCFE8;
              color: #BE1E72;
              font-size: 11.5px;
              font-weight: 700;
              padding: 4px 12px;
              border-radius: 9999px;
              margin-bottom: 10px;
              width: fit-content;
            }
            .heading {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 26px;
              font-weight: 800;
              line-height: 1.15;
              color: #28152F;
              margin-bottom: 8px;
            }
            .heart { color: #BE1E72; font-weight: 400; }
            .subtext {
              font-size: 13.5px;
              color: #68586B;
              line-height: 1.45;
              margin-bottom: 16px;
              max-width: 280px;
            }
            .btn-primary {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: #BE1E72;
              color: white;
              font-size: 15px;
              font-weight: 700;
              padding: 12px 24px;
              border-radius: 16px;
              border: none;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(190, 30, 114, 0.28);
              width: fit-content;
            }
          </style>
        </head>
        <body>
          <div class="hero">
            <div class="badge">✨ Pembantu Perniagaan Pintar</div>
            <h1 class="heading">Hai Puan!<br>Jom semak jualan. <span class="heart">♡</span></h1>
            <p class="subtext">Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.</p>
            <button class="btn-primary">Mula dengan AI &rarr;</button>
          </div>
        </body>
      </html>
    `)
    await new Promise(r => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUTPUT_DIR, `test_top_${h}.png`) })
    console.log(`Saved test_top_${h}.png`)
  }

  await browser.close()
}

testTopAligned()
