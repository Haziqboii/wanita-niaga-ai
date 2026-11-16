import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\berry_pop'
const PROTO_FILE = 'file:///C:/SULAM/wanita-niaga-ai/prototypes/berry-pop-refined.html'

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
    // 1. 360px Mobile (Returning User)
    console.log('Capturing 360px mobile...')
    const page360 = await browser.newPage()
    await page360.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page360.goto(PROTO_FILE, { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 600))
    await page360.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_360px_full.png'), fullPage: true })
    await page360.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_360px_fold.png'), fullPage: false })
    await page360.close()

    // 2. 390px Mobile (Returning User)
    console.log('Capturing 390px mobile...')
    const page390 = await browser.newPage()
    await page390.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page390.goto(PROTO_FILE, { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 600))
    await page390.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_390px_full.png'), fullPage: true })
    await page390.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_390px_fold.png'), fullPage: false })
    
    // Also capture New User state at 390px
    await page390.evaluate(() => {
      document.getElementById('returningSection').style.display = 'none'
    })
    await new Promise(r => setTimeout(r, 300))
    await page390.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_390px_new_user.png'), fullPage: false })
    await page390.close()

    // 3. 1280px Desktop
    console.log('Capturing 1280px desktop...')
    const pageDesktop = await browser.newPage()
    await pageDesktop.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
    await pageDesktop.goto(PROTO_FILE, { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 600))
    await pageDesktop.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_1280px_full.png'), fullPage: true })
    await pageDesktop.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_1280px_fold.png'), fullPage: false })

    // Also capture New User state at 1280px
    await pageDesktop.evaluate(() => {
      document.getElementById('returningSection').style.display = 'none'
    })
    await new Promise(r => setTimeout(r, 300))
    await pageDesktop.screenshot({ path: path.join(OUTPUT_DIR, 'berry_pop_1280px_new_user.png'), fullPage: false })
    await pageDesktop.close()

    console.log('All Berry Pop screenshots successfully captured!')
  } catch (err) {
    console.error('Error during screen capture:', err)
  } finally {
    await browser.close()
  }
}

run()
