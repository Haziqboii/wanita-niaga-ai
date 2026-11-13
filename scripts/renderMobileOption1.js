import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'

async function renderFullMobileOptions() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

  // Option 1: Mobile hero banner with button, then "Atau pilih cara lain" (clean, unified with desktop)
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #FFF5FA; padding: 14px; color: #28152F; }
          .header { display: flex; justify-content: space-between; align-items: center; padding: 6px 4px 14px; }
          .brand { display: flex; align-items: center; gap: 8px; }
          .brand-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; }
          .ai-badge { background: #BE1E72; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 6px; }
          
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
            height: 520px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            padding: 24px 20px;
            box-shadow: 0 2px 8px rgba(190, 30, 114, 0.06);
            margin-bottom: 18px;
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
          .sec-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 12px; }
          .option-row {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #fff;
            border: 1px solid #F1D3E3;
            border-radius: 18px;
            padding: 14px 16px;
            margin-bottom: 10px;
          }
          .opt-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
          .opt-title { font-weight: 700; font-size: 14.5px; }
          .opt-sub { font-size: 12px; color: #68586B; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <span style="font-size: 20px;">🏪</span>
            <span class="brand-title">Wanita Niaga</span>
            <span class="ai-badge">AI</span>
          </div>
          <div style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #F1D3E3; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #BE1E72;">?</div>
        </div>

        <div class="hero">
          <div class="badge">✨ Pembantu Perniagaan Pintar</div>
          <h1 class="heading">Hai Puan!<br>Jom semak jualan. <span class="heart">♡</span></h1>
          <p class="subtext">Masukkan maklumat jualan dan lihat laporan perniagaan Puan dengan mudah.</p>
          <button class="btn-primary">Mula dengan AI &rarr;</button>
        </div>

        <div class="sec-title">Atau pilih cara lain</div>

        <div class="option-row">
          <div class="opt-icon" style="background: #ECFDF5; color: #059669;">📊</div>
          <div style="flex: 1;">
            <div class="opt-title">Muat Naik Excel / CSV</div>
            <div class="opt-sub">Gunakan fail jualan sedia ada.</div>
          </div>
          <div>&rsaquo;</div>
        </div>

        <div class="option-row">
          <div class="opt-icon" style="background: #F5F3FF; color: #7C3AED;">✏️</div>
          <div style="flex: 1;">
            <div class="opt-title">Isi Jualan Manual</div>
            <div class="opt-sub">Masukkan maklumat satu persatu.</div>
          </div>
          <div>&rsaquo;</div>
        </div>

        <div class="option-row">
          <div class="opt-icon" style="background: #FFFBEB; color: #D97706;">▶</div>
          <div style="flex: 1;">
            <div class="opt-title">Cuba Data Contoh</div>
            <div class="opt-sub">Lihat contoh laporan dan carta.</div>
          </div>
          <div>&rsaquo;</div>
        </div>
      </body>
    </html>
  `)
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'preview_mobile_option1.png'), fullPage: true })
  console.log('Saved preview_mobile_option1.png')

  await browser.close()
}

renderFullMobileOptions()
