import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\floating_v2'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function verifyLive() {
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

  // 1. Initial Landing (Y=0)
  const initialLanding = await page.evaluate(() => {
    const landing = document.getElementById('landing-fixed-layer')
    const spacer = document.getElementById('landing-scroll-spacer')
    const sheet = document.getElementById('home-floating-sheet')
    const header = document.getElementById('site-header')
    return {
      hasLanding: Boolean(landing),
      hasSpacer: Boolean(spacer),
      hasSheet: Boolean(sheet),
      headerInViewport: header ? header.getBoundingClientRect().top : null,
      scrollY: window.scrollY,
    }
  })
  console.log('1. Initial Landing state (Y=0):', initialLanding)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'v2_step_1_landing_y0.png') })

  // 2. Scroll 25% (Y=210)
  await page.evaluate(() => window.scrollTo(0, 210))
  await new Promise((r) => setTimeout(r, 200))
  const state210 = await page.evaluate(() => {
    const sheet = document.getElementById('home-floating-sheet')
    const landing = document.getElementById('landing-fixed-layer')
    return {
      scrollY: window.scrollY,
      sheetTop: sheet ? sheet.getBoundingClientRect().top : null,
      landingTransform: landing ? landing.style.transform : null,
      landingOpacity: landing ? landing.style.opacity : null,
    }
  })
  console.log('2. Scrolled Y=210 state:', state210)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'v2_step_2_sheet_emerging_y210.png') })

  // 3. Scroll 55% (Y=460)
  await page.evaluate(() => window.scrollTo(0, 460))
  await new Promise((r) => setTimeout(r, 200))
  const state460 = await page.evaluate(() => {
    const sheet = document.getElementById('home-floating-sheet')
    const landing = document.getElementById('landing-fixed-layer')
    return {
      scrollY: window.scrollY,
      sheetTop: sheet ? sheet.getBoundingClientRect().top : null,
      landingTransform: landing ? landing.style.transform : null,
      landingOpacity: landing ? landing.style.opacity : null,
    }
  })
  console.log('3. Scrolled Y=460 state:', state460)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'v2_step_3_sheet_covering_y460.png') })

  // 4. Scroll to threshold (Y=844) -> Trigger ONE-WAY LOCK into HOME_ACTIVE
  await page.evaluate(() => window.scrollTo(0, 844))
  await new Promise((r) => setTimeout(r, 350))
  const stateHomeActive = await page.evaluate(() => {
    const landing = document.getElementById('landing-fixed-layer')
    const spacer = document.getElementById('landing-scroll-spacer')
    const sheet = document.getElementById('home-floating-sheet')
    const header = document.getElementById('site-header')
    return {
      scrollY: window.scrollY,
      hasLanding: Boolean(landing),
      hasSpacer: Boolean(spacer),
      hasSheet: Boolean(sheet),
      headerTop: header ? header.getBoundingClientRect().top : null,
    }
  })
  console.log('4. HOME_ACTIVE state (one-way lock):', stateHomeActive)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'v2_step_4_home_active_y0.png') })

  // 5. Try to scroll back UP after transition completed
  await page.evaluate(() => window.scrollTo(0, -200))
  await new Promise((r) => setTimeout(r, 200))
  const stateAfterUpward = await page.evaluate(() => {
    const landing = document.getElementById('landing-fixed-layer')
    return {
      scrollY: window.scrollY,
      hasLanding: Boolean(landing),
    }
  })
  console.log('5. Upward scroll attempt after lock:', stateAfterUpward)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'v2_step_5_scrolled_up_stays_home.png') })

  // 6. Test Responsive Viewports for Initial Landing & Floating Sheet
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
      path: path.join(OUTPUT_DIR, `v2_responsive_${vp.name}_landing.png`),
    })
    console.log(`Captured responsive landing for ${vp.name}`)
  }

  await browser.close()
  console.log('All verification steps completed successfully!')
}

verifyLive().catch((err) => {
  console.error('Error during verification:', err)
  process.exit(1)
})
