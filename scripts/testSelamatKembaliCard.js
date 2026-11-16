import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\selamat_kembali_float_anim'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function testCardAnimation() {
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
  await new Promise((r) => setTimeout(r, 400))

  // Seed sample data into IndexedDB so there are 600 records saved
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
    })
  })

  // Reload page to simulate user opening website with existing saved report
  console.log('Reloading page ...')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))

  // Check state on initial load (Y=0)
  const stateAt0 = await page.evaluate(() => {
    const card = document.querySelector('section[aria-label="Sambung Laporan Tersimpan"]')
    return {
      scrollY: window.scrollY,
      hasCardInDom: Boolean(card),
      cardText: card ? card.textContent?.trim().slice(0, 50) : null,
      cardTop: card ? card.getBoundingClientRect().top : null,
      isVisible: card ? card.classList.contains('is-visible') : false,
    }
  })
  console.log('1. Initial state at Y=0 (Before scroll):', stateAt0)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_initial_landing_card_untriggered.png') })

  // Scroll down to Y=220 (Section 1 moving up, "Selamat kembali, Puan!" crossing into bottom of screen)
  console.log('2. Scrolling to Y=220 (Entering screen, triggering float & fade)...')
  await page.evaluate(() => window.scrollTo(0, 220))
  await new Promise((r) => setTimeout(r, 200)) // Mid-animation!

  const stateAt220MidAnim = await page.evaluate(() => {
    const card = document.querySelector('section[aria-label="Sambung Laporan Tersimpan"]')
    return {
      scrollY: window.scrollY,
      cardTop: card ? card.getBoundingClientRect().top : null,
      isVisible: card ? card.classList.contains('is-visible') : false,
      transform: card ? window.getComputedStyle(card).transform : null,
      opacity: card ? window.getComputedStyle(card).opacity : null,
    }
  })
  console.log('2. State at Y=220 (Triggered & animating):', stateAt220MidAnim)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_card_floating_up_y220.png') })

  // Wait for 0.65s animation to complete settling
  await new Promise((r) => setTimeout(r, 600))
  const stateAt220Settled = await page.evaluate(() => {
    const card = document.querySelector('section[aria-label="Sambung Laporan Tersimpan"]')
    return {
      isVisible: card ? card.classList.contains('is-visible') : false,
      opacity: card ? window.getComputedStyle(card).opacity : null,
      transform: card ? window.getComputedStyle(card).transform : null,
    }
  })
  console.log('3. State at Y=220 (Settled):', stateAt220Settled)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_card_settled_y220.png') })

  // Scroll down further to Y=550 to see Method 1 float in
  console.log('4. Scrolling to Y=550...')
  await page.evaluate(() => window.scrollTo(0, 550))
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_scrolled_to_methods_y550.png') })

  await browser.close()
  console.log('Test completed successfully!')
}

testCardAnimation().catch((err) => {
  console.error('Error during test:', err)
  process.exit(1)
})
