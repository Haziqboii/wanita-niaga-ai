import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = path.resolve('C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/screenshots/new_landing_image')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🚀 Verifying new Landing Page image...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  // 1. Desktop (1280x800)
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await sleep(600)
    await page.screenshot({ path: path.join(outputDir, 'desktop_new_landing.png') })
    console.log('   ✓ Saved: desktop_new_landing.png')
    await page.close()
  }

  // 2. Mobile (390x844)
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await sleep(600)
    await page.screenshot({ path: path.join(outputDir, 'mobile_new_landing.png') })
    console.log('   ✓ Saved: mobile_new_landing.png')
    await page.close()
  }

  await browser.close()
  console.log('🎉 Done!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
