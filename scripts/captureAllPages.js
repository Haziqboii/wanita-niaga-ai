import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:/SULAM/wanita-niaga-ai/screenshots/app_pages'
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
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })

    // 1. Homepage Desktop
    console.log('Capturing App Homepage...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_1_homepage.png'), fullPage: false })

    // 2. Click Method 1: Cerita Jualan
    console.log('Capturing Story Input Page...')
    const storyCard = await page.$('article:nth-of-type(1) button')
    if (storyCard) {
      await storyCard.click()
      await new Promise((r) => setTimeout(r, 500))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_2_story.png'), fullPage: false })
      // Go back to home
      const backBtn = await page.$('header button')
      if (backBtn) await backBtn.click()
      await new Promise((r) => setTimeout(r, 400))
    }

    // 3. Click Method 2: Muat Naik Excel
    console.log('Capturing Upload Page...')
    const uploadBtn = await page.$('article:nth-of-type(2) button')
    if (uploadBtn) {
      await uploadBtn.click()
      await new Promise((r) => setTimeout(r, 500))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_3_upload.png'), fullPage: false })
      const backBtn = await page.$('header button')
      if (backBtn) await backBtn.click()
      await new Promise((r) => setTimeout(r, 400))
    }

    // 4. Click Method 3: Isi Jualan Sendiri
    console.log('Capturing Manual Entry Page...')
    const manualBtn = await page.$('article:nth-of-type(3) button')
    if (manualBtn) {
      await manualBtn.click()
      await new Promise((r) => setTimeout(r, 500))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_4_manual.png'), fullPage: false })
      const backBtn = await page.$('header button')
      if (backBtn) await backBtn.click()
      await new Promise((r) => setTimeout(r, 400))
    }

    // 5. Load Demo Sample Data -> Dashboard
    console.log('Capturing Dashboard Page with Sample Data...')
    const sampleBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Muatkan Data Contoh'))
      if (found) {
        found.click()
        return true
      }
      return false
    })
    await new Promise((r) => setTimeout(r, 800))
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_5_dashboard.png'), fullPage: false })

    // 6. Click Panduan
    console.log('Capturing User Guide Page...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const found = btns.find((b) => b.innerText.includes('Panduan'))
      if (found) found.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_6_guide.png'), fullPage: false })

    // 7. Mobile View (390px)
    console.log('Capturing Mobile Homepage (390px)...')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'page_7_mobile_home.png'), fullPage: false })

    console.log('All page screenshots captured successfully!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

run()
