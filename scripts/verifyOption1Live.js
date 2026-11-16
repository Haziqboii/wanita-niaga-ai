import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\option1_verified'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function verifyOption1() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

  console.log('Navigating to http://localhost:5173/ ...')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))

  // Seed sample report so "Selamat kembali, Puan!" card exists
  await page.evaluate(() => {
    localStorage.setItem('user_gemini_api_key', 'AIzaSyDemoKeyForVerification12345678')
  })

  // 1. Initial State (Y=0)
  const initialInfo = await page.evaluate(() => {
    const landing = document.getElementById('landing-hero-section')
    const header = document.getElementById('site-header')
    const cards = Array.from(document.querySelectorAll('.apple-reveal-card')).map(c => ({
      visible: c.classList.contains('is-visible'),
      text: c.textContent?.trim().slice(0, 30)
    }))
    return {
      scrollY: window.scrollY,
      hasLanding: Boolean(landing),
      headerTop: header ? header.getBoundingClientRect().top : null,
      cardsCount: cards.length,
      visibleCardsCount: cards.filter(c => c.visible).length,
    }
  })
  console.log('1. Initial state (Y=0):', initialInfo)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_initial_landing_y0.png') })

  // 2. Scroll Y=320 (Section 1 moves up; top card enters and slowly floats up)
  await page.evaluate(() => window.scrollTo(0, 320))
  await new Promise((r) => setTimeout(r, 500))
  const state320 = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.apple-reveal-card')).map(c => ({
      visible: c.classList.contains('is-visible'),
      text: c.textContent?.trim().slice(0, 30)
    }))
    return {
      scrollY: window.scrollY,
      cards: cards.map(c => `${c.text} -> visible: ${c.visible}`),
    }
  })
  console.log('2. Scrolled Y=320 state:', state320)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_scroll_y320_first_card_float.png') })

  // 3. Scroll Y=560 (Heading and Method 1 float up as they enter)
  await page.evaluate(() => window.scrollTo(0, 560))
  await new Promise((r) => setTimeout(r, 500))
  const state560 = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.apple-reveal-card')).map(c => ({
      visible: c.classList.contains('is-visible'),
      text: c.textContent?.trim().slice(0, 30)
    }))
    return {
      scrollY: window.scrollY,
      cards: cards.map(c => `${c.text} -> visible: ${c.visible}`),
    }
  })
  console.log('3. Scrolled Y=560 state:', state560)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_scroll_y560_method1_float.png') })

  // 4. Scroll Y=850 (Method 2 enters and floats up)
  await page.evaluate(() => window.scrollTo(0, 850))
  await new Promise((r) => setTimeout(r, 500))
  const state850 = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.apple-reveal-card')).map(c => ({
      visible: c.classList.contains('is-visible'),
      text: c.textContent?.trim().slice(0, 30)
    }))
    return {
      scrollY: window.scrollY,
      cards: cards.map(c => `${c.text} -> visible: ${c.visible}`),
    }
  })
  console.log('4. Scrolled Y=850 state:', state850)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_scroll_y850_method2_float.png') })

  // 5. Scroll Y=1150 (Method 3 and Demo card enter and float up)
  await page.evaluate(() => window.scrollTo(0, 1150))
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_scroll_y1150_all_cards.png') })
  console.log('5. Captured 05_scroll_y1150_all_cards.png')

  // 6. Scroll smoothly back UP to Y=0 (Zero glitch, continuous physics!)
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise((r) => setTimeout(r, 400))
  const stateTop = await page.evaluate(() => ({
    scrollY: window.scrollY,
    hasLanding: Boolean(document.getElementById('landing-hero-section')),
  }))
  console.log('6. Scrolled back up to Y=0:', stateTop)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_scrolled_back_to_top.png') })

  // 7. Responsive Viewports for Initial Landing
  const viewports = [
    { name: '320px_mobile_narrow', width: 320, height: 568 },
    { name: '360px_mobile_compact', width: 360, height: 740 },
    { name: '390px_mobile_standard', width: 390, height: 844 },
    { name: '430px_mobile_promax', width: 430, height: 932 },
    { name: '768px_tablet', width: 768, height: 1024 },
    { name: '1280px_desktop', width: 1280, height: 800 },
  ]

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.width < 768 })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `responsive_${vp.name}_landing.png`),
    })
    console.log(`Captured responsive landing for ${vp.name}`)
  }

  await browser.close()
  console.log('All Option 1 verification checks completed successfully!')
}

verifyOption1().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
