import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = path.resolve('C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/screenshots/all_pages_apple_floating')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🚀 Running Targeted Visual Verification for Each Page...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  // Helper to get fresh page with cleared storage
  async function createCleanPage(width = 1280, height = 850) {
    const page = await browser.newPage()
    await page.setViewport({ width, height, deviceScaleFactor: 2 })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
    await sleep(400)
    return page
  }

  // 1. Story Input Page
  {
    console.log('Capturing Story Input Form...')
    const page = await createCleanPage()
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Masuk'))
      if (btn) btn.click()
    })
    await sleep(500)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Mula Cerita Jualan'))
      if (btn) btn.click()
    })
    await sleep(600)
    await page.screenshot({ path: path.join(outputDir, '04_story_input_floating_cards.png') })
    console.log('   ✓ Saved: 04_story_input_floating_cards.png')
    await page.close()
  }

  // 2. Upload Page
  {
    console.log('Capturing Upload Form...')
    const page = await createCleanPage()
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Masuk'))
      if (btn) btn.click()
    })
    await sleep(500)
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button, div'))
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pilih Fail'))
      if (btn) btn.click()
    })
    await sleep(600)
    await page.screenshot({ path: path.join(outputDir, '05_upload_form_floating_dropzone.png') })
    console.log('   ✓ Saved: 05_upload_form_floating_dropzone.png')
    await page.close()
  }

  // 3. Manual Entry Page
  {
    console.log('Capturing Manual Entry Form...')
    const page = await createCleanPage()
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Masuk'))
      if (btn) btn.click()
    })
    await sleep(500)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Buka Borang'))
      if (btn) btn.click()
    })
    await sleep(600)
    await page.screenshot({ path: path.join(outputDir, '06_manual_entry_floating_card.png') })
    console.log('   ✓ Saved: 06_manual_entry_floating_card.png')
    await page.close()
  }

  // 4. Mobile Dashboard
  {
    console.log('Capturing Mobile Dashboard...')
    const page = await createCleanPage(390, 844)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Masuk'))
      if (btn) btn.click()
    })
    await sleep(500)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Muatkan Data'))
      if (btn) btn.click()
    })
    await sleep(700)
    await page.screenshot({ path: path.join(outputDir, '07_mobile_dashboard_floating.png') })
    console.log('   ✓ Saved: 07_mobile_dashboard_floating.png')
    await page.close()
  }

  await browser.close()
  console.log('🎉 Done capturing all target pages!')
}

run().catch((err) => {
  console.error('Error during run:', err)
  process.exit(1)
})
