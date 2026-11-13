import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const BASE_URL = 'http://localhost:5173'

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    // Test 390px mobile viewport (iPhone 12/13/14)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // 1. Click "Baca panduan ringkas" on Homepage
    const guideLink = await page.$('button ::-p-text(Baca panduan ringkas)')
    if (!guideLink) throw new Error('Baca panduan ringkas button not found on Homepage')
    await guideLink.click()
    await new Promise(r => setTimeout(r, 600))

    console.log('Navigated to Panduan Pengguna page.')

    // 2. Verify Header
    const pageText = await page.evaluate(() => document.body.innerText)
    if (!pageText.includes('Panduan Pengguna')) {
      throw new Error('FAIL: "Panduan Pengguna" title not found!')
    }
    if (!pageText.includes('Mudahnya Urus Niaga dengan Wanita Niaga AI')) {
      throw new Error('FAIL: Hero title not found!')
    }
    console.log('PASS: Header and Hero card verified.')

    // 3. Capture 390px mobile view
    const shot390 = path.join(OUTPUT_DIR, 'guide_390px.png')
    await page.screenshot({ path: shot390, fullPage: true })
    console.log('Saved guide_390px.png')

    // 4. Test "Buka Semua" button
    const expandAllBtn = await page.$('button ::-p-text(Buka Semua)')
    if (expandAllBtn) {
      await expandAllBtn.click()
      await new Promise(r => setTimeout(r, 500))
      console.log('Clicked "Buka Semua".')
    }

    // Capture expanded state
    const shotExpanded = path.join(OUTPUT_DIR, 'guide_expanded_390px.png')
    await page.screenshot({ path: shotExpanded, fullPage: true })
    console.log('Saved guide_expanded_390px.png')

    // 5. Test 360px viewport
    await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise(r => setTimeout(r, 300))
    const shot360 = path.join(OUTPUT_DIR, 'guide_360px.png')
    await page.screenshot({ path: shot360, fullPage: true })
    console.log('Saved guide_360px.png')

    // 6. Test 430px viewport
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await new Promise(r => setTimeout(r, 300))
    const shot430 = path.join(OUTPUT_DIR, 'guide_430px.png')
    await page.screenshot({ path: shot430, fullPage: true })
    console.log('Saved guide_430px.png')

    // 7. Test Desktop viewport (1200px)
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 })
    await new Promise(r => setTimeout(r, 400))
    const shotDesktop = path.join(OUTPUT_DIR, 'guide_desktop.png')
    await page.screenshot({ path: shotDesktop, fullPage: true })
    console.log('Saved guide_desktop.png')

    // 8. Test closing guide via bottom CTA button "Faham, Kembali ke Aplikasi 👍"
    const closeBtn = await page.$('button ::-p-text(Faham, Kembali ke Aplikasi)')
    if (closeBtn) {
      await closeBtn.click()
      await new Promise(r => setTimeout(r, 600))
      const returnText = await page.evaluate(() => document.body.innerText)
      if (returnText.includes('Wanita Niaga')) {
        console.log('PASS: Successfully returned to Homepage via close button.')
      }
    }

    // 9. Copy all screenshots to brain artifacts directory
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
    }
    fs.copyFileSync(shot390, path.join(ARTIFACTS_DIR, 'guide_390px.png'))
    fs.copyFileSync(shotExpanded, path.join(ARTIFACTS_DIR, 'guide_expanded_390px.png'))
    fs.copyFileSync(shot360, path.join(ARTIFACTS_DIR, 'guide_360px.png'))
    fs.copyFileSync(shot430, path.join(ARTIFACTS_DIR, 'guide_430px.png'))
    fs.copyFileSync(shotDesktop, path.join(ARTIFACTS_DIR, 'guide_desktop.png'))
    console.log('All guide artifacts copied successfully.')
  } finally {
    await browser.close()
  }
}

verify().catch(err => {
  console.error(err)
  process.exit(1)
})
