import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function renderMockups() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()

  // Test 1: Desktop with Image 1
  await page.setViewport({ width: 1280, height: 850 })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #FFF5FA; padding: 24px; color: #28152F; }
          .container { max-width: 900px; margin: 0 auto; }
          
          .hero-desktop {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #F1D3E3;
            background-color: #FFF5FA;
            background-image: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-desktop.jpg');
            background-size: cover;
            background-position: center right;
            min-height: 280px;
            display: flex;
            align-items: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .hero-content {
            position: relative;
            z-index: 2;
            padding: 32px 36px;
            max-width: 55%;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(254, 226, 226, 0.7);
            border: 1px solid #FBCFE8;
            color: #BE1E72;
            font-size: 13px;
            font-weight: 700;
            padding: 4px 14px;
            border-radius: 9999px;
            margin-bottom: 12px;
          }
          .heading {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 32px;
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
            margin-bottom: 20px;
          }
          .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #BE1E72;
            color: white;
            font-size: 15px;
            font-weight: 700;
            padding: 12px 24px;
            border-radius: 16px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(190, 30, 114, 0.25);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="hero-desktop">
            <div class="hero-content">
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
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'test_hero_desktop.png') })
  console.log('Saved test_hero_desktop.png')

  // Test 2: Mobile with Image 2 (Option A: Button inside hero)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #FFF5FA; padding: 16px; color: #28152F; }
          
          .hero-mobile-a {
            position: relative;
            border-radius: 28px;
            overflow: hidden;
            border: 1px solid #F1D3E3;
            background-color: #FFF5FA;
            background-image: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg');
            background-size: cover;
            background-position: top center;
            height: 480px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
            padding: 24px 20px;
          }
          .hero-top {
            position: relative;
            z-index: 2;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: rgba(255, 235, 245, 0.9);
            border: 1px solid #FBCFE8;
            color: #BE1E72;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 10px;
            backdrop-filter: blur(4px);
          }
          .heading {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 26px;
            font-weight: 800;
            line-height: 1.18;
            color: #28152F;
            margin-bottom: 8px;
          }
          .heart { color: #BE1E72; font-weight: 400; }
          .subtext {
            font-size: 13.5px;
            color: #68586B;
            line-height: 1.45;
            margin-bottom: 14px;
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
            padding: 12px 22px;
            border-radius: 16px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(190, 30, 114, 0.25);
          }
        </style>
      </head>
      <body>
        <div class="hero-mobile-a">
          <div class="hero-top">
            <div class="badge">✨ Pembantu Perniagaan Pintar</div>
            <h1 class="heading">Hai Puan!<br>Jom semak jualan. <span class="heart">♡</span></h1>
            <p class="subtext">Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.</p>
            <button class="btn-primary">Mula dengan AI &rarr;</button>
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'test_hero_mobile_a.png') })
  console.log('Saved test_hero_mobile_a.png')

  // Test 3: Mobile with Image 2 (Option B: Matching Reference Mockup Card)
  // Let's see how Option B looks
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #FFF5FA; padding: 16px; color: #28152F; }
          
          .hero-mobile-b {
            position: relative;
            border-radius: 28px;
            overflow: hidden;
            border: 1px solid #F1D3E3;
            background-color: #FFF5FA;
            background-image: url('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg');
            background-size: 120%;
            background-position: right 85%;
            height: 230px;
            padding: 20px 18px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          }
          .hero-content {
            position: relative;
            z-index: 2;
            max-width: 58%;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(255, 235, 245, 0.95);
            border: 1px solid #FBCFE8;
            color: #BE1E72;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 9999px;
            margin-bottom: 8px;
          }
          .heading {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 21px;
            font-weight: 800;
            line-height: 1.15;
            color: #28152F;
            margin-bottom: 6px;
          }
          .heart { color: #BE1E72; font-weight: 400; }
          .subtext {
            font-size: 12px;
            color: #68586B;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="hero-mobile-b">
          <div class="hero-content">
            <div class="badge">✨ Pembantu Perniagaan Pintar</div>
            <h1 class="heading">Hai Puan!<br>Jom semak<br>jualan. <span class="heart">♡</span></h1>
            <p class="subtext">Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.</p>
          </div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'test_hero_mobile_b.png') })
  console.log('Saved test_hero_mobile_b.png')

  await browser.close()
}

renderMockups()
