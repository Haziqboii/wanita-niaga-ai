import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/phase4'
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
    // ----------------------------------------------------
    // PART 1: 600-RECORD WORKBOOK DASHBOARD (16 PRODUCTS)
    // ----------------------------------------------------
    console.log('Loading 600-Record Workbook into Dashboard...')
    const page = await browser.newPage()
    page.on('dialog', async (d) => await d.accept())

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

    // Upload 600-record workbook
    const inputEl = await page.$('input[type="file"]')
    if (inputEl && fs.existsSync(WORKBOOK_600)) {
      await inputEl.uploadFile(WORKBOOK_600)
      await sleep(1000)

      // Click "Jana Laporan Jualan"
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Jana Laporan Jualan'))
        if (b) b.click()
      })
      await sleep(1200)

      // Check viewports
      const viewports = [
        { name: 'dashboard_1280px.png', width: 1280, height: 900, isMobile: false },
        { name: 'dashboard_768px.png', width: 768, height: 1024, isMobile: false },
        { name: 'dashboard_430px.png', width: 430, height: 932, isMobile: true },
        { name: 'dashboard_390px.png', width: 390, height: 844, isMobile: true },
        { name: 'dashboard_360px.png', width: 360, height: 780, isMobile: true },
        { name: 'dashboard_320px.png', width: 320, height: 600, isMobile: true },
      ]

      for (const vp of viewports) {
        console.log(`Capturing Dashboard at ${vp.width}px...`)
        await page.setViewport({
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 2,
          isMobile: vp.isMobile,
          hasTouch: vp.isMobile,
        })
        await sleep(400)
        await page.screenshot({
          path: path.join(OUTPUT_DIR, vp.name),
          fullPage: false,
        })
      }

      // Test "Lihat Semua Produk (16)" expanded chart
      console.log('Capturing Expanded Horizontal Chart at 390px...')
      await page.setViewport({ width: 390, height: 1200, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Lihat Semua Produk'))
        if (b) b.click()
      })
      await sleep(600)
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'dashboard_390px_expanded_chart.png'),
        fullPage: false,
      })

      // Test Monthly Filter click: "September 2026"
      console.log('Testing Monthly Filter (September 2026)...')
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Sep 2026') || x.innerText.includes('September'))
        if (b) b.click()
      })
      await sleep(600)
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'dashboard_monthly_sep_390px.png'),
        fullPage: false,
      })
    }

    console.log('Phase 4 Dashboard captures completed successfully!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

run()
