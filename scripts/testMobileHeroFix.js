import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const viewports = [
    { name: '360px', width: 360, height: 780 },
    { name: '390px', width: 390, height: 844 }, // iPhone 13/14
    { name: '430px', width: 430, height: 932 }, // iPhone Pro Max
  ]

  // We will test several CSS options for the mobile hero banner:
  // Option 1: bg-bottom with bg-[length:100%_auto] and tuned height
  // Option 2: separate illustration element or flex layout
  // Option 3: natural aspect ratio or tuned clamp height
  
  const options = [
    {
      id: 'opt1_bg_bottom_h500',
      name: 'Option 1: bg-bottom with h-[500px]',
      cardHeight: '500px',
      bgClass: 'bg-no-repeat bg-[center_bottom] bg-[length:100%_auto]',
    },
    {
      id: 'opt2_bg_bottom_h540',
      name: 'Option 2: bg-bottom with h-[540px]',
      cardHeight: '540px',
      bgClass: 'bg-no-repeat bg-[center_bottom] bg-[length:100%_auto]',
    },
    {
      id: 'opt3_bg_bottom_h580',
      name: 'Option 3: bg-bottom with h-[580px]',
      cardHeight: '580px',
      bgClass: 'bg-no-repeat bg-[center_bottom] bg-[length:100%_auto]',
    },
    {
      id: 'opt4_bg_bottom_clamp',
      name: 'Option 4: bg-bottom with h-[clamp(480px,135vw,560px)]',
      cardHeight: 'clamp(480px, 135vw, 560px)',
      bgClass: 'bg-no-repeat bg-[center_bottom] bg-[length:100%_auto]',
    },
    {
      id: 'opt5_bg_contain_bottom',
      name: 'Option 5: bg-bottom with bg-contain',
      cardHeight: 'clamp(460px, 125vw, 520px)',
      bgClass: 'bg-no-repeat bg-[center_bottom] bg-contain',
    },
  ]

  const page = await browser.newPage()

  for (const opt of options) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #FFF5FA;
              color: #28152F;
              padding: 16px;
              min-height: 100vh;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 4px 0 16px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand-icon {
              width: 38px;
              height: 38px;
              border-radius: 12px;
              background: #FFF0F7;
              border: 1px solid #F1D3E3;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
            }
            .brand-text h1 {
              font-size: 18px;
              font-weight: 800;
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .ai-badge {
              background: #BE1E72;
              color: white;
              font-size: 11px;
              font-weight: 800;
              padding: 1px 7px;
              border-radius: 100px;
            }
            .brand-text p {
              font-size: 11px;
              color: #68586B;
            }
            .help-btn {
              width: 38px;
              height: 38px;
              border-radius: 100px;
              border: 1.5px solid #BE1E72;
              color: #BE1E72;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
            }

            .hero-card {
              position: relative;
              border: 1px solid #F1D3E3;
              border-radius: 24px;
              overflow: hidden;
              background-color: #FFF5FA;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              height: ${opt.cardHeight};
            }

            .hero-bg {
              position: absolute;
              inset: 0;
              pointer-events: none;
              z-index: 0;
              background-image: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg');
            }

            .hero-content {
              position: relative;
              z-index: 10;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              padding: 20px 20px;
            }

            .pill-tag {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(253, 226, 243, 0.95);
              border: 1px solid rgba(244, 186, 220, 0.9);
              color: #BE1E72;
              font-size: 12px;
              font-weight: 700;
              padding: 4px 12px;
              border-radius: 100px;
              width: fit-content;
              margin-bottom: 10px;
            }

            .hero-title {
              font-size: 23px;
              font-weight: 800;
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #28152F;
              line-height: 1.2;
              margin-bottom: 8px;
              max-width: 280px;
            }

            .hero-title .heart {
              color: #BE1E72;
            }

            .hero-subtitle {
              font-size: 13px;
              color: #68586B;
              line-height: 1.45;
              margin-bottom: 16px;
              max-width: 270px;
            }

            .btn-cta {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: #BE1E72;
              color: white;
              font-size: 14px;
              font-weight: 700;
              padding: 12px 24px;
              border-radius: 16px;
              border: none;
              box-shadow: 0 4px 12px rgba(190, 30, 114, 0.25);
              width: fit-content;
              cursor: pointer;
            }

            .section-other {
              margin-top: 20px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              font-family: 'Plus Jakarta Sans', sans-serif;
              margin-bottom: 12px;
            }
            .action-card {
              display: flex;
              align-items: center;
              gap: 12px;
              background: white;
              border: 1px solid #F1D3E3;
              border-radius: 16px;
              padding: 14px 16px;
              margin-bottom: 10px;
            }
            .action-icon {
              width: 40px;
              height: 40px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            }
            .action-info h3 {
              font-size: 14px;
              font-weight: 700;
            }
            .action-info p {
              font-size: 12px;
              color: #68586B;
            }
            .action-arrow {
              margin-left: auto;
              color: #BE1E72;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <div class="brand-icon">🏪</div>
              <div class="brand-text">
                <h1>Wanita Niaga <span class="ai-badge">AI</span></h1>
                <p>Kenali Jualan, Rancang Keuntungan</p>
              </div>
            </div>
            <div class="help-btn">?</div>
          </div>

          <div class="hero-card">
            <div class="hero-bg ${opt.bgClass}"></div>
            <div class="hero-content">
              <div class="pill-tag">✨ Pembantu Perniagaan Pintar</div>
              <h2 class="hero-title">Hai Puan!<br>Jom semak jualan. <span class="heart">♡</span></h2>
              <p class="hero-subtitle">Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.</p>
              <button class="btn-cta">Mula dengan AI &rarr;</button>
            </div>
          </div>

          <div class="section-other">
            <h3 class="section-title">Atau pilih cara lain</h3>
            <div class="action-card">
              <div class="action-icon" style="background: #E8F8F0;">📊</div>
              <div class="action-info">
                <h3>Muat Naik Excel / CSV</h3>
                <p>Gunakan fail jualan sedia ada.</p>
              </div>
              <div class="action-arrow">&rsaquo;</div>
            </div>
            <div class="action-card">
              <div class="action-icon" style="background: #F3E8FF;">✏️</div>
              <div class="action-info">
                <h3>Isi Jualan Manual</h3>
                <p>Masukkan maklumat satu persatu.</p>
              </div>
              <div class="action-arrow">&rsaquo;</div>
            </div>
          </div>
        </body>
        </html>
      `

      // Apply the bgClass style inline to verify
      const styledHtml = html.replace(
        `class="hero-bg ${opt.bgClass}"`,
        `class="hero-bg" style="${
          opt.id.includes('contain')
            ? 'background-size: contain; background-position: center bottom; background-repeat: no-repeat;'
            : 'background-size: 100% auto; background-position: center bottom; background-repeat: no-repeat;'
        }"`
      )

      await page.setContent(styledHtml, { waitUntil: 'networkidle0' })
      const outPath = path.join(OUTPUT_DIR, `test_${opt.id}_${vp.name}.png`)
      await page.screenshot({ path: outPath, fullPage: true })
    }
  }

  await browser.close()
  console.log('Finished testing options!')
}

run().catch(console.error)
