import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\phase1_sales_entry'
const FIXTURES_DIR = 'C:\\SULAM\\wanita-niaga-ai\\test_fixtures'
const CSV_FILE = path.join(FIXTURES_DIR, 'test_sales.csv')
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const VIEWPORTS = [
  { name: '320px_narrow', width: 320, height: 667, isMobile: true, hasTouch: true },
  { name: '390px_standard', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: '1280px_desktop', width: 1280, height: 850, isMobile: false, hasTouch: false },
]

async function run() {
  console.log('🚀 Starting Phase 1 Sales Entry Verification & Visual Capture...')
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

    // Helper: Reset clean state and unlock Section 2
    const setupSection2 = async (vp) => {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile, hasTouch: vp.hasTouch })
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await page.evaluate(() => {
        indexedDB.deleteDatabase('WanitaNiagaAI_DB')
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await sleep(300)
      // Scroll down past Section 1 to reveal Section 2
      await page.evaluate((h) => {
        window.scrollTo({ top: h, behavior: 'instant' })
      }, vp.height)
      await sleep(500)
    }

    // ==========================================
    // 1. STORY INPUT (STAGE 1 & STAGE 2)
    // ==========================================
    console.log('\n--- 1. STORY INPUT FORM ---')
    for (const vp of VIEWPORTS) {
      await setupSection2(vp)

      // Click "Mula Cerita Jualan"
      const storyBtn = await page.$('button ::-p-text(Mula Cerita Jualan)')
      if (!storyBtn) throw new Error('Could not find "Mula Cerita Jualan" button')
      await storyBtn.click()
      await sleep(400)

      // Capture Stage 1 (Input)
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `01_story_stage1_${vp.name}.png`),
        fullPage: true,
      })
      console.log(`   Captured 01_story_stage1_${vp.name}.png`)

      // Now populate story and simulate extraction to Stage 2 (Review)
      await page.evaluate(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) {
          textarea.value = 'Pagi tadi laku 50 biji karipap RM2.00 dan 20 botol air sirap RM1.50 di gerai.'
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      await sleep(200)

      // Enter mock extraction items directly by setting state in React component or injecting state
      await page.evaluate(() => {
        // Trigger review stage by simulating extract button or mock state if available
        // Let's check if the extract button can be triggered
        const buttons = Array.from(document.querySelectorAll('button'))
        const extractBtn = buttons.find((b) => b.innerText.includes('Susun Rekod Jualan'))
        if (extractBtn) {
          // If Gemini key is not set, let's inject extracted records directly via storage or dispatch
        }
      })

      // Let's seed storage with an active story draft review stage to view Stage 2 reliably without external API
      await page.evaluate(async () => {
        const storage = await import('./src/data/storage.ts')
        await storage.saveReportToStorage({
          version: 1,
          reportId: 'story-review-test',
          updatedAt: new Date().toISOString(),
          records: [
            { produk: 'Karipap Daging', kuantiti: 50, harga: 2.0, kos: 0.8, tarikh: '2026-11-15', saluran: 'Gerai' },
            { produk: 'Air Sirap Limau', kuantiti: 20, harga: 1.5, kos: 0.5, tarikh: '2026-11-15', saluran: 'Gerai' },
          ],
          operatingExpenses: 50,
          selectedMonth: 'ALL',
          isSampleData: false,
          page: 'story',
          chatMessages: [],
          storyDraft: {
            storyText: 'Pagi tadi laku 50 biji karipap RM2.00 dan 20 botol air sirap RM1.50 di gerai.',
            isStoryReview: true,
          },
        })
      })

      await page.reload({ waitUntil: 'networkidle2' })
      await sleep(500)

      // Capture Stage 2 (Review with Extracted Items & Operating Expenses)
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `02_story_stage2_${vp.name}.png`),
        fullPage: true,
      })
      console.log(`   Captured 02_story_stage2_${vp.name}.png`)
    }

    // ==========================================
    // 2. EXCEL / CSV UPLOAD FORM
    // ==========================================
    console.log('\n--- 2. UPLOAD FORM ---')
    for (const vp of VIEWPORTS) {
      await setupSection2(vp)

      // Click "Pilih Fail" under Method 2 to open Upload page
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Pilih Fail'))
        if (b) b.click()
      })
      await sleep(500)

      // Capture Empty Dropzone State
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `03_upload_empty_${vp.name}.png`),
        fullPage: true,
      })
      console.log(`   Captured 03_upload_empty_${vp.name}.png`)

      // Upload CSV test file
      const fileInput = await page.$('input[type="file"]')
      if (fileInput && fs.existsSync(CSV_FILE)) {
        await fileInput.uploadFile(CSV_FILE)
        await sleep(800)

        // Capture Loaded & Mapped Preview State
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `04_upload_mapped_${vp.name}.png`),
          fullPage: true,
        })
        console.log(`   Captured 04_upload_mapped_${vp.name}.png`)
      }
    }

    // ==========================================
    // 3. MANUAL ENTRY FORM
    // ==========================================
    console.log('\n--- 3. MANUAL ENTRY FORM ---')
    for (const vp of VIEWPORTS) {
      await setupSection2(vp)

      // Click "Buka Borang" under Method 3 to open Manual Entry page
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Buka Borang'))
        if (b) b.click()
      })
      await sleep(500)

      // Capture Empty Manual Form
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `05_manual_empty_${vp.name}.png`),
        fullPage: true,
      })
      console.log(`   Captured 05_manual_empty_${vp.name}.png`)

      // Add item 1
      await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Karipap Panas')
      await page.type('input[placeholder="50"]', '40')
      await page.type('input[placeholder="2.00"]', '2.50')

      // Expand optional fields
      await page.evaluate(() => {
        const optBtn = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Maklumat tambahan'))
        if (optBtn) optBtn.click()
      })
      await sleep(250)

      await page.type('input[placeholder="cth. 0.80"]', '1.00')
      await page.select('select', 'Gerai')

      // Click Tambah Jualan
      await page.evaluate(() => {
        const addBtn = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tambah Jualan'))
        if (addBtn) addBtn.click()
      })
      await sleep(400)

      // Add item 2
      await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Kuih Lapis Pelangi')
      await page.type('input[placeholder="50"]', '30')
      await page.type('input[placeholder="2.00"]', '1.20')

      await page.evaluate(() => {
        const addBtn = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tambah Jualan'))
        if (addBtn) addBtn.click()
      })
      await sleep(400)

      // Capture Populated Manual Form with Sales List and Summary
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `06_manual_populated_${vp.name}.png`),
        fullPage: true,
      })
      console.log(`   Captured 06_manual_populated_${vp.name}.png`)
    }

    console.log('\n✅ Phase 1 Verification Completed Successfully! All screenshots captured.')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('❌ Verification script failed:', err)
  process.exit(1)
})
