import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('Launching headless Chrome...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  // Standard smartphone viewport (390 x 844, 2x DPR for crisp retina screenshots)
  await page.setViewport({
    width: 412,
    height: 915,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })

  // ==========================================
  // 1. HOMEPAGE
  // ==========================================
  console.log('1. Capturing 01_homepage.png...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(800)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '01_homepage.png'),
    fullPage: true,
  })

  // ==========================================
  // 2. USER GUIDE (PANDUAN PENGGUNA)
  // ==========================================
  console.log('2. Capturing 02_user_guide.png...')
  const guideBtn = await page.$('button ::-p-text(Baca Panduan)') || await page.$('button ::-p-text(Panduan)')
  if (guideBtn) {
    await guideBtn.click()
    await sleep(800)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_user_guide.png'),
      fullPage: true,
    })
  }

  // ==========================================
  // 3. STORY INPUT FORM (AI)
  // ==========================================
  console.log('3. Capturing 03_story_input.png...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(600)
  const storyBtn = await page.$('button ::-p-text(Mula Bercerita dengan AI)')
  if (storyBtn) {
    await storyBtn.click()
    await sleep(600)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_story_input.png'),
      fullPage: true,
    })

    // Fill sample and extract
    console.log('4. Extracting story with Gemini AI...')
    const fillBtn = await page.$('button ::-p-text(Isi Contoh Ayat)')
    if (fillBtn) {
      await fillBtn.click()
      await sleep(400)
      const extractBtn = await page.$('button ::-p-text(Susun Data dengan AI)')
      if (extractBtn) {
        await extractBtn.click()
        // Wait for extraction preview to render
        await page.waitForSelector('button ::-p-text(Betul, Jana Laporan Saya)', { timeout: 25000 }).catch(() => null)
        await sleep(1000)
        console.log('Capturing 04_story_extracted_preview.png...')
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '04_story_extracted_preview.png'),
          fullPage: true,
        })
      }
    }
  }

  // ==========================================
  // 4. UPLOAD FORM (EXCEL / CSV)
  // ==========================================
  console.log('5. Capturing 05_upload_form.png...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(600)
  const uploadBtn = await page.$('button ::-p-text(Pilih Fail Excel / CSV)')
  if (uploadBtn) {
    await uploadBtn.click()
    await sleep(600)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_upload_form.png'),
      fullPage: true,
    })
  }

  // ==========================================
  // 5. MANUAL ENTRY FORM
  // ==========================================
  console.log('6. Capturing 06_manual_entry_form.png...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(600)
  const manualBtn = await page.$('button ::-p-text(Buka Borang Jualan Manual)')
  if (manualBtn) {
    await manualBtn.click()
    await sleep(600)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06_manual_entry_form.png'),
      fullPage: true,
    })
  }

  // ==========================================
  // 6. SALES DASHBOARD (SAMPLE DATA)
  // ==========================================
  console.log('7. Loading Sample Data Dashboard...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(600)
  const sampleBtn = await page.$('button ::-p-text(Jana Laporan dengan Data Contoh)')
  if (sampleBtn) {
    await sampleBtn.click()
    await sleep(1200)

    console.log('Capturing 07_dashboard_overview.png...')
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '07_dashboard_overview.png'),
      fullPage: false, // first fold on mobile screen
    })

    console.log('Capturing 08_dashboard_full.png...')
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '08_dashboard_full.png'),
      fullPage: true, // entire page including all charts and product table
    })

    // Add operating expenses to demonstrate Net Profit card update
    console.log('8. Adding operating expenses to test net profit card...')
    const addOpexBtn = await page.$('button ::-p-text(+ Masukkan)')
    if (addOpexBtn) {
      await addOpexBtn.click()
      await sleep(300)
      const opexInput = await page.$('input[placeholder*="150.00"]') || await page.$('input[type="number"]')
      if (opexInput) {
        await opexInput.type('250')
        const saveOpexBtn = await page.$('button ::-p-text(Simpan Perbelanjaan)')
        if (saveOpexBtn) {
          await saveOpexBtn.click()
          await sleep(600)
          console.log('Capturing 09_dashboard_with_operating_expenses.png...')
          await page.screenshot({
            path: path.join(OUTPUT_DIR, '09_dashboard_with_operating_expenses.png'),
            fullPage: false,
          })
        }
      }
    }

    // ==========================================
    // 7. GEMINI AI BUSINESS CHAT
    // ==========================================
    console.log('9. Opening AI Chat Assistant...')
    const chatBtn = await page.$('button ::-p-text(Tanya Pembantu AI)') || await page.$('button ::-p-text(Tanya AI)')
    if (chatBtn) {
      await chatBtn.click()
      await sleep(800)

      console.log('Capturing 10_ai_chat.png...')
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '10_ai_chat.png'),
        fullPage: true,
      })

      // Click suggested question chip
      console.log('10. Clicking suggested question chip...')
      const questionChips = await page.$$('button')
      for (const btn of questionChips) {
        const text = await page.evaluate((el) => el.innerText, btn)
        if (text && text.includes('Produk mana paling laris')) {
          await btn.click()
          break
        }
      }

      await page.waitForSelector('p ::-p-text(Karipap)', { timeout: 10000 }).catch(() => null)
      await sleep(1000)
      console.log('Capturing 11_ai_chat_answered.png...')
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '11_ai_chat_answered.png'),
        fullPage: true,
      })
    }
  }

  await browser.close()
  console.log('SUCCESS: All screenshots saved to:', OUTPUT_DIR)
}

run().catch((err) => {
  console.error('Capture error:', err)
  process.exit(1)
})
