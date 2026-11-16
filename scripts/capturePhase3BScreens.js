import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/phase3b'
const BASE_URL = 'http://localhost:5173/'

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    const clearAndReloadHome = async (width, height) => {
      await page.setViewport({ width, height, deviceScaleFactor: 2 })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await page.evaluate(() => {
        indexedDB.deleteDatabase('WanitaNiagaAI_DB')
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 600))
    }

    // --- 1. Story Input Desktop (1280px) ---
    console.log('1. Story Input (Desktop)...')
    await clearAndReloadHome(1280, 900)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Mula Cerita Jualan'))
      if (found) found.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '1_story_desktop.png'), fullPage: false })

    // --- 2. Story Input Mobile (390px) ---
    console.log('2. Story Input (Mobile 390px)...')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '2_story_mobile_390.png'), fullPage: false })

    // --- 3. Upload Form Desktop (1280px) ---
    console.log('3. Upload Form (Desktop)...')
    await clearAndReloadHome(1280, 900)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Muat Naik Excel'))
      if (found) found.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '3_upload_desktop.png'), fullPage: false })

    // --- 4. Upload Form Mobile (390px) ---
    console.log('4. Upload Form (Mobile 390px)...')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '4_upload_mobile_390.png'), fullPage: false })

    // --- 5. Manual Entry Form Desktop (1280px) ---
    console.log('5. Manual Entry Form (Desktop)...')
    await clearAndReloadHome(1280, 900)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Buka Borang Jualan'))
      if (found) found.click()
    })
    await new Promise((r) => setTimeout(r, 600))

    // Type 2 sales items
    await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Karipap Daging')
    await page.type('input[placeholder="50"]', '50')
    await page.type('input[placeholder="2.00"]', '2.00')

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Tambah Jualan'))
      if (found) found.click()
    })
    await new Promise((r) => setTimeout(r, 500))

    await page.type('input[placeholder="Contoh: Karipap Daging"]', 'Air Sirap Selasih')
    await page.type('input[placeholder="50"]', '30')
    await page.type('input[placeholder="2.00"]', '1.50')

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Tambah Jualan'))
      if (found) found.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '5_manual_desktop.png'), fullPage: false })

    // --- 6. Manual Entry Form Mobile (390px) ---
    console.log('6. Manual Entry Form (Mobile 390px)...')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '6_manual_mobile_390.png'), fullPage: false })

    // --- 7. Manual Entry Form Mobile (320px) ---
    console.log('7. Manual Entry Form (Mobile 320px)...')
    await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUTPUT_DIR, '7_manual_mobile_320.png'), fullPage: false })

    console.log('All Phase 3B screenshots successfully captured!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

run()
