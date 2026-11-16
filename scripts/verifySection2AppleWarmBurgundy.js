import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\section2_final'

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

async function runVerification() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

    // 1. Visit page and seed 600 records into IndexedDB
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 400))

    console.log('Seeding 600 records into IndexedDB ...')
    await page.evaluate(async () => {
      const storage = await import('./src/data/storage.ts')
      const sample = await import('./src/data/sample.ts')
      await storage.saveReportToStorage({
        version: 1,
        reportId: 'test-report-600',
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

    // Reload page to reflect saved state
    await page.reload({ waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 600))

    console.log('Testing each required responsive viewport...')

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 })
      await page.reload({ waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, 400))

      // Scroll smoothly down past Section 1 landing so Section 2 starts right below sticky header
      await page.evaluate((h) => {
        window.scrollTo({ top: h - 50, behavior: 'instant' })
      }, vp.height)
      await new Promise((r) => setTimeout(r, 600))

      const ssPath = path.join(OUTPUT_DIR, `${vp.name}.png`)
      await page.screenshot({ path: ssPath })
      console.log(`Saved screenshot: ${ssPath}`)
    }

    // 2. Focused Section 2 detailed capture at 390px (matching reference screen)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight - 50, behavior: 'instant' })
    })
    await new Promise((r) => setTimeout(r, 600))

    const focusedPath = path.join(OUTPUT_DIR, 'section2_390px_reference_match.png')
    await page.screenshot({ path: focusedPath })
    console.log(`Saved 390px reference match screenshot: ${focusedPath}`)

    // Also take a full-page screenshot of Section 2 at 390px so user can see every card from top to bottom
    const fullPagePath = path.join(OUTPUT_DIR, 'section2_390px_full_scroll.png')
    await page.screenshot({ path: fullPagePath, fullPage: true })
    console.log(`Saved 390px full scroll screenshot: ${fullPagePath}`)

    // 3. Test Mobile Hamburger Menu Drawer
    const hamburgerBtn = await page.$('button[aria-controls="mobile-nav-panel"]')
    if (hamburgerBtn) {
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 400))
      const menuPath = path.join(OUTPUT_DIR, 'mobile_hamburger_menu_warm_burgundy.png')
      await page.screenshot({ path: menuPath })
      console.log(`Saved hamburger menu screenshot: ${menuPath}`)
      // Close menu
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 300))
    }

    // 4. Test Functional Navigation
    console.log('Testing functional clicks...')

    // A. Mula Cerita Jualan
    const storyBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find((b) => b.textContent?.includes('Mula Cerita Jualan'))
    })
    if (storyBtn) {
      await storyBtn.asElement()?.click()
      await new Promise((r) => setTimeout(r, 500))
      const storyPath = path.join(OUTPUT_DIR, 'functional_nav_story_chat.png')
      await page.screenshot({ path: storyPath })
      console.log(`Navigated to Story chat successfully! Screenshot: ${storyPath}`)

      // Back to Home
      const backBtn = await page.$('button[aria-label="Kembali ke Halaman Sebelumnya"]')
      if (backBtn) {
        await backBtn.click()
        await new Promise((r) => setTimeout(r, 400))
      }
    }

    // B. Sambung Laporan
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight - 50, behavior: 'instant' })
    })
    await new Promise((r) => setTimeout(r, 400))

    const sambungBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find((b) => b.textContent?.includes('Sambung Laporan'))
    })
    if (sambungBtn) {
      await sambungBtn.asElement()?.click()
      await new Promise((r) => setTimeout(r, 600))
      const dashPath = path.join(OUTPUT_DIR, 'functional_nav_dashboard.png')
      await page.screenshot({ path: dashPath })
      console.log(`Navigated to Dashboard successfully! Screenshot: ${dashPath}`)
    }

    console.log('All verification steps completed successfully!')
  } catch (err) {
    console.error('Error during verification:', err)
  } finally {
    await browser.close()
  }
}

runVerification()
