import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/phase3b'
const BASE_URL = 'http://localhost:5173/'
const FIXTURES_DIR = 'C:\\SULAM\\wanita-niaga-ai\\test_fixtures'
const CSV_FILE = path.join(FIXTURES_DIR, 'test_sales.csv')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.on('dialog', async (d) => {
      await d.accept()
    })

    const resetHome = async (w, h, isMob = false) => {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: isMob, hasTouch: isMob })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await page.evaluate(() => {
        indexedDB.deleteDatabase('WanitaNiagaAI_DB')
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await sleep(400)
    }

    // 1. Story Input Desktop
    console.log('Capturing Story Input Desktop...')
    await resetHome(1280, 850, false)
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Mula Cerita Jualan'))
      if (b) b.click()
    })
    await sleep(500)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_desktop.png'), fullPage: false })

    // 2. Story Input Mobile (390px)
    console.log('Capturing Story Input Mobile 390px...')
    await resetHome(390, 844, true)
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Mula Cerita Jualan'))
      if (b) b.click()
    })
    await sleep(500)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_mobile_390.png'), fullPage: false })

    // 3. Upload Form Empty Desktop
    console.log('Capturing Upload Empty Desktop...')
    await resetHome(1280, 850, false)
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Pilih Fail Excel'))
      if (b) b.click()
    })
    await sleep(500)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_empty_desktop.png'), fullPage: false })

    // 4. Upload Form Empty Mobile 390px
    console.log('Capturing Upload Empty Mobile 390px...')
    await resetHome(390, 844, true)
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Pilih Fail Excel'))
      if (b) b.click()
    })
    await sleep(500)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_empty_mobile_390.png'), fullPage: false })

    // 5. Upload Form Mapped with CSV Desktop
    console.log('Capturing Upload Mapped with CSV (Desktop)...')
    if (fs.existsSync(CSV_FILE)) {
      const inputEl = await page.$('input[type="file"]')
      if (inputEl) {
        await inputEl.uploadFile(CSV_FILE)
        await sleep(700)
        await page.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 2, isMobile: false, hasTouch: false })
        await sleep(300)
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_mapped_desktop.png'), fullPage: false })

        // 6. Upload Form Mapped Mobile 390px
        console.log('Capturing Upload Mapped with CSV (Mobile 390px)...')
        await page.setViewport({ width: 390, height: 950, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
        await sleep(300)
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_mapped_mobile_390.png'), fullPage: false })
      }
    }

    // 7. Manual Entry Desktop
    console.log('Capturing Manual Entry Desktop...')
    await resetHome(1280, 850, false)
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Buka Borang Jualan'))
      if (b) b.click()
    })
    await sleep(500)

    // Add 2 items
    await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Karipap Daging')
    await page.type('input[placeholder="50"]', '50')
    await page.type('input[placeholder="2.00"]', '2.00')
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tambah Jualan'))
      if (b) b.click()
    })
    await sleep(400)

    await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Air Sirap Selasih')
    await page.type('input[placeholder="50"]', '30')
    await page.type('input[placeholder="2.00"]', '1.50')
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tambah Jualan'))
      if (b) b.click()
    })
    await sleep(500)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_desktop.png'), fullPage: false })

    // 8. Manual Entry Mobile 390px
    console.log('Capturing Manual Entry Mobile 390px...')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(400)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_mobile_390.png'), fullPage: false })

    // 9. Manual Entry Mobile 320px
    console.log('Capturing Manual Entry Mobile 320px...')
    await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(400)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_mobile_320.png'), fullPage: false })

    console.log('All screens captured successfully!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

run()
