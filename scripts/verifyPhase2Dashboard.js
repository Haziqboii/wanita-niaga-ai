import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\phase2_dashboard'
const FIXTURE_PATH = 'C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const VIEWPORTS = [
  { name: '01_dashboard_320px_narrow', width: 320, height: 667, isMobile: true, hasTouch: true },
  { name: '02_dashboard_360px_android', width: 360, height: 780, isMobile: true, hasTouch: true },
  { name: '03_dashboard_390px_standard', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: '04_dashboard_430px_large', width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: '05_dashboard_768px_tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: '06_dashboard_1280px_desktop', width: 1280, height: 850, isMobile: false, hasTouch: false },
]

async function run() {
  console.log('🚀 Starting Phase 2 Dashboard & Charts Verification & Capture...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.on('dialog', async (d) => {
      console.log('   [Dialog intercepted]:', d.message())
      await d.accept()
    })

    // 1. Upload 600 records fixture to enter Dashboard
    console.log('\n--- 1. LOADING 600-RECORD FIXTURE INTO DASHBOARD ---')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(300)

    // Clear previous storage
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)

    // Scroll to Section 2
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'instant' })
    })
    await sleep(400)

    // Click "Pilih Fail Excel" card
    const excelCardBtn = await page.$('button ::-p-text(Pilih Fail)')
    if (!excelCardBtn) throw new Error('Could not find "Pilih Fail" button on Section 2')
    await excelCardBtn.click()
    await sleep(500)

    // Now on Upload page, upload file
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) throw new Error('Could not find file input on Upload page')
    await fileInput.uploadFile(FIXTURE_PATH)
    await sleep(600)

    // Click "Jana Laporan Jualan" / "Sahkan" button
    const confirmBtn = await page.$('button ::-p-text(Jana Laporan Jualan)')
    if (!confirmBtn) {
      const buttons = await page.$$('button')
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn)
        if (text.includes('Laporan') || text.includes('Sahkan')) {
          await btn.click()
          break
        }
      }
    } else {
      await confirmBtn.click()
    }
    await sleep(800)

    // Verify Dashboard is loaded
    const pageContent = await page.evaluate(() => document.body.innerText)
    if (!pageContent.includes('Jumlah Jualan') && !pageContent.includes('Laporan Jualan')) {
      throw new Error('Failed to reach Dashboard. Content: ' + pageContent.substring(0, 200))
    }
    console.log('   ✅ Successfully loaded 600-record fixture on Dashboard!')

    // Check financial totals
    const financialInfo = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('*')).map(el => el.innerText || '')
      const hasRevenue = texts.some(t => t.includes('41,307.10') || t.includes('41,307'))
      const hasGrossProfit = texts.some(t => t.includes('22,859.00') || t.includes('22,859'))
      const hasUnits = texts.some(t => t.includes('8,141'))
      return { hasRevenue, hasGrossProfit, hasUnits }
    })
    console.log('   Financial metrics verification:', financialInfo)

    // 2. Capture responsive viewports
    console.log('\n--- 2. RESPONSIVE DASHBOARD CAPTURES (ALL VIEWPORTS) ---')
    for (const vp of VIEWPORTS) {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
      })
      await sleep(300)

      const screenshotPath = path.join(OUTPUT_DIR, `${vp.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`   Captured ${vp.name}.png`)
    }

    // 3. Test Monthly Filter Selection (e.g. Okt 2026)
    console.log('\n--- 3. MONTHLY FILTER INTERACTION ---')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(300)

    // Find and click the "Okt 2026" filter button
    const monthClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const oktBtn = buttons.find(b => b.innerText.trim().startsWith('Okt 2026') || b.innerText.trim() === 'Okt 2026')
      if (oktBtn) {
        oktBtn.click()
        return true
      }
      return false
    })
    console.log('   Clicked Okt 2026 pill:', monthClicked)
    await sleep(500)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '07_dashboard_monthly_filter_okt2026.png'),
      fullPage: true,
    })
    console.log('   Captured 07_dashboard_monthly_filter_okt2026.png')

    // Reset to "Semua"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const allBtn = buttons.find(b => b.innerText.trim().startsWith('Semua') || b.innerText.trim() === 'Semua')
      if (allBtn) allBtn.click()
    })
    await sleep(400)

    // 4. Test Expand All Products ("Lihat Semua Produk")
    console.log('\n--- 4. EXPAND ALL PRODUCTS INTERACTION ---')
    const expandClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const expandBtn = buttons.find(b => b.innerText.includes('Lihat Semua') || b.innerText.includes('Tunjuk Semua'))
      if (expandBtn) {
        expandBtn.click()
        return true
      }
      return false
    })
    console.log('   Clicked expand products button:', expandClicked)
    await sleep(500)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '08_dashboard_expanded_products.png'),
      fullPage: true,
    })
    console.log('   Captured 08_dashboard_expanded_products.png')

    // 5. Test Operating Expenses ("Perbelanjaan Operasi") Accordion
    console.log('\n--- 5. OPERATING EXPENSES ACCORDION ---')
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const opexBtn = buttons.find(b => b.innerText.includes('Perbelanjaan Operasi'))
      if (opexBtn) opexBtn.click()
    })
    await sleep(400)

    // Capture open form
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '09a_dashboard_opex_form_open.png'),
      fullPage: true,
    })
    console.log('   Captured 09a_dashboard_opex_form_open.png')

    // Type RM500 and submit
    await page.type('input[type="number"]', '500')
    await sleep(200)

    const submitBtn = await page.$('button ::-p-text(Simpan Perbelanjaan)')
    if (submitBtn) {
      await submitBtn.click()
    }
    await sleep(500)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '09b_dashboard_opex_saved.png'),
      fullPage: true,
    })
    console.log('   Captured 09b_dashboard_opex_saved.png')

    // 6. Test Advanced Analytics ("Analisis Lanjut") Accordion on Desktop
    console.log('\n--- 6. ADVANCED ANALYTICS ON DESKTOP & MOBILE ---')
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2, isMobile: false, hasTouch: false })
    await sleep(300)

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const advBtn = buttons.find(b => b.innerText.includes('Analisis Lanjut'))
      if (advBtn) advBtn.click()
    })
    await sleep(800)

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '10_dashboard_advanced_analytics_desktop.png'),
      fullPage: true,
    })
    console.log('   Captured 10_dashboard_advanced_analytics_desktop.png')

    console.log('\n🎉 All Phase 2 Dashboard & Charts captures completed successfully!')
  } finally {
    await browser.close()
  }
}

run().catch(err => {
  console.error('❌ Error during Phase 2 verification:', err)
  process.exit(1)
})
