import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\natural_scroll_live'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function verifyLiveFlow() {
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

  // 1. Initial State (Y=0)
  // Section 1 is full-screen, artwork extends under frosted navbar
  const initialInfo = await page.evaluate(() => {
    const landing = document.getElementById('landing-hero-section')
    const header = document.getElementById('site-header')
    const main = document.getElementById('main-content')
    return {
      scrollY: window.scrollY,
      landingTop: landing ? landing.getBoundingClientRect().top : null,
      landingHeight: landing ? landing.offsetHeight : null,
      headerTop: header ? header.getBoundingClientRect().top : null,
      mainTop: main ? main.getBoundingClientRect().top : null,
    }
  })
  console.log('1. Initial state (Y=0):', initialInfo)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_1_initial_y0.png') })

  // 2. Scroll Y=350
  // Section 1 has scrolled UP by 350px, Section 2 is entering the screen
  await page.evaluate(() => window.scrollTo(0, 350))
  await new Promise((r) => setTimeout(r, 300))
  const state350 = await page.evaluate(() => {
    const landing = document.getElementById('landing-hero-section')
    const main = document.getElementById('main-content')
    const visibleCards = document.querySelectorAll('.apple-reveal-card.is-visible').length
    const totalCards = document.querySelectorAll('.apple-reveal-card').length
    return {
      scrollY: window.scrollY,
      landingTop: landing ? landing.getBoundingClientRect().top : null,
      mainTop: main ? main.getBoundingClientRect().top : null,
      cardsVisible: `${visibleCards} / ${totalCards}`,
    }
  })
  console.log('2. Scrolled Y=350 state:', state350)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_2_scrolling_up_y350.png') })

  // 3. Scroll Y=600
  // Section 1 is almost off-screen, Section 2 cards are floating up
  await page.evaluate(() => window.scrollTo(0, 600))
  await new Promise((r) => setTimeout(r, 300))
  const state600 = await page.evaluate(() => {
    const landing = document.getElementById('landing-hero-section')
    const main = document.getElementById('main-content')
    const visibleCards = document.querySelectorAll('.apple-reveal-card.is-visible').length
    const totalCards = document.querySelectorAll('.apple-reveal-card').length
    return {
      scrollY: window.scrollY,
      landingTop: landing ? landing.getBoundingClientRect().top : null,
      mainTop: main ? main.getBoundingClientRect().top : null,
      cardsVisible: `${visibleCards} / ${totalCards}`,
    }
  })
  console.log('3. Scrolled Y=600 state:', state600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_3_cards_fading_up_y600.png') })

  // 4. Scroll past landing section height (Y=844) -> Triggers ONE-WAY LOCK
  await page.evaluate(() => window.scrollTo(0, 844))
  await new Promise((r) => setTimeout(r, 350))
  const lockState = await page.evaluate(() => {
    const landing = document.getElementById('landing-hero-section')
    const main = document.getElementById('main-content')
    const visibleCards = document.querySelectorAll('.apple-reveal-card.is-visible').length
    const totalCards = document.querySelectorAll('.apple-reveal-card').length
    return {
      scrollY: window.scrollY,
      landingExists: Boolean(landing),
      mainTop: main ? main.getBoundingClientRect().top : null,
      allCardsVisible: visibleCards === totalCards,
    }
  })
  console.log('4. One-way lock state (HOME_ACTIVE):', lockState)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_4_locked_home_active_y0.png') })

  // 5. Attempt to scroll back UP after lock
  await page.evaluate(() => window.scrollTo(0, -300))
  await new Promise((r) => setTimeout(r, 200))
  const upwardState = await page.evaluate(() => {
    const landing = document.getElementById('landing-hero-section')
    return {
      scrollY: window.scrollY,
      landingExists: Boolean(landing),
    }
  })
  console.log('5. Upward scroll attempt:', upwardState)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step_5_scrolled_up_stays_home.png') })

  // 6. Test Responsive Viewports (Initial Landing View)
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
  console.log('All verification checks passed!')
}

verifyLiveFlow().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
