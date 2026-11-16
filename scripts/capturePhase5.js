import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/phase5'
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

    // 1. Initial Load & Ingest 600-record workbook to get to Dashboard
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

      // Open AI Chat
      console.log('Navigating to AI Chat...')
      await page.evaluate(() => {
        const chatBtn = Array.from(document.querySelectorAll('button')).find((x) => x.innerText.includes('Tanya Pembantu AI'))
        if (chatBtn) chatBtn.click()
      })
      await sleep(600)

      // --- CAPTURE 1: Desktop Chat (1280px) ---
      console.log('Capturing Desktop Chat (1280px)...')
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2, isMobile: false })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '1_desktop_chat_1280.png'), fullPage: false })

      // Open Gemini Modal from Chat
      console.log('Opening Gemini modal...')
      await page.evaluate(() => {
        const keyBtn = Array.from(document.querySelectorAll('button')).find((x) => x.title?.includes('Kunci API') || x.innerText.includes('Kunci Gemini'))
        if (keyBtn) keyBtn.click()
      })
      await sleep(400)

      // --- CAPTURE 2: Desktop Gemini Modal (1280px) ---
      console.log('Capturing Desktop Gemini Modal (1280px)...')
      await page.screenshot({ path: path.join(OUTPUT_DIR, '2_desktop_gemini_modal_1280.png'), fullPage: false })

      // Close modal by pressing Escape
      await page.keyboard.press('Escape')
      await sleep(400)

      // --- CAPTURE 3: Mobile Chat (390px) ---
      console.log('Capturing Mobile Chat (390px)...')
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '3_mobile_chat_390.png'), fullPage: false })

      // --- CAPTURE 4: Mobile Chat (320px) ---
      console.log('Capturing Mobile Chat (320px)...')
      await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '4_mobile_chat_320.png'), fullPage: false })

      // Open Gemini Modal on 390px
      console.log('Capturing Mobile Gemini Modal (390px)...')
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await page.evaluate(() => {
        const keyBtn = Array.from(document.querySelectorAll('button')).find((x) => x.title?.includes('Kunci API') || x.innerText.includes('Kunci Gemini'))
        if (keyBtn) keyBtn.click()
      })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '5_mobile_gemini_modal_390.png'), fullPage: false })

      // Close modal
      await page.keyboard.press('Escape')
      await sleep(300)

      // Open Gemini Modal on 320px
      console.log('Capturing Mobile Gemini Modal (320px)...')
      await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await page.evaluate(() => {
        const keyBtn = Array.from(document.querySelectorAll('button')).find((x) => x.title?.includes('Kunci API') || x.innerText.includes('Kunci Gemini'))
        if (keyBtn) keyBtn.click()
      })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '6_mobile_gemini_modal_320.png'), fullPage: false })

      // Close modal
      await page.keyboard.press('Escape')
      await sleep(300)

      // Go back to dashboard, then open Guide
      console.log('Navigating to User Guide...')
      await page.evaluate(() => {
        const backBtn = Array.from(document.querySelectorAll('button')).find((x) => x.title?.includes('Kembali ke Papan Pemuka') || x.innerText.includes('Papan Pemuka'))
        if (backBtn) backBtn.click()
      })
      await sleep(500)

      // Open Guide from Header
      await page.evaluate(() => {
        const guideBtn = Array.from(document.querySelectorAll('button')).find((x) => x.title?.includes('Panduan') || x.innerText.includes('Panduan'))
        if (guideBtn) guideBtn.click()
      })
      await sleep(600)

      // --- CAPTURE 7: Desktop Guide (1280px) ---
      console.log('Capturing Desktop Guide (1280px)...')
      await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2, isMobile: false })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '7_desktop_guide_1280.png'), fullPage: false })

      // --- CAPTURE 8: Mobile Guide (390px) ---
      console.log('Capturing Mobile Guide (390px)...')
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '8_mobile_guide_390.png'), fullPage: false })

      // --- CAPTURE 9: Mobile Guide (320px) ---
      console.log('Capturing Mobile Guide (320px)...')
      await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await sleep(400)
      await page.screenshot({ path: path.join(OUTPUT_DIR, '9_mobile_guide_320.png'), fullPage: false })
    }

    console.log('All Phase 5 captures completed successfully!')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
  }
}

run()
