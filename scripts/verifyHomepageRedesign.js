import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('Launching headless Chrome for Homepage Redesign verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Viewport 360px mobile
    console.log('1. Capturing homepage_360px.png...')
    await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'homepage_360px.png'), fullPage: true })

    // 2. Viewport 390px mobile (iPhone 12/13/14)
    console.log('2. Capturing homepage_390px.png...')
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'homepage_390px.png'), fullPage: true })

    // 3. Viewport 430px mobile (iPhone Pro Max / Android large)
    console.log('3. Capturing homepage_430px.png...')
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'homepage_430px.png'), fullPage: true })

    // Also update standard 01_homepage.png
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_homepage.png'), fullPage: true })

    // 4. Viewport Desktop (1280px)
    console.log('4. Capturing homepage_desktop.png...')
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5, isMobile: false })
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'homepage_desktop.png'), fullPage: true })

    // 5. Test Navigation Actions
    console.log('5. Testing navigation pathways...')

    // A. Click "Mula dengan AI"
    console.log('   Testing "Mula dengan AI" CTA...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)
    const storyBtn = await page.$('button ::-p-text(Mula dengan AI)')
    if (!storyBtn) throw new Error('Could not find "Mula dengan AI" button')
    await storyBtn.click()
    await sleep(500)
    const storyHeader = await page.evaluate(() => document.body.innerText.includes('Ceritakan Perniagaan Anda') || document.body.innerText.includes('Cerita Jualan AI'))
    console.log('   -> Story Input opened successfully:', storyHeader)
    if (!storyHeader) throw new Error('Story navigation failed')

    // B. Back to Home and test "Muat Naik Excel / CSV"
    console.log('   Testing "Muat Naik Excel / CSV" button...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)
    const uploadBtn = await page.$('button ::-p-text(Muat Naik Excel / CSV)')
    if (!uploadBtn) throw new Error('Could not find "Muat Naik Excel / CSV" button')
    await uploadBtn.click()
    await sleep(500)
    const uploadHeader = await page.evaluate(() => document.body.innerText.includes('Muat Naik Fail Jualan') || document.body.innerText.includes('Muat Naik Fail'))
    console.log('   -> Upload Form opened successfully:', uploadHeader)
    if (!uploadHeader) throw new Error('Upload navigation failed')

    // C. Back to Home and test "Isi Jualan Manual"
    console.log('   Testing "Isi Jualan Manual" button...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)
    const manualBtn = await page.$('button ::-p-text(Isi Jualan Manual)')
    if (!manualBtn) throw new Error('Could not find "Isi Jualan Manual" button')
    await manualBtn.click()
    await sleep(500)
    const manualHeader = await page.evaluate(() => document.body.innerText.includes('Isi Maklumat Jualan Manual') || document.body.innerText.includes('Borang Manual'))
    console.log('   -> Manual Entry Form opened successfully:', manualHeader)
    if (!manualHeader) throw new Error('Manual navigation failed')

    // D. Back to Home and test "Cuba Data Contoh"
    console.log('   Testing "Cuba Data Contoh" button...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)
    const sampleBtn = await page.$('button ::-p-text(Cuba Data Contoh)')
    if (!sampleBtn) throw new Error('Could not find "Cuba Data Contoh" button')
    await sampleBtn.click()
    await sleep(600)
    const dashboardHeader = await page.evaluate(() => document.body.innerText.includes('Papan Pemuka Jualan') || document.body.innerText.includes('Papan Pemuka'))
    console.log('   -> Sample Data Dashboard opened successfully:', dashboardHeader)
    if (!dashboardHeader) throw new Error('Sample data navigation failed')

    // E. Back to Home and test User Guide link
    console.log('   Testing "Baca panduan ringkas" link...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)
    const guideLink = await page.$('button ::-p-text(Baca panduan ringkas)')
    if (!guideLink) throw new Error('Could not find "Baca panduan ringkas" link')
    await guideLink.click()
    await sleep(500)
    const guideHeader = await page.evaluate(() => document.body.innerText.includes('Panduan Pengguna Ringkas') || document.body.innerText.includes('Panduan Pengguna'))
    console.log('   -> User Guide opened successfully:', guideHeader)
    if (!guideHeader) throw new Error('User Guide navigation failed')

    console.log('\nALL HOMEPAGE CHECKS AND SCREENSHOTS COMPLETED SUCCESSFULLY!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('ERROR during verification:', err)
  process.exit(1)
})
