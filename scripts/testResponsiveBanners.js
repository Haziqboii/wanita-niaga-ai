import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function testResponsive() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()

  const viewports = [
    { name: '360px', width: 360, height: 780, isMobile: true },
    { name: '390px', width: 390, height: 844, isMobile: true },
    { name: '430px', width: 430, height: 932, isMobile: true },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '1024px', width: 1024, height: 768, isMobile: false },
    { name: '1280px', width: 1280, height: 850, isMobile: false },
  ]

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #FFF5FA; padding: 16px; color: #28152F; }
            .container { max-width: 1024px; margin: 0 auto; }
            
            /* Mobile Hero Banner (<640px) */
            @media (max-width: 639px) {
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
                height: clamp(480px, 125vw, 540px);
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                padding: 22px 18px;
                box-shadow: 0 2px 10px rgba(190, 30, 114, 0.05);
              }
              .hero-text {
                position: relative;
                z-index: 2;
                max-width: 290px;
              }
              .badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: rgba(255, 235, 245, 0.95);
                border: 1px solid #FBCFE8;
                color: #BE1E72;
                font-size: 11px;
                font-weight: 700;
                padding: 4px 11px;
                border-radius: 9999px;
                margin-bottom: 8px;
                width: fit-content;
              }
              .heading {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: clamp(22px, 6.2vw, 26px);
                font-weight: 800;
                line-height: 1.15;
                color: #28152F;
                margin-bottom: 6px;
              }
              .heart { color: #BE1E72; font-weight: 400; }
              .subtext {
                font-size: 13px;
                color: #68586B;
                line-height: 1.4;
                margin-bottom: 14px;
              }
              .btn-primary {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                background: #BE1E72;
                color: white;
                font-size: 14px;
                font-weight: 700;
                padding: 11px 22px;
                border-radius: 16px;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(190, 30, 114, 0.25);
              }
            }

            /* Laptop / Desktop Hero Banner (>=640px) */
            @media (min-width: 640px) {
              .hero {
                position: relative;
                border-radius: 28px;
                overflow: hidden;
                border: 1.5px solid #F1D3E3;
                background-color: #FFF5FA;
                background-image: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-desktop.jpg');
                background-size: cover;
                background-position: center right;
                background-repeat: no-repeat;
                min-height: 290px;
                display: flex;
                align-items: center;
                padding: 32px 36px;
                box-shadow: 0 2px 10px rgba(190, 30, 114, 0.05);
              }
              .hero-text {
                position: relative;
                z-index: 2;
                max-width: 52%;
              }
              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 235, 245, 0.95);
                border: 1px solid #FBCFE8;
                color: #BE1E72;
                font-size: 12px;
                font-weight: 700;
                padding: 4px 13px;
                border-radius: 9999px;
                margin-bottom: 12px;
                width: fit-content;
              }
              .heading {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: clamp(26px, 3vw, 32px);
                font-weight: 800;
                line-height: 1.15;
                color: #28152F;
                margin-bottom: 10px;
              }
              .heart { color: #BE1E72; font-weight: 400; }
              .subtext {
                font-size: 15px;
                color: #68586B;
                line-height: 1.5;
                margin-bottom: 18px;
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
                padding: 12px 26px;
                border-radius: 16px;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(190, 30, 114, 0.25);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="hero">
              <div class="hero-text">
                <div class="badge">✨ Pembantu Perniagaan Pintar</div>
                <h1 class="heading">Hai Puan!<br>Jom semak jualan. <span class="heart">♡</span></h1>
                <p class="subtext">Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.</p>
                <button class="btn-primary">Mula dengan AI &rarr;</button>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    await new Promise(r => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUTPUT_DIR, `responsive_${vp.name}.png`) })
    console.log(`Saved responsive_${vp.name}.png`)
  }

  await browser.close()
}

testResponsive()
