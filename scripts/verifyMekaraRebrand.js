import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\mekara_rebrand'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: 'responsive_320px_narrow', width: 320, height: 667 },
  { name: 'responsive_360px_compact', width: 360, height: 780 },
  { name: 'responsive_390px_reference', width: 390, height: 844 },
  { name: 'responsive_430px_promax', width: 430, height: 932 },
  { name: 'responsive_768px_tablet', width: 768, height: 1024 },
  { name: 'responsive_1280px_desktop', width: 1280, height: 800 },
]

async function runMekaraVerification() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

    // 1. Visit landing page (Section 1)
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 600))

    // Seed sample report into IndexedDB so saved record count is available
    await page.evaluate(async () => {
      const storage = await import('./src/data/storage.ts')
      const sample = await import('./src/data/sample.ts')
      await storage.saveReportToStorage({
        version: 1,
        reportId: 'mekara-report-sample',
        updatedAt: new Date().toISOString(),
        records: sample.SAMPLE_SALES,
        operatingExpenses: 1500,
        selectedMonth: 'ALL',
        isSampleData: false,
        page: 'home',
        chatMessages: [],
        storyText: '',
        isStoryReview: false,
      })
    })

    await page.reload({ waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 600))

    // A. Landing screenshot (Mobile 390px)
    const landingMobilePath = path.join(OUTPUT_DIR, '01_mekara_landing_390px_mobile.png')
    await page.screenshot({ path: landingMobilePath })
    console.log(`Saved: ${landingMobilePath}`)

    // Responsive landing screenshots for all viewports
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await new Promise((r) => setTimeout(r, 300))
      const vpPath = path.join(OUTPUT_DIR, `landing_${vp.name}.png`)
      await page.screenshot({ path: vpPath })
      console.log(`Saved landing: ${vpPath}`)
    }

    // B. Desktop 1280px Landing
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 400))
    const desktopLandingPath = path.join(OUTPUT_DIR, '02_mekara_landing_1280px_desktop.png')
    await page.screenshot({ path: desktopLandingPath })
    console.log(`Saved: ${desktopLandingPath}`)

    // C. Floating Transition halfway (Scroll Y = 380)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
    await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'instant' }))
    await new Promise((r) => setTimeout(r, 500))
    const transPath = path.join(OUTPUT_DIR, '03_mekara_floating_transition_y380.png')
    await page.screenshot({ path: transPath })
    console.log(`Saved: ${transPath}`)

    // D. Section 2 Fully Revealed (Scroll Y = 844 - 50)
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight - 50, behavior: 'instant' }))
    await new Promise((r) => setTimeout(r, 600))
    const s2Path = path.join(OUTPUT_DIR, '04_mekara_section2_revealed_390px.png')
    await page.screenshot({ path: s2Path })
    console.log(`Saved: ${s2Path}`)

    // E. Navbar close-up
    const headerEl = await page.$('#site-header')
    if (headerEl) {
      const navPath = path.join(OUTPUT_DIR, '05_mekara_navbar_close_up.png')
      await headerEl.screenshot({ path: navPath })
      console.log(`Saved: ${navPath}`)
    }

    // F. Mobile hamburger menu open
    const hamburgerBtn = await page.$('button[aria-controls="mobile-nav-panel"]')
    if (hamburgerBtn) {
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 400))
      const menuPath = path.join(OUTPUT_DIR, '06_mekara_mobile_menu_open.png')
      await page.screenshot({ path: menuPath })
      console.log(`Saved: ${menuPath}`)
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 300))
    }

    // G. Navigate to Dashboard via "Sambung Laporan"
    const sambungBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find((b) => b.textContent?.includes('Sambung Laporan'))
    })
    if (sambungBtn) {
      await sambungBtn.asElement()?.click()
      await new Promise((r) => setTimeout(r, 800))
      const dashPath = path.join(OUTPUT_DIR, '07_mekara_dashboard.png')
      await page.screenshot({ path: dashPath })
      console.log(`Saved: ${dashPath}`)
    }

    // H. Navigate to AI Chat via "Tanya Pembantu AI"
    const chatBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find((b) => b.textContent?.includes('Tanya Pembantu AI'))
    })
    if (chatBtn) {
      await chatBtn.asElement()?.click()
      await new Promise((r) => setTimeout(r, 800))
      const chatPath = path.join(OUTPUT_DIR, '08_mekara_ai_chat.png')
      await page.screenshot({ path: chatPath })
      console.log(`Saved: ${chatPath}`)
    }

    // I. Test User Guide modal
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 400))
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight - 50, behavior: 'instant' }))
    await new Promise((r) => setTimeout(r, 400))

    const guideBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find((b) => b.textContent?.includes('Baca Panduan Bergambar'))
    })
    if (guideBtn) {
      await guideBtn.asElement()?.click()
      await new Promise((r) => setTimeout(r, 600))
      const guidePath = path.join(OUTPUT_DIR, '09_mekara_user_guide.png')
      await page.screenshot({ path: guidePath })
      console.log(`Saved: ${guidePath}`)
    }

    console.log('All Mekara rebrand verification screenshots generated successfully!')
  } catch (err) {
    console.error('Error during Mekara verification:', err)
  } finally {
    await browser.close()
  }
}

runMekaraVerification()
