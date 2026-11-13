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

const MOCK_EXTRACTION_DATA = {
  success: true,
  hasSufficientData: true,
  clarificationMessage: '',
  operatingExpenses: null,
  records: [
    { produk: 'Karipap', kuantiti: 50, harga: 2.0, kos: 0.8, tarikh: null, saluran: 'Booth' },
    { produk: 'Brownies', kuantiti: 20, harga: 8.0, kos: 4.0, tarikh: null, saluran: 'Booth' },
  ],
}

async function setupPageWithExtraction(page, viewport) {
  await page.setViewport(viewport)
  await page.setRequestInterception(true)

  // Listen once or handle
  page.removeAllListeners('request')
  page.on('request', (req) => {
    if (req.url().includes('/api/extract')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXTRACTION_DATA),
      })
    } else {
      req.continue()
    }
  })

  // Accept window.confirm automatically
  page.removeAllListeners('dialog')
  page.on('dialog', async (dialog) => {
    console.log('   [Dialog intercepted]:', dialog.message())
    await dialog.accept()
  })

  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(300)

  // Navigate to Story Input
  const startBtn = await page.$('button ::-p-text(Mula dengan AI)')
  if (!startBtn) throw new Error('Could not find "Mula dengan AI" button')
  await startBtn.click()
  await sleep(400)
  await page.waitForSelector('#story-input')

  // Click "Cuba ayat contoh"
  const exBtn = await page.$('button ::-p-text(Cuba ayat contoh)')
  if (!exBtn) throw new Error('Could not find "Cuba ayat contoh" button')
  await exBtn.click()
  await sleep(300)

  // Click "Susun Jualan dengan AI"
  const extractBtn = await page.$('button ::-p-text(Susun Jualan dengan AI)')
  if (!extractBtn) throw new Error('Could not find "Susun Jualan dengan AI" button')
  await extractBtn.click()
  await sleep(600)

  // Wait for review page
  await page.waitForSelector('button ::-p-text(Sahkan & Jana Laporan)')
}

async function run() {
  console.log('Launching headless Chrome for Sales Data Review verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Capture 360px Mobile (Standard Android)
    console.log('1. Capturing review_360px.png...')
    await setupPageWithExtraction(page, { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(400)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'review_360px.png'), fullPage: true })

    // 2. Capture 390px Mobile (iPhone 12/13/14)
    console.log('2. Capturing review_390px.png...')
    await setupPageWithExtraction(page, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(400)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'review_390px.png'), fullPage: true })

    // Update standard 04_story_extracted_preview.png
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_story_extracted_preview.png'), fullPage: true })

    // 3. Capture 430px Mobile (iPhone Pro Max / Android Plus)
    console.log('3. Capturing review_430px.png...')
    await setupPageWithExtraction(page, { width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await sleep(400)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'review_430px.png'), fullPage: true })

    // 4. Capture Desktop (1280px)
    console.log('4. Capturing review_desktop.png...')
    await setupPageWithExtraction(page, { width: 1280, height: 850, deviceScaleFactor: 1.5, isMobile: false })
    await sleep(400)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'review_desktop.png'), fullPage: true })

    // 5. Functional Checks on 390px Mobile:
    console.log('5. Running functional checks on 390px...')
    await setupPageWithExtraction(page, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

    // Check Header elements
    const headerTitle = await page.evaluate(() => document.querySelector('h1')?.innerText)
    const stepLabel = await page.evaluate(() => document.body.innerText.includes('Langkah 2/3'))
    const successPill = await page.evaluate(() => document.body.innerText.includes('2 rekod berjaya dikenal pasti'))
    console.log('   Header Title:', headerTitle)
    console.log('   Step Label "Langkah 2/3":', stepLabel)
    console.log('   Success pill visible:', successPill)
    if (!headerTitle?.includes('Semak Maklumat')) throw new Error('Header title should be "Semak Maklumat"')
    if (!stepLabel) throw new Error('Langkah 2/3 missing')
    if (!successPill) throw new Error('Success pill missing')

    // Check Total Revenue initial (50*2 + 20*8 = 260)
    const initialTotal = await page.evaluate(() => document.body.innerText.includes('RM260.00'))
    console.log('   Initial total RM260.00 present:', initialTotal)
    if (!initialTotal) throw new Error('Initial total RM260.00 missing')

    // Test A: "+ Tambah Jualan" action
    console.log('   Testing "+ Tambah Jualan"...')
    const addBtn = await page.$('button ::-p-text(Tambah)')
    if (!addBtn) throw new Error('Could not find "+ Tambah" button')
    await addBtn.click()
    await sleep(300)

    // Fill in new record
    await page.type('input[placeholder="cth. Kuih Seri Muka"]', 'Kuih Lapis')
    await page.type('input[placeholder="cth. 30"]', '20')
    await page.type('input[placeholder="cth. 2.50"]', '1.50')
    await page.type('input[placeholder="cth. 1.00"]', '0.50')

    const saveAddBtn = await page.$('button ::-p-text(Simpan Jualan)')
    if (!saveAddBtn) throw new Error('Could not find "Simpan Jualan" button')
    await saveAddBtn.click()
    await sleep(400)

    // Check if Kuih Lapis was added and total updated (260 + 20*1.50 = 290)
    const hasKuihLapis = await page.evaluate(() => document.body.innerText.includes('Kuih Lapis'))
    const updatedCount = await page.evaluate(() => document.body.innerText.includes('3 rekod berjaya dikenal pasti'))
    const newTotal = await page.evaluate(() => document.body.innerText.includes('RM290.00'))
    console.log('   Kuih Lapis added:', hasKuihLapis)
    console.log('   Count updated to 3:', updatedCount)
    console.log('   Total updated to RM290.00:', newTotal)
    if (!hasKuihLapis || !updatedCount || !newTotal) throw new Error('Add record failed to update list and total')

    // Test B: Edit record (Edit Karipap quantity to 60 -> total 60*2 + 20*8 + 20*1.50 = 120 + 160 + 30 = RM310.00)
    console.log('   Testing "Edit" record...')
    const editBtns = await page.$$('button[aria-label^="Edit "]')
    if (editBtns.length === 0) throw new Error('No edit buttons found')
    await editBtns[0].click()
    await sleep(300)

    // Clear and type new quantity 60 using keyboard
    const qtyInputs = await page.$$('input[type="number"]')
    if (qtyInputs[0]) {
      await qtyInputs[0].click()
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.press('Backspace')
      await page.keyboard.type('60')
      await sleep(200)
    }

    const saveEditBtn = await page.$('button ::-p-text(Simpan Pembetulan)')
    if (!saveEditBtn) throw new Error('Could not find "Simpan Pembetulan" button')
    await saveEditBtn.click()
    await sleep(400)

    const totalAfterEdit = await page.evaluate(() => document.body.innerText.includes('RM310.00'))
    console.log('   Total after editing Karipap qty to 60 (RM310.00):', totalAfterEdit)
    if (!totalAfterEdit) throw new Error('Edit failed to update total revenue')

    // Test C: Operating Expenses (expand and enter RM50)
    console.log('   Testing Operating Expenses...')
    const opexBtn = await page.$('button ::-p-text(+ Tambah perbelanjaan)')
    if (opexBtn) {
      await opexBtn.click()
      await sleep(300)
      await page.type('#opex-input', '50')
      await sleep(200)
    }

    // Capture screenshot with all features active
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'review_390px_edited.png'), fullPage: true })

    // Test D: Returning to Story preserves text
    console.log('   Testing "Ubah cerita jualan" return to story...')
    const returnStoryBtn = await page.$('button ::-p-text(Ubah cerita jualan)')
    if (!returnStoryBtn) throw new Error('Could not find "Ubah cerita jualan" button')
    await returnStoryBtn.click()
    await sleep(500)

    const storyVal = await page.evaluate(() => document.querySelector('#story-input')?.value)
    console.log('   Story preserved upon return:', storyVal?.slice(0, 40) + '...')
    if (!storyVal?.includes('karipap')) throw new Error('Story was lost after returning from review')

    // Test E: Re-extract and proceed to Dashboard
    console.log('   Re-extracting and testing "Sahkan & Jana Laporan" to Dashboard...')
    const reExtractBtn = await page.$('button ::-p-text(Susun Jualan dengan AI)')
    await reExtractBtn.click()
    await sleep(600)
    await page.waitForSelector('button ::-p-text(Sahkan & Jana Laporan)')

    const confirmBtn = await page.$('button ::-p-text(Sahkan & Jana Laporan)')
    await confirmBtn.click()
    await sleep(800)

    const onDashboard = await page.evaluate(() => document.body.innerText.includes('Papan Pemuka Jualan') || document.body.innerText.includes('Papan Pemuka'))
    console.log('   Navigated to Dashboard successfully:', onDashboard)
    if (!onDashboard) throw new Error('Failed to reach Dashboard after confirmation')

    console.log('\nALL SALES DATA REVIEW CHECKS AND SCREENSHOTS COMPLETED SUCCESSFULLY!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('ERROR during verification:', err)
  process.exit(1)
})
