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

async function verifyLanding() {
  console.log('🚀 Starting Full-Screen Scrolling Landing Verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Mobile Standard (390x844) Initial Landing Viewport
    await page.setViewport({ width: 390, height: 844, isMobile: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 600))

    console.log('\n--- CHECK 1: Initial Landing Viewport (Mobile 390px) ---')
    const initialViewInfo = await page.evaluate(() => {
      const landingSection = document.querySelector('section[aria-label="Pengenalan Utama Wanita Niaga AI"]')
      const header = document.querySelector('header')
      const scrollBtn = landingSection?.querySelector('button')
      const img = landingSection?.querySelector('img')

      const headerRect = header?.getBoundingClientRect()
      const landingRect = landingSection?.getBoundingClientRect()
      const scrollBtnRect = scrollBtn?.getBoundingClientRect()

      return {
        landingHeight: landingRect?.height,
        windowHeight: window.innerHeight,
        headerTop: headerRect?.top,
        headerVisibleInInitialViewport: (headerRect?.top || 0) < window.innerHeight,
        scrollBtnText: scrollBtn?.textContent?.trim(),
        scrollBtnTop: scrollBtnRect?.top,
        scrollBtnBottom: window.innerHeight - (scrollBtnRect?.bottom || 0),
        imgNaturalWidth: img?.naturalWidth,
        imgNaturalHeight: img?.naturalHeight,
        imgRenderedWidth: img?.getBoundingClientRect()?.width,
        imgRenderedHeight: img?.getBoundingClientRect()?.height,
      }
    })
    console.log('Initial View Info:', initialViewInfo)

    // Capture 1: Mobile landing — first viewport
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_mobile_landing_first_viewport_390px.png'),
    })

    // 2. Click "Skrol untuk mula" and test smooth scroll
    console.log('\n--- CHECK 2: Interactive "Skrol untuk mula" Button ---')
    const scrollBtn = await page.$('section[aria-label="Pengenalan Utama Wanita Niaga AI"] button')
    if (scrollBtn) {
      await scrollBtn.click()
      await new Promise((r) => setTimeout(r, 800)) // wait for smooth scroll to finish
    }

    const afterScrollInfo = await page.evaluate(() => {
      const header = document.querySelector('header')
      const headerRect = header?.getBoundingClientRect()
      return {
        scrollY: window.scrollY,
        headerTop: headerRect?.top,
        headerIsStickyAtTop: Math.abs(headerRect?.top || 999) < 2,
      }
    })
    console.log('After Scroll Info:', afterScrollInfo)

    // Capture 3: Mobile functional homepage after reveal
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_mobile_functional_homepage_revealed_390px.png'),
    })

    // 3. Scroll halfway to test partly scrolled transition
    console.log('\n--- CHECK 3: Partly Scrolled Transition ---')
    await page.evaluate(() => {
      window.scrollTo({ top: 380, behavior: 'instant' })
    })
    await new Promise((r) => setTimeout(r, 300))

    // Capture 2: Mobile transition — partly scrolled
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_mobile_transition_partly_scrolled_390px.png'),
    })

    // 4. Desktop (1280x800) Initial Landing Viewport
    console.log('\n--- CHECK 4: Desktop Landing Viewport (1280px) ---')
    await page.setViewport({ width: 1280, height: 800, isMobile: false })
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await new Promise((r) => setTimeout(r, 500))

    // Capture 4: Desktop landing
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_desktop_landing_1280px.png'),
    })

    // Scroll down to functional section on desktop
    const desktopScrollBtn = await page.$('section[aria-label="Pengenalan Utama Wanita Niaga AI"] button')
    if (desktopScrollBtn) {
      await desktopScrollBtn.click()
      await new Promise((r) => setTimeout(r, 800))
    }

    // Capture 5: Desktop homepage after scrolling
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_desktop_homepage_scrolled_1280px.png'),
    })

    // 5. Multi-viewport Responsive Checks (320px, 360px, 390px, 430px, 768px, 1280px)
    console.log('\n--- CHECK 5: Multi-Viewport Responsive Verification ---')
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await new Promise((r) => setTimeout(r, 300))

      // Check text clipping
      const checkText = await page.evaluate(() => {
        const landing = document.querySelector('section[aria-label="Pengenalan Utama Wanita Niaga AI"]')
        const img = landing?.querySelector('img')
        const rect = img?.getBoundingClientRect()
        return {
          imgLeft: rect?.left,
          imgRight: rect?.right,
          imgWidth: rect?.width,
          windowWidth: window.innerWidth,
          isWithinBounds: (rect?.left || 0) >= 0 && (rect?.right || 0) <= window.innerWidth,
        }
      })
      console.log(`[${vp.name}] Image bounds:`, checkText)

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `responsive_landing_${vp.name}.png`),
      })
    }

    console.log('\n✅ All full-screen landing tests completed successfully!')
  } catch (err) {
    console.error('Error during verification:', err)
  } finally {
    await browser.close()
  }
}

verifyLanding()
