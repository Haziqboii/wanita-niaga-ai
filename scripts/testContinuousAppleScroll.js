import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\continuous_apple_scroll'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function testContinuousScroll() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

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
          -webkit-overflow-scrolling: touch;
        }

        /* Sticky Translucent Apple-glass Navbar */
        header {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 56px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(240, 236, 240, 0.85);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        /* Section 1: Landing Illustration (Continuous document flow) */
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
          background: rgba(255, 255, 255, 0.50);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.65);
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
        }

        /* Individual Slow Float & Fade-Up Cards */
        .apple-reveal-card {
          background: #FFFFFF;
          border: 1px solid #E5DEE4;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(28, 21, 31, 0.04);
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .apple-reveal-card.is-visible {
          opacity: 1;
          transform: translateY(0);
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
          <!-- Card 1: Returning User -->
          <div class="apple-reveal-card" data-card="returning-user" style="border-color:#F3B6D8;background:#FFF9FC;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:20px;">👋</span>
              <div>
                <h3 style="font-size:14px;font-weight:700;color:#1C151F;">Selamat kembali, Puan!</h3>
                <p style="font-size:12px;color:#786C7C;margin-top:2px;">Puan mempunyai rekod jualan tersimpan (600 transaksi).</p>
              </div>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;">
              <button style="background:#BE1E72;color:#fff;border:none;padding:8px 14px;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;">Sambung Laporan →</button>
              <button style="background:#fff;border:1px solid #E5DEE4;color:#786C7C;padding:8px 12px;border-radius:10px;font-size:12px;cursor:pointer;">Mula Baharu</button>
            </div>
          </div>

          <!-- Card 2: Section Header -->
          <div class="apple-reveal-card" data-card="heading">
            <h2 style="font-size:16px;font-weight:800;">Pilih Cara Memasukkan Jualan</h2>
            <p style="font-size:12px;color:#786C7C;margin-top:2px;">3 Kaedah Mudah & Terus</p>
          </div>

          <!-- Card 3: Method 1 -->
          <div class="apple-reveal-card" data-card="method-1" style="border-color:#BE1E72;background:#FDF2F7;">
            <h3 style="font-size:15px;font-weight:700;color:#9B155B;">1. Cerita Jualan kepada AI</h3>
            <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Taip atau sebut ayat biasa macam mesej di WhatsApp.</p>
            <div style="margin-top:10px;background:#F8F6F8;padding:8px 10px;border-radius:8px;font-size:11px;color:#555;font-style:italic;">
              "Pagi tadi laku 50 biji karipap RM2.00..."
            </div>
            <button style="margin-top:12px;width:100%;background:#BE1E72;color:#fff;border:none;padding:10px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;">Mula Cerita Jualan →</button>
          </div>

          <!-- Card 4: Method 2 -->
          <div class="apple-reveal-card" data-card="method-2">
            <h3 style="font-size:15px;font-weight:700;color:#0D7355;">2. Muat Naik Fail Excel</h3>
            <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Gunakan fail sedia ada dalam peranti Puan.</p>
            <button style="margin-top:12px;width:100%;background:#fff;border:1px solid #A7F3D0;color:#0D7355;padding:10px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;">Pilih Fail Excel ↑</button>
          </div>

          <!-- Card 5: Method 3 -->
          <div class="apple-reveal-card" data-card="method-3">
            <h3 style="font-size:15px;font-weight:700;color:#7C3AED;">3. Isi Jualan Sendiri</h3>
            <p style="font-size:13px;color:#4A3E4E;margin-top:4px;">Masukkan jualan satu persatu secara tersusun.</p>
            <button style="margin-top:12px;width:100%;background:#fff;border:1px solid #DDD6FE;color:#7C3AED;padding:10px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;">Buka Borang Jualan +</button>
          </div>

          <!-- Card 6: Demo Simulation -->
          <div class="apple-reveal-card" data-card="demo">
            <h3 style="font-size:14px;font-weight:700;">Belum mempunyai rekod jualan?</h3>
            <p style="font-size:12px;color:#4A3E4E;margin-top:4px;">Cuba demonstrasi percuma menggunakan contoh gerai makanan.</p>
          </div>
        </main>
      </div>

      <script>
        // Each card is observed individually and only reveals when its own place enters viewport
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.12,
          rootMargin: '0px 0px -30px 0px'
        });

        document.querySelectorAll('.apple-reveal-card').forEach((card) => {
          observer.observe(card);
        });

        document.getElementById('scroll-pill').addEventListener('click', () => {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        });
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await new Promise((r) => setTimeout(r, 400))

  // 1. Initial State (Y=0)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_initial_y0.png') })
  console.log('1. Captured 01_initial_y0.png')

  // 2. Scroll Y=300 (Section 1 moving up, Card 1 "Selamat kembali" entering and floating up)
  await page.evaluate(() => window.scrollTo(0, 300))
  await new Promise((r) => setTimeout(r, 500))
  const card1Visible = await page.evaluate(() => {
    const c = document.querySelector('[data-card="returning-user"]')
    return c ? c.classList.contains('is-visible') : false
  })
  console.log('2. Scrolled Y=300, Card 1 visible:', card1Visible)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_scroll_y300_card1_float.png') })

  // 3. Scroll Y=550 (Card 2 and Card 3 floating up as they enter)
  await page.evaluate(() => window.scrollTo(0, 550))
  await new Promise((r) => setTimeout(r, 500))
  const cardsAt550 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.apple-reveal-card')).map(c => ({
      name: c.getAttribute('data-card'),
      visible: c.classList.contains('is-visible')
    }))
  })
  console.log('3. Scrolled Y=550 cards state:', cardsAt550)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_scroll_y550_card2_card3_float.png') })

  // 4. Scroll Y=850 (Further down, Method 2 and Method 3 floating up)
  await page.evaluate(() => window.scrollTo(0, 850))
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_scroll_y850_further_cards.png') })
  console.log('4. Captured 04_scroll_y850_further_cards.png')

  // 5. Scroll smoothly back UP to Y=0 (Zero glitch, continuous physics!)
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise((r) => setTimeout(r, 400))
  const stateAtTop = await page.evaluate(() => ({
    scrollY: window.scrollY,
    landingVisible: document.getElementById('landing-section').offsetHeight === window.innerHeight
  }))
  console.log('5. Scrolled back up to Y=0 state:', stateAtTop)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_scrolled_back_to_top_smooth.png') })

  await browser.close()
}

testContinuousScroll().catch(console.error)
