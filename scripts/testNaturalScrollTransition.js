import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\natural_scroll_test'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function testConcept() {
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

        /* Sticky Translucent Apple-glass Navbar */
        header {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 56px;
          background: rgba(255, 255, 255, 0.80);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(240, 236, 240, 0.8);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        /* Section 1: Landing Illustration (Full 100svh, sits behind navbar) */
        #landing-section {
          position: relative;
          width: 100%;
          height: 100vh;
          margin-top: -56px;
          background: linear-gradient(180deg, #F8CBDF 0%, #FBE6F0 45%, #FCD1E2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        #landing-section img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 15% center;
        }

        .scroll-pill {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 999px;
          padding: 8px 18px;
          color: #9D175B;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        /* Section 2: Cards Container */
        #cards-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 16px 48px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 100vh; /* Ensures sufficient scroll height to clear Section 1 */
        }

        /* Fade-up card styles */
        .reveal-card {
          background: #FFFFFF;
          border: 1px solid #E5DEE4;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 2px 6px rgba(28, 21, 31, 0.03);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .reveal-card.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Locked state */
        .home-active #landing-section {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <div id="app-root">
        <header id="site-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:800;font-size:17px;">Wanita Niaga</span>
            <span style="background:#BE1E72;color:#fff;font-size:10px;font-weight:900;padding:2px 6px;border-radius:99px;">AI</span>
          </div>
          <button style="border:1px solid #E5DEE4;background:#fff;border-radius:12px;width:38px;height:38px;cursor:pointer;">☰</button>
        </header>

        <!-- Section 1 -->
        <section id="landing-section">
          <img src="http://localhost:5173/images/landing-hero.png">
          <div class="scroll-pill" id="scroll-pill">Skrol untuk mula ⌄</div>
        </section>

        <!-- Section 2 -->
        <main id="cards-container">
          <div class="reveal-card" data-card="1" style="border-color:#F3B6D8;background:#FFF9FC;">
            <h3 style="font-size:14px;font-weight:700;color:#1C151F;">👋 Selamat kembali, Puan!</h3>
            <p style="font-size:12px;color:#786C7C;margin-top:4px;">Puan mempunyai rekod jualan tersimpan (600 transaksi).</p>
          </div>

          <div class="reveal-card" data-card="2">
            <h2 style="font-size:16px;font-weight:800;">Pilih Cara Memasukkan Jualan</h2>
            <p style="font-size:12px;color:#786C7C;margin-top:2px;">3 Kaedah Mudah & Terus</p>
          </div>

          <div class="reveal-card" data-card="3" style="border-color:#BE1E72;background:#FDF2F7;">
            <h3 style="font-size:15px;font-weight:700;color:#9B155B;">1. Cerita Jualan kepada AI</h3>
            <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Taip atau sebut ayat biasa macam mesej WhatsApp.</p>
          </div>

          <div class="reveal-card" data-card="4">
            <h3 style="font-size:15px;font-weight:700;">2. Muat Naik Fail Excel</h3>
            <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Gunakan fail sedia ada dalam peranti Puan.</p>
          </div>

          <div class="reveal-card" data-card="5">
            <h3 style="font-size:15px;font-weight:700;">3. Isi Jualan Sendiri</h3>
            <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Masukkan jualan satu persatu secara tersusun.</p>
          </div>
        </main>
      </div>

      <script>
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.reveal-card').forEach((card, idx) => {
          card.style.transitionDelay = (idx * 80) + 'ms';
          observer.observe(card);
        });

        const landing = document.getElementById('landing-section');
        const root = document.getElementById('app-root');
        let isLocked = false;

        window.addEventListener('scroll', () => {
          if (isLocked) return;

          const scrollY = window.scrollY;
          const landingHeight = landing.offsetHeight;

          // When landing section has scrolled completely out of view
          if (scrollY >= landingHeight - 4) {
            isLocked = true;
            root.classList.add('home-active');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            // Ensure all cards are visible in active mode
            document.querySelectorAll('.reveal-card').forEach(c => c.classList.add('is-visible'));
          }
        }, { passive: true });
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await new Promise((r) => setTimeout(r, 400))

  // 1. Initial State (Y=0) - Landing with frosted navbar
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_initial_y0.png') })
  console.log('1. Captured 01_initial_y0.png')

  // 2. Scroll Y=350 - Section 1 is scrolling up, Section 2 is entering
  await page.evaluate(() => window.scrollTo(0, 350))
  await new Promise((r) => setTimeout(r, 400))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_scrolling_y350.png') })
  console.log('2. Captured 02_scrolling_y350.png')

  // 3. Scroll Y=600 - Section 1 almost off-screen, cards fading up
  await page.evaluate(() => window.scrollTo(0, 600))
  await new Promise((r) => setTimeout(r, 400))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_scrolling_y600.png') })
  console.log('3. Captured 03_scrolling_y600.png')

  // 4. Scroll to landing height (Y=844) -> Triggers ONE-WAY LOCK
  await page.evaluate(() => window.scrollTo(0, 844))
  await new Promise((r) => setTimeout(r, 300))
  const lockState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    isLocked: document.getElementById('app-root').classList.contains('home-active'),
    landingVisible: document.getElementById('landing-section').offsetParent !== null,
  }))
  console.log('4. Lock state:', lockState)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_locked_home_active_y0.png') })
  console.log('4. Captured 04_locked_home_active_y0.png')

  // 5. Try to scroll back UP after lock
  await page.evaluate(() => window.scrollTo(0, -200))
  await new Promise((r) => setTimeout(r, 200))
  const upwardState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    landingVisible: document.getElementById('landing-section').offsetParent !== null,
  }))
  console.log('5. Upward attempt:', upwardState)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_scroll_up_stays_home.png') })
  console.log('5. Captured 05_scroll_up_stays_home.png')

  await browser.close()
}

testConcept().catch(console.error)
