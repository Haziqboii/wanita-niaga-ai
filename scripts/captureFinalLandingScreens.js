import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\fullscreen_landing'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: '320px_mobile_narrow', width: 320, height: 600, isMobile: true },
  { name: '360px_mobile_compact', width: 360, height: 740, isMobile: true },
  { name: '390px_mobile_standard', width: 390, height: 844, isMobile: true },
  { name: '430px_mobile_promax', width: 430, height: 932, isMobile: true },
  { name: '768px_tablet', width: 768, height: 1024, isMobile: false },
  { name: '1280px_desktop', width: 1280, height: 800, isMobile: false },
]

async function capture() {
  console.log('🚀 Starting Final Landing Screens Capture on Live App...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // --- STEP 1: Mobile Standard 390x844 Landing Viewport ---
    await page.setViewport({ width: 390, height: 844, isMobile: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 600))

    // 1. Mobile landing — first viewport
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_mobile_landing_first_viewport_390px.png'),
    })
    console.log('Captured: 01_mobile_landing_first_viewport_390px.png')

    // 2. Mobile transition — partly scrolled (scroll 380px)
    await page.evaluate(() => {
      window.scrollTo({ top: 380, behavior: 'instant' })
    })
    await new Promise((r) => setTimeout(r, 300))
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_mobile_transition_partly_scrolled_390px.png'),
    })
    console.log('Captured: 02_mobile_transition_partly_scrolled_390px.png')

    // 3. Mobile functional homepage after reveal (click "Skrol untuk mula" or scroll past landing)
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await new Promise((r) => setTimeout(r, 300))

    const scrollBtn = await page.$('section[aria-label="Pengenalan Utama Wanita Niaga AI"] button')
    if (scrollBtn) {
      await scrollBtn.click()
      await new Promise((r) => setTimeout(r, 800))
    }
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_mobile_functional_homepage_revealed_390px.png'),
    })
    console.log('Captured: 03_mobile_functional_homepage_revealed_390px.png')

    // --- STEP 2: Desktop 1280x800 Landing Viewport ---
    await page.setViewport({ width: 1280, height: 800, isMobile: false })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await new Promise((r) => setTimeout(r, 500))

    // 4. Desktop landing
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_desktop_landing_1280px.png'),
    })
    console.log('Captured: 04_desktop_landing_1280px.png')

    // 5. Desktop homepage after scrolling
    const desktopScrollBtn = await page.$('section[aria-label="Pengenalan Utama Wanita Niaga AI"] button')
    if (desktopScrollBtn) {
      await desktopScrollBtn.click()
      await new Promise((r) => setTimeout(r, 800))
    }
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_desktop_homepage_scrolled_1280px.png'),
    })
    console.log('Captured: 05_desktop_homepage_scrolled_1280px.png')

    // --- STEP 3: Multi-viewport Responsive Checks ---
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await new Promise((r) => setTimeout(r, 300))

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `responsive_landing_${vp.name}.png`),
      })
      console.log(`Captured responsive: responsive_landing_${vp.name}.png`)
    }

    console.log('✅ All screenshots captured successfully!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

capture()
