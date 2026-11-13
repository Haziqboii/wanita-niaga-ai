import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const BASE_URL = 'http://localhost:5173'

async function inspectSharp() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    // Test on realistic mobile viewport (390x844 at 2x or 3x DPR)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    const sampleBtn = await page.$('button ::-p-text(Cuba Data Contoh)')
    await sampleBtn.click()
    await new Promise(r => setTimeout(r, 600))

    // Hover over the middle bar (Brownies) to trigger the tooltip
    const chartCard = await page.$('#chart-product-bar')
    if (!chartCard) throw new Error('Chart card not found')

    // Find the canvas bounding box
    const canvas = await chartCard.$('canvas')
    if (!canvas) throw new Error('Canvas not found')
    const box = await canvas.boundingBox()

    if (box) {
      // Hover middle of canvas
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await new Promise(r => setTimeout(r, 400))
    }

    const chartShotPath = path.join(OUTPUT_DIR, 'chart_sharp_detail.png')
    await chartCard.screenshot({ path: chartShotPath })
    console.log('Saved chart_sharp_detail.png')

    // Also take full dashboard screenshot
    const dashShotPath = path.join(OUTPUT_DIR, 'dashboard_390px.png')
    await page.screenshot({ path: dashShotPath, fullPage: true })

    fs.copyFileSync(chartShotPath, path.join(ARTIFACTS_DIR, 'chart_sharp_detail.png'))
    fs.copyFileSync(dashShotPath, path.join(ARTIFACTS_DIR, 'dashboard_390px.png'))
    console.log('Copied to artifacts')
  } finally {
    await browser.close()
  }
}

inspectSharp().catch(err => {
  console.error(err)
  process.exit(1)
})
