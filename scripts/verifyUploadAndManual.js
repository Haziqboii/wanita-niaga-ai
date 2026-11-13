import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const BASE_URL = 'http://localhost:5173'

const REF_UPLOAD_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794536270776_3070a0bf.png'
const REF_MANUAL_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794536284834_1d701e29.png'

const FIXTURES_DIR = 'C:\\SULAM\\wanita-niaga-ai\\test_fixtures'
const CSV_FILE = path.join(FIXTURES_DIR, 'test_sales.csv')
const INVALID_FILE = path.join(FIXTURES_DIR, 'test_invalid.pdf')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('Starting Headless Chrome verification for UI Redesign 04 (Upload & Manual)...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // Accept any alert/confirm automatically
    page.on('dialog', async (d) => {
      console.log('   [Dialog intercepted]:', d.message())
      await d.accept()
    })

    // ==========================================
    // PART 1: EXCEL / CSV UPLOAD PAGE
    // ==========================================
    console.log('\n--- PART 1: EXCEL / CSV UPLOAD PAGE ---')

    // 1. Viewport captures for empty upload page
    const viewports = [
      { name: 'upload_360px.png', width: 360, height: 780, isMobile: true, hasTouch: true },
      { name: 'upload_390px.png', width: 390, height: 844, isMobile: true, hasTouch: true },
      { name: 'upload_430px.png', width: 430, height: 932, isMobile: true, hasTouch: true },
      { name: 'upload_desktop.png', width: 1280, height: 850, isMobile: false, hasTouch: false },
    ]

    for (const vp of viewports) {
      await page.setViewport(vp)
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await sleep(300)

      // Navigate to Upload
      const uploadCardBtn = await page.$('button ::-p-text(Muat Naik Excel / CSV)')
      if (!uploadCardBtn) throw new Error('Could not find "Muat Naik Excel / CSV" button on homepage')
      await uploadCardBtn.click()
      await sleep(300)

      await page.screenshot({ path: path.join(OUTPUT_DIR, vp.name), fullPage: true })
      console.log(`   Captured ${vp.name}`)
    }

    // 2. Functional tests on Upload (390px)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(300)

    const uploadCardBtn = await page.$('button ::-p-text(Muat Naik Excel / CSV)')
    await uploadCardBtn.click()
    await sleep(300)

    // Check header & heading
    const headerTitle = await page.evaluate(() => document.querySelector('header h1')?.innerText)
    const pageHeading = await page.evaluate(() => document.querySelector('h2')?.innerText)
    console.log('   Header title:', headerTitle)
    console.log('   Page heading:', pageHeading)
    if (!headerTitle?.includes('Muat Naik Jualan')) throw new Error('Header title should be "Muat Naik Jualan"')
    if (!pageHeading?.includes('Ada rekod jualan dalam Excel?')) throw new Error('Heading missing')

    // Test invalid file rejection
    console.log('   Testing invalid file upload (.pdf)...')
    const fileInput = await page.$('input[type="file"]')
    await fileInput.uploadFile(INVALID_FILE)
    await sleep(400)
    const hasErrorAlert = await page.evaluate(() => document.body.innerText.includes('Hanya fail CSV') || document.body.innerText.includes('Perhatian'))
    console.log('   Invalid file rejection alert shown:', hasErrorAlert)
    if (!hasErrorAlert) throw new Error('Failed to show error for invalid file type')

    // Test valid file upload (.csv)
    console.log('   Testing valid CSV upload (test_sales.csv)...')
    await fileInput.uploadFile(CSV_FILE)
    await sleep(600)

    const fileSummaryPresent = await page.evaluate(() => document.body.innerText.includes('test_sales.csv'))
    const validCountPresent = await page.evaluate(() => document.body.innerText.includes('3 sah'))
    const previewTablePresent = await page.evaluate(() => document.body.innerText.includes('Pratonton Data'))
    console.log('   File summary present:', fileSummaryPresent)
    console.log('   3 valid rows detected:', validCountPresent)
    console.log('   Preview table visible:', previewTablePresent)
    if (!fileSummaryPresent || !validCountPresent || !previewTablePresent) {
      throw new Error('CSV upload failed to show preview and mapping')
    }

    // Capture preview state
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_preview_390px.png'), fullPage: true })
    console.log('   Captured upload_preview_390px.png')

    // Click "Jana Laporan Jualan" and verify Dashboard navigation
    console.log('   Clicking "Jana Laporan Jualan"...')
    const generateBtn = await page.$('button ::-p-text(Jana Laporan Jualan)')
    if (!generateBtn) throw new Error('Generate report button not found on upload page')
    await generateBtn.click()
    await sleep(800)

    const onDashboard = await page.evaluate(() => document.body.innerText.includes('Papan Pemuka Jualan') || document.body.innerText.includes('Papan Pemuka'))
    console.log('   Navigated to Dashboard successfully:', onDashboard)
    if (!onDashboard) throw new Error('Failed to reach Dashboard from Upload page')

    // ==========================================
    // PART 2: MANUAL SALES ENTRY PAGE
    // ==========================================
    console.log('\n--- PART 2: MANUAL SALES ENTRY PAGE ---')

    // 1. Viewport captures for empty manual page
    const manualViewports = [
      { name: 'manual_360px.png', width: 360, height: 780, isMobile: true, hasTouch: true },
      { name: 'manual_390px.png', width: 390, height: 844, isMobile: true, hasTouch: true },
      { name: 'manual_430px.png', width: 430, height: 932, isMobile: true, hasTouch: true },
      { name: 'manual_desktop.png', width: 1280, height: 850, isMobile: false, hasTouch: false },
    ]

    for (const vp of manualViewports) {
      await page.setViewport(vp)
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await sleep(300)

      // Navigate to Manual
      const manualCardBtn = await page.$('button ::-p-text(Isi Jualan Manual)')
      if (!manualCardBtn) throw new Error('Could not find "Isi Jualan Manual" button on homepage')
      await manualCardBtn.click()
      await sleep(300)

      await page.screenshot({ path: path.join(OUTPUT_DIR, vp.name), fullPage: true })
      console.log(`   Captured ${vp.name}`)
    }

    // 2. Functional tests on Manual Entry (390px)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(300)

    const manualCardBtn = await page.$('button ::-p-text(Isi Jualan Manual)')
    await manualCardBtn.click()
    await sleep(300)

    // Check header & heading
    const manualHeader = await page.evaluate(() => document.querySelector('header h1')?.innerText)
    const manualHeading = await page.evaluate(() => document.querySelector('h2')?.innerText)
    console.log('   Manual Header title:', manualHeader)
    console.log('   Manual Page heading:', manualHeading)
    if (!manualHeader?.includes('Isi Jualan Manual')) throw new Error('Header title should be "Isi Jualan Manual"')
    if (!manualHeading?.includes('Tambah jualan Puan')) throw new Error('Manual heading missing')

    // Add Record 1: Karipap, 50, 2.00, optional kos 0.80, Booth
    console.log('   Adding Record 1: Karipap (50 x RM2.00, kos RM0.80, Booth)...')
    await page.type('input[placeholder="Contoh: Karipap"]', 'Karipap')
    await page.type('input[placeholder="50"]', '50')
    await page.type('input[placeholder="2.00"]', '2.00')

    // Open optional accordion
    const optToggleBtn = await page.$('button ::-p-text(Maklumat tambahan (pilihan))')
    if (!optToggleBtn) throw new Error('Could not find optional details toggle')
    await optToggleBtn.click()
    await sleep(200)

    await page.type('input[placeholder="cth. 0.80"]', '0.80')
    await page.select('select', 'Booth')
    await sleep(200)

    // Collapse and verify data tag
    await optToggleBtn.click()
    await sleep(200)
    const isTagVisible = await page.evaluate(() => document.body.innerText.includes('Diisi'))
    console.log('   Optional tag "Diisi" visible when collapsed:', isTagVisible)

    // Submit Record 1
    const addSaleBtn = await page.$('button ::-p-text(Tambah Jualan)')
    await addSaleBtn.click()
    await sleep(400)

    // Add Record 2: Brownies, 20, 8.00
    console.log('   Adding Record 2: Brownies (20 x RM8.00)...')
    await page.type('input[placeholder="Contoh: Karipap"]', 'Brownies')
    await page.type('input[placeholder="50"]', '20')
    await page.type('input[placeholder="2.00"]', '8.00')
    await addSaleBtn.click()
    await sleep(400)

    // Verify records in Senarai Jualan
    const hasKaripap = await page.evaluate(() => document.body.innerText.includes('Karipap') && document.body.innerText.includes('RM100.00'))
    const hasBrownies = await page.evaluate(() => document.body.innerText.includes('Brownies') && document.body.innerText.includes('RM160.00'))
    const recordCountText = await page.evaluate(() => document.body.innerText.includes('2 rekod'))
    console.log('   Karipap RM100.00 in list:', hasKaripap)
    console.log('   Brownies RM160.00 in list:', hasBrownies)
    console.log('   "2 rekod" badge shown:', recordCountText)
    if (!hasKaripap || !hasBrownies || !recordCountText) {
      throw new Error('Manual sales list does not contain added items correctly')
    }

    // Capture populated 390px (matching Reference Image 2!)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_390px_populated.png'), fullPage: true })
    console.log('   Captured manual_390px_populated.png')

    // Test Edit Action on Karipap
    console.log('   Testing Edit action on Karipap...')
    const editBtn = await page.$('button ::-p-text(Edit)')
    await editBtn.click()
    await sleep(300)

    // Clear and change quantity to 60 using keyboard Ctrl+A
    const qtyInput = await page.$('input[placeholder="50"]')
    await qtyInput.click()
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('60')
    await sleep(200)

    const saveEditBtn = await page.$('button ::-p-text(Simpan Pembetulan)')
    await saveEditBtn.click()
    await sleep(400)

    const totalUpdated = await page.evaluate(() => document.body.innerText.includes('RM120.00'))
    console.log('   Karipap total updated to RM120.00 (60 x RM2.00):', totalUpdated)
    if (!totalUpdated) throw new Error('Edit failed to update record total')

    // Click "Jana Laporan Jualan" and verify Dashboard navigation
    console.log('   Clicking "Jana Laporan Jualan" from manual entry...')
    const manualGenBtn = await page.$('button ::-p-text(Jana Laporan Jualan)')
    await manualGenBtn.click()
    await sleep(800)

    const dashboardReached = await page.evaluate(() => document.body.innerText.includes('Papan Pemuka Jualan') || document.body.innerText.includes('Papan Pemuka'))
    console.log('   Dashboard reached from Manual Entry:', dashboardReached)
    if (!dashboardReached) throw new Error('Failed to reach Dashboard from Manual Entry')

    // ==========================================
    // PART 3: SIDE-BY-SIDE COMPARISONS
    // ==========================================
    console.log('\n--- PART 3: SIDE-BY-SIDE VISUAL COMPARISONS ---')

    // 1. Upload Side-by-Side
    await page.setViewport({ width: 1300, height: 850, deviceScaleFactor: 1.5 })
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #fff; padding: 24px; }
            .header { margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #f472b6; font-weight: bold; }
            .header p { font-size: 13px; color: #94a3b8; margin-top: 4px; }
            .row { display: flex; gap: 20px; align-items: flex-start; justify-content: center; }
            .card { background: #1e293b; padding: 14px; border-radius: 14px; border: 1px solid #334155; }
            h3 { margin-bottom: 12px; color: #fdf2f8; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
            .badge { background: #be1e72; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 999px; }
            img { border-radius: 8px; display: block; border: 1px solid #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UI Redesign 04: Excel / CSV Upload Page ("Muat Naik Jualan")</h1>
            <p>Side-by-side design fidelity verification against reference mockup</p>
          </div>
          <div class="row">
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge">Reference</span> User Provided Mockup 1</h3>
              <img src="file:///${REF_UPLOAD_PATH}" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge" style="background: #0d9488;">Built</span> Empty State (390px iPhone)</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/upload_390px.png" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge" style="background: #7c3aed;">Interactive</span> File Loaded & Preview</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/upload_preview_390px.png" style="width: 100%; height: auto;" />
            </div>
          </div>
        </body>
      </html>
    `)
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_side_by_side.png'), fullPage: true })
    console.log('   Saved upload_side_by_side.png')

    // 2. Manual Side-by-Side
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #fff; padding: 24px; }
            .header { margin-bottom: 20px; }
            .header h1 { font-size: 20px; color: #f472b6; font-weight: bold; }
            .header p { font-size: 13px; color: #94a3b8; margin-top: 4px; }
            .row { display: flex; gap: 20px; align-items: flex-start; justify-content: center; }
            .card { background: #1e293b; padding: 14px; border-radius: 14px; border: 1px solid #334155; }
            h3 { margin-bottom: 12px; color: #fdf2f8; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
            .badge { background: #be1e72; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 999px; }
            img { border-radius: 8px; display: block; border: 1px solid #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UI Redesign 04: Manual Sales Entry Page ("Isi Jualan Manual")</h1>
            <p>Side-by-side design fidelity verification against reference mockup</p>
          </div>
          <div class="row">
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge">Reference</span> User Provided Mockup 2</h3>
              <img src="file:///${REF_MANUAL_PATH}" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge" style="background: #0d9488;">Built</span> Populated List (390px iPhone)</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/manual_390px_populated.png" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge" style="background: #7c3aed;">Empty</span> Empty Entry Form</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/manual_390px.png" style="width: 100%; height: auto;" />
            </div>
          </div>
        </body>
      </html>
    `)
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_side_by_side.png'), fullPage: true })
    console.log('   Saved manual_side_by_side.png')

    // Copy all generated screenshots to artifacts directory
    if (fs.existsSync(ARTIFACTS_DIR)) {
      const filesToCopy = [
        'upload_360px.png',
        'upload_390px.png',
        'upload_430px.png',
        'upload_desktop.png',
        'upload_preview_390px.png',
        'upload_side_by_side.png',
        'manual_360px.png',
        'manual_390px.png',
        'manual_390px_populated.png',
        'manual_430px.png',
        'manual_desktop.png',
        'manual_side_by_side.png',
      ]
      for (const f of filesToCopy) {
        const src = path.join(OUTPUT_DIR, f)
        const dest = path.join(ARTIFACTS_DIR, f)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
        }
      }
      console.log('   All screenshots successfully copied to artifacts directory!')
    }

    console.log('\n======================================================')
    console.log('ALL VERIFICATIONS, SCREENSHOTS & COMPARISONS COMPLETED!')
    console.log('======================================================')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('ERROR during verification:', err)
  process.exit(1)
})
