import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/phase3b'
const BASE_URL = 'http://localhost:5173/'
const FIXTURES_DIR = 'C:\\SULAM\\wanita-niaga-ai\\test_fixtures'
const CSV_FILE = path.join(FIXTURES_DIR, 'test_sales.csv')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    // 1. Mobile Upload Mapped (390px)
    {
      const page = await browser.newPage()
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await page.evaluate(() => {
        indexedDB.deleteDatabase('WanitaNiagaAI_DB')
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await sleep(400)

      // Click Card 2: Pilih Fail Excel
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Pilih Fail Excel'))
        if (b) b.click()
      })
      await sleep(500)

      // Upload file
      const inputEl = await page.$('input[type="file"]')
      if (inputEl && fs.existsSync(CSV_FILE)) {
        await inputEl.uploadFile(CSV_FILE)
        await sleep(700)
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_mapped_mobile_390.png'), fullPage: false })
      }
      await page.close()
    }

    // 2. Mobile Manual Entry (390px)
    {
      const page = await browser.newPage()
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await page.evaluate(() => {
        indexedDB.deleteDatabase('WanitaNiagaAI_DB')
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await sleep(400)

      // Click Card 3: Buka Borang Jualan
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Buka Borang Jualan'))
        if (b) b.click()
      })
      await sleep(500)

      // Add item 1
      await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Karipap Daging')
      await page.type('input[placeholder="50"]', '50')
      await page.type('input[placeholder="2.00"]', '2.00')
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tambah Jualan'))
        if (b) b.click()
      })
      await sleep(400)

      // Add item 2
      await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Air Sirap Selasih')
      await page.type('input[placeholder="50"]', '30')
      await page.type('input[placeholder="2.00"]', '1.50')
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tambah Jualan'))
        if (b) b.click()
      })
      await sleep(500)
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_mobile_390.png'), fullPage: false })
      await page.close()
    }

    // 3. Desktop Upload Mapped (1280px)
    {
      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await page.evaluate(() => {
        indexedDB.deleteDatabase('WanitaNiagaAI_DB')
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await sleep(400)

      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Pilih Fail Excel'))
        if (b) b.click()
      })
      await sleep(500)

      const inputEl = await page.$('input[type="file"]')
      if (inputEl && fs.existsSync(CSV_FILE)) {
        await inputEl.uploadFile(CSV_FILE)
        await sleep(700)
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_mapped_desktop.png'), fullPage: false })
      }
      await page.close()
    }

    console.log('Mobile & desktop mapped captures complete!')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
  }
}

run()
