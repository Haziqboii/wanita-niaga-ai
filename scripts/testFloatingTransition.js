import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\floating_transition'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function testPrototype() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html {
          width: 100%;
          min-height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #FAFAFA;
          color: #1C151F;
        }

        /* STAGE A / B: Floating Transition Container */
        .landing-fixed-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(180deg, #F8CBDF 0%, #FBE6F0 45%, #FCD1E2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform, opacity;
          transform-origin: center 40%;
          transition: transform 0.05s linear, opacity 0.05s linear;
        }

        .landing-fixed-layer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 15% center;
        }

        .scroll-spacer {
          height: 100vh;
          width: 100%;
          pointer-events: none;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: #9D175B;
          font-size: 13px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(8px);
          padding: 6px 16px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 2px 8px rgba(190, 30, 114, 0.08);
          cursor: pointer;
        }

        .floating-sheet {
          position: relative;
          z-index: 10;
          width: 100%;
          min-height: 100vh;
          background: #FAFAFA;
          border-top-left-radius: 32px;
          border-top-right-radius: 32px;
          box-shadow: 0 -16px 48px rgba(28, 21, 31, 0.16);
          border-top: 1px solid rgba(255, 255, 255, 0.8);
          overflow: hidden;
        }

        .sheet-header {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #F0ECF0;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 800;
          font-size: 17px;
        }

        .sheet-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card {
          background: #FFFFFF;
          border: 1px solid #E5DEE4;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 2px 6px rgba(28, 21, 31, 0.03);
        }

        /* When HOME_ACTIVE */
        .home-active .landing-fixed-layer,
        .home-active .scroll-spacer {
          display: none !important;
        }

        .home-active .floating-sheet {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          box-shadow: none;
          border-top: none;
        }
      </style>
    </head>
    <body>
      <div id="transition-root">
        <!-- Landing Layer -->
        <div class="landing-fixed-layer" id="landing-layer">
          <img src="http://localhost:5173/images/landing-hero.png">
          <div class="scroll-indicator" id="scroll-indicator">
            <span>Skrol untuk mula</span>
            <span>⌄</span>
          </div>
        </div>

        <!-- 100vh Spacer -->
        <div class="scroll-spacer" id="scroll-spacer"></div>

        <!-- Floating Sheet -->
        <div class="floating-sheet" id="floating-sheet">
          <header class="sheet-header">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>Wanita Niaga</span>
              <span style="background:#BE1E72;color:#fff;font-size:10px;padding:2px 6px;border-radius:99px;">AI</span>
            </div>
            <button style="border:1px solid #E5DEE4;background:#fff;border-radius:12px;width:40px;height:40px;cursor:pointer;">☰</button>
          </header>
          <main class="sheet-content">
            <div class="card" style="border-color:#BE1E72;background:#FDF2F7;">
              <h3 style="font-size:15px;font-weight:700;color:#9B155B;">1. Cerita Jualan kepada AI</h3>
              <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Taip atau sebut ayat biasa macam mesej WhatsApp.</p>
            </div>
            <div class="card">
              <h3 style="font-size:15px;font-weight:700;">2. Muat Naik Fail Excel</h3>
              <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Gunakan fail sedia ada dalam peranti Puan.</p>
            </div>
            <div class="card">
              <h3 style="font-size:15px;font-weight:700;">3. Isi Jualan Sendiri</h3>
              <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Masukkan jualan satu persatu secara tersusun.</p>
            </div>
          </main>
        </div>
      </div>

      <script>
        const threshold = window.innerHeight;
        const landingLayer = document.getElementById('landing-layer');
        const scrollIndicator = document.getElementById('scroll-indicator');
        const floatingSheet = document.getElementById('floating-sheet');
        const root = document.getElementById('transition-root');
        let isHomeActive = false;

        window.addEventListener('scroll', () => {
          if (isHomeActive) return;

          const scrollY = window.scrollY;
          if (scrollY >= threshold - 4) {
            isHomeActive = true;
            root.classList.add('home-active');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            return;
          }

          const p = Math.min(1, Math.max(0, scrollY / threshold));
          const scale = 1 - p * 0.05;
          const opacity = 1 - p * 0.35;
          landingLayer.style.transform = 'scale(' + scale + ')';
          landingLayer.style.opacity = opacity;

          scrollIndicator.style.opacity = Math.max(0, 1 - p * 2.5);

          const radius = Math.max(0, 32 * (1 - Math.max(0, (p - 0.7) / 0.3)));
          floatingSheet.style.borderTopLeftRadius = radius + 'px';
          floatingSheet.style.borderTopRightRadius = radius + 'px';
        }, { passive: true });
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await new Promise((r) => setTimeout(r, 400))

  // 1. Initial Landing (Y=0)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_1_landing_y0.png') })
  console.log('Captured step_1_landing_y0.png')

  // 2. Scroll 25% (Y=210)
  await page.evaluate(() => window.scrollTo(0, 210))
  await new Promise((r) => setTimeout(r, 200))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_2_sheet_emerging_y210.png') })
  console.log('Captured step_2_sheet_emerging_y210.png')

  // 3. Scroll 60% (Y=500)
  await page.evaluate(() => window.scrollTo(0, 500))
  await new Promise((r) => setTimeout(r, 200))
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_3_sheet_covering_y500.png') })
  console.log('Captured step_3_sheet_covering_y500.png')

  // 4. Scroll to threshold (Y=844) -> triggers HOME_ACTIVE
  await page.evaluate(() => window.scrollTo(0, 844))
  await new Promise((r) => setTimeout(r, 300))
  const stateAfterComplete = await page.evaluate(() => ({
    scrollY: window.scrollY,
    isHomeActive: document.getElementById('transition-root').classList.contains('home-active'),
    landingVisible: window.getComputedStyle(document.getElementById('landing-layer')).display !== 'none'
  }))
  console.log('State after completion:', stateAfterComplete)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_4_home_active_y0.png') })
  console.log('Captured step_4_home_active_y0.png')

  // 5. Try to scroll up repeatedly after completion
  await page.evaluate(() => window.scrollTo(0, -100))
  await new Promise((r) => setTimeout(r, 200))
  const scrollYAfterUpward = await page.evaluate(() => window.scrollY)
  console.log('ScrollY after upward attempt:', scrollYAfterUpward)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_5_scrolled_up_stays_home.png') })
  console.log('Captured step_5_scrolled_up_stays_home.png')

  await browser.close()
}

testPrototype()
