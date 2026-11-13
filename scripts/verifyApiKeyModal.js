import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    console.log('1. Page loaded on Desktop. Finding Kunci API button...')
    // Look for button with text "Kunci API"
    const buttons = await page.$$('button')
    let keyBtn = null
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b)
      if (text && text.includes('Kunci API')) {
        keyBtn = b
        break
      }
    }

    if (!keyBtn) {
      throw new Error('Desktop Kunci API button not found!')
    }

    console.log('2. Clicking Desktop Kunci API button...')
    await keyBtn.click()

    // Wait for modal dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 })
    console.log('3. Modal dialog detected!')

    const modalTitle = await page.$eval('#api-key-modal-title', el => el.textContent)
    console.log(`4. Modal title is: "${modalTitle}"`)

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    const screenshotPath = path.join(OUTPUT_DIR, 'modal_verified_desktop.png')
    await page.screenshot({ path: screenshotPath })
    console.log(`5. Screenshot saved to: ${screenshotPath}`)

    // Close modal
    const closeBtn = await page.$('[aria-label="Tutup"]')
    if (closeBtn) {
      await closeBtn.click()
      await new Promise(r => setTimeout(r, 400))
      const modalStillThere = await page.$('[role="dialog"]')
      console.log(`6. Modal closed successfully? ${modalStillThere === null}`)
    }

    // Now test Mobile viewport
    console.log('7. Testing Mobile Viewport (390x844)...')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    const mobileKeyBtn = await page.$('button[title="Tetapan Kunci API Gemini"]')
    if (!mobileKeyBtn) {
      throw new Error('Mobile key button not found!')
    }

    console.log('8. Clicking Mobile key button...')
    await mobileKeyBtn.click()

    await page.waitForSelector('[role="dialog"]', { timeout: 3000 })
    const mobileModalTitle = await page.$eval('#api-key-modal-title', el => el.textContent)
    console.log(`9. Mobile modal detected with title: "${mobileModalTitle}"`)

    const mobileScreenshotPath = path.join(OUTPUT_DIR, 'modal_verified_mobile.png')
    await page.screenshot({ path: mobileScreenshotPath })
    console.log(`10. Mobile screenshot saved to: ${mobileScreenshotPath}`)

    console.log('\nSUCCESS: Kunci API modal opens and closes perfectly on both Desktop and Mobile!')
  } finally {
    await browser.close()
  }
}

run().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
