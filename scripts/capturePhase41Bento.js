import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/phase4_1'
const BASE_URL = 'http://localhost:5173/'
const FIXTURES_DIR = 'C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures'
const WORKBOOK_600 = path.join(FIXTURES_DIR, 'Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx')

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
    page.on('dialog', async (d) => await d.accept())

    // 1. Initial Load & Ingest 600-record workbook
    console.log('Ingesting 600-record workbook...')
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
    await sleep(400)

    // Go to upload
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Pilih Fail Excel'))
      if (b) b.click()
    })
    await sleep(500)

    // Upload
    const inputEl = await page.$('input[type="file"]')
    if (inputEl && fs.existsSync(WORKBOOK_600)) {
      await inputEl.uploadFile(WORKBOOK_600)
      await sleep(1000)

      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Jana Laporan Jualan'))
        if (b) b.click()
      })
      await sleep(1200)

      // --- CAPTURE 1: 1280px Desktop Bento 1+3 ---
      console.log('Capturing Desktop Bento (1280px)...')
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2, isMobile: false })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '1_bento_desktop_1280.png'), fullPage: false })

      // --- CAPTURE 2: 768px Tablet Bento 1+3 ---
      console.log('Capturing Tablet Bento (768px)...')
      await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2, isMobile: false })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '2_bento_tablet_768.png'), fullPage: false })

      // --- CAPTURE 3: 430px Large Mobile 2x2 ---
      console.log('Capturing Large Mobile (430px)...')
      await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '3_kpi_mobile_430.png'), fullPage: false })

      // --- CAPTURE 4: 390px Standard Mobile 2x2 ---
      console.log('Capturing Standard Mobile (390px)...')
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '4_kpi_mobile_390.png'), fullPage: false })

      // --- CAPTURE 5: 390px Mobile Menu Open ---
      console.log('Capturing Mobile Menu Open (390px)...')
      await page.evaluate(() => {
        const menuBtn = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Menu'))
        if (menuBtn) menuBtn.click()
      })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '5_mobile_menu_open_390.png'), fullPage: false })

      // Close menu
      await page.evaluate(() => {
        const menuBtn = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Menu'))
        if (menuBtn) menuBtn.click()
      })
      await sleep(300)

      // --- CAPTURE 6: 360px Mobile ---
      console.log('Capturing Android Mobile (360px)...')
      await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '6_kpi_mobile_360.png'), fullPage: false })

      // --- CAPTURE 7: 320px Smallest Mobile ---
      console.log('Capturing Smallest Mobile (320px)...')
      await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '7_kpi_mobile_320.png'), fullPage: false })

      // --- CAPTURE 8: Full Page Scrolling 390px ---
      console.log('Capturing Full Mobile Dashboard (390px)...')
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '8_full_dashboard_mobile_390.png'), fullPage: true })
    }

    console.log('All Phase 4.1 Bento captures completed successfully!')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
  }
}

run()
