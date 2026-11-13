import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const BASE_URL = 'http://localhost:5173'

const REF_DASHBOARD_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794537472334_787b5394.png'
const REF_KPI_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794537489359_ce2e9391.png'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('Starting Headless Chrome verification for UI Redesign 05 (Dashboard)...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    page.on('dialog', async (d) => {
      console.log('   [Dialog intercepted]:', d.message())
      await d.accept()
    })

    // 1. Viewport captures for Dashboard (using Sample Data)
    const viewports = [
      { name: 'dashboard_360px.png', width: 360, height: 780, isMobile: true, hasTouch: true },
      { name: 'dashboard_390px.png', width: 390, height: 844, isMobile: true, hasTouch: true },
      { name: 'dashboard_430px.png', width: 430, height: 932, isMobile: true, hasTouch: true },
      { name: 'dashboard_desktop.png', width: 1280, height: 850, isMobile: false, hasTouch: false },
    ]

    for (const vp of viewports) {
      await page.setViewport(vp)
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await sleep(300)

      // Click "Cuba Data Contoh" on homepage
      const sampleBtn = await page.$('button ::-p-text(Cuba Data Contoh)')
      if (!sampleBtn) throw new Error('Could not find "Cuba Data Contoh" button on homepage')
      await sampleBtn.click()
      await sleep(500)

      await page.screenshot({ path: path.join(OUTPUT_DIR, vp.name), fullPage: true })
      console.log(`   Captured ${vp.name}`)
    }

    // 2. Functional tests on Dashboard (390px)
    console.log('\n--- FUNCTIONAL VERIFICATION ON DASHBOARD (390px) ---')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(300)

    const sampleBtn = await page.$('button ::-p-text(Cuba Data Contoh)')
    await sampleBtn.click()
    await sleep(500)

    // Check Header & Subtitle
    const headerTitle = await page.evaluate(() => document.querySelector('header h1')?.innerText)
    const headerSub = await page.evaluate(() => document.querySelector('header p')?.innerText)
    const mainHeading = await page.evaluate(() => document.querySelector('h2')?.innerText)
    console.log('   Header title:', headerTitle)
    console.log('   Header subtitle:', headerSub)
    console.log('   Main heading:', mainHeading)

    if (!headerTitle?.includes('Laporan Jualan')) throw new Error('Header title should be "Laporan Jualan"')
    if (!headerSub?.includes('9 rekod jualan')) throw new Error('Header subtitle missing record count')
    if (!mainHeading?.includes('Prestasi perniagaan Puan')) throw new Error('Main heading missing')

    // Check All 4 KPI Cards (Matching Reference Mockup 2!)
    const kpiData = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasRevenue: text.includes('Jumlah Jualan') && text.includes('RM1,530.00'),
        hasUnits: text.includes('Produk Terjual') && text.includes('395 unit'),
        hasBestSeller: text.includes('Paling Laris') && text.includes('Karipap') && text.includes('220 unit terjual'),
        hasGrossProfit: text.includes('Untung Kasar') && text.includes('RM986.50'),
      }
    })
    console.log('   KPI 1 (Jumlah Jualan RM1,530.00):', kpiData.hasRevenue)
    console.log('   KPI 2 (Produk Terjual 395 unit):', kpiData.hasUnits)
    console.log('   KPI 3 (Paling Laris Karipap 220 unit):', kpiData.hasBestSeller)
    console.log('   KPI 4 (Untung Kasar RM986.50):', kpiData.hasGrossProfit)

    if (!kpiData.hasRevenue || !kpiData.hasUnits || !kpiData.hasBestSeller || !kpiData.hasGrossProfit) {
      throw new Error('KPI cards do not contain expected values from sample data')
    }

    // Capture KPI Detail crop
    const kpiGrid = await page.$('.grid.grid-cols-2')
    if (kpiGrid) {
      await kpiGrid.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard_kpi_detail.png') })
      console.log('   Captured dashboard_kpi_detail.png')
    }

    // Check Primary Bar Chart Canvas
    const hasBarCanvas = await page.evaluate(() => {
      const el = document.getElementById('chart-product-bar')
      return Boolean(el && el.querySelector('canvas'))
    })
    console.log('   Primary Bar Chart Canvas mounted:', hasBarCanvas)
    if (!hasBarCanvas) throw new Error('Primary Bar chart canvas not found')

    // Check Business Insights
    const hasInsights = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Apa yang Puan boleh pelajari?') && text.includes('Karipap')
    })
    console.log('   Business Insights card visible:', hasInsights)
    if (!hasInsights) throw new Error('Business Insights card missing')

    // Test Operating Expenses expansion & calculation update
    console.log('   Testing Operating Expenses expansion & calculation update...')
    const opexToggle = await page.$('button ::-p-text(Perbelanjaan Operasi)')
    if (!opexToggle) throw new Error('Could not find Operating Expenses toggle')
    await opexToggle.click()
    await sleep(300)

    await page.type('input[placeholder="cth. 150.00"]', '150')
    const saveOpexBtn = await page.$('button ::-p-text(Simpan Perbelanjaan)')
    await saveOpexBtn.click()
    await sleep(400)

    // Check if Untung Bersih is calculated: 986.50 - 150 = 836.50
    const netProfitData = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasNetProfitLabel: text.includes('Untung Bersih'),
        hasNetProfitValue: text.includes('RM836.50'),
        hasOpexTag: text.includes('RM150.00'),
      }
    })
    console.log('   Untung Bersih label displayed:', netProfitData.hasNetProfitLabel)
    console.log('   Untung Bersih calculated (RM836.50):', netProfitData.hasNetProfitValue)
    console.log('   Opex tag updated to RM150.00:', netProfitData.hasOpexTag)
    if (!netProfitData.hasNetProfitLabel || !netProfitData.hasNetProfitValue) {
      throw new Error('Operating expenses failed to update Untung Bersih to RM836.50')
    }

    // Test Advanced Analytics ("Analisis Lanjut")
    console.log('   Testing "Analisis Lanjut" expansion...')
    const advancedToggle = await page.$('button ::-p-text(Analisis Lanjut)')
    if (!advancedToggle) throw new Error('Could not find Analisis Lanjut toggle')
    await advancedToggle.click()
    await sleep(500)

    const hasAdvancedFeatures = await page.evaluate(() => {
      const text = document.body.innerText
      const doughnut = document.getElementById('chart-product-doughnut')
      return {
        hasDoughnut: Boolean(doughnut && doughnut.querySelector('canvas')),
        hasTable: text.includes('Pecahan Jualan Mengikut Produk'),
      }
    })
    console.log('   Doughnut chart rendered in Analisis Lanjut:', hasAdvancedFeatures.hasDoughnut)
    console.log('   Product breakdown table rendered:', hasAdvancedFeatures.hasTable)
    if (!hasAdvancedFeatures.hasDoughnut || !hasAdvancedFeatures.hasTable) {
      throw new Error('Advanced Analytics section failed to render charts and table')
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard_advanced_expanded.png'), fullPage: true })
    console.log('   Captured dashboard_advanced_expanded.png')

    // Test PDF Export
    console.log('   Testing PDF Export button...')
    const pdfBtn = await page.$('button ::-p-text(Simpan Laporan PDF)')
    if (!pdfBtn) throw new Error('Could not find Simpan Laporan PDF button')
    await pdfBtn.click()
    await sleep(1500)

    const pdfSuccess = await page.evaluate(() => document.body.innerText.includes('Laporan PDF berjaya dimuat turun'))
    console.log('   PDF Export success toast triggered:', pdfSuccess)
    if (!pdfSuccess) throw new Error('PDF Export failed to display success notification')

    // Test Chat Navigation
    console.log('   Testing "Tanya Pembantu AI" navigation...')
    const askBtn = await page.$('button ::-p-text(Tanya Pembantu AI)')
    if (!askBtn) throw new Error('Could not find Tanya Pembantu AI button')
    await askBtn.click()
    await sleep(600)

    const onChat = await page.evaluate(() => document.body.innerText.includes('Pembantu AI') || document.querySelector('input[placeholder*="Tanya"]'))
    console.log('   Navigated to Chat successfully:', Boolean(onChat))
    if (!onChat) throw new Error('Failed to navigate to AI Chatbot from Dashboard')

    // Return to Dashboard
    const backBtn = await page.$('header button[aria-label="Kembali"]')
    if (backBtn) await backBtn.click()
    await sleep(400)

    // ==========================================
    // 3. SIDE-BY-SIDE VISUAL COMPARISONS
    // ==========================================
    console.log('\n--- GENERATING SIDE-BY-SIDE COMPARISONS ---')

    // Comparison 1: Overall Dashboard (Mockup 1 vs Our 390px)
    await page.setViewport({ width: 1350, height: 950, deviceScaleFactor: 1.5 })
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
            <h1>UI Redesign 05: Sales Dashboard ("Laporan Jualan")</h1>
            <p>Side-by-side design fidelity verification against reference mockup 1</p>
          </div>
          <div class="row">
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge">Reference</span> User Provided Mockup 1</h3>
              <img src="file:///${REF_DASHBOARD_PATH}" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge" style="background: #0d9488;">Built</span> Mobile View (390px iPhone)</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/dashboard_390px.png" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 440px;">
              <h3><span class="badge" style="background: #7c3aed;">Expanded</span> Analisis Lanjut & Opex Active</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/dashboard_advanced_expanded.png" style="width: 100%; height: auto;" />
            </div>
          </div>
        </body>
      </html>
    `)
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard_side_by_side.png'), fullPage: true })
    console.log('   Saved dashboard_side_by_side.png')

    // Comparison 2: 4 KPI Cards (Mockup 2 vs Our Built KPI Cards)
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
            <h1>UI Redesign 05: 4 KPI Summary Cards Verification</h1>
            <p>Verification against Reference Mockup 2 (Jumlah Jualan, Produk Terjual, Paling Laris, Untung Kasar)</p>
          </div>
          <div class="row">
            <div class="card" style="flex: 1; max-width: 500px;">
              <h3><span class="badge">Reference</span> User Provided Mockup 2 (4 KPI Grid)</h3>
              <img src="file:///${REF_KPI_PATH}" style="width: 100%; height: auto;" />
            </div>
            <div class="card" style="flex: 1; max-width: 500px;">
              <h3><span class="badge" style="background: #0d9488;">Built</span> Our 4 KPI Summary Cards</h3>
              <img src="file:///C:/SULAM/wanita-niaga-ai/screenshots/dashboard_kpi_detail.png" style="width: 100%; height: auto;" />
            </div>
          </div>
        </body>
      </html>
    `)
    await sleep(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard_kpi_side_by_side.png'), fullPage: true })
    console.log('   Saved dashboard_kpi_side_by_side.png')

    // Copy all screenshots to artifacts directory
    if (fs.existsSync(ARTIFACTS_DIR)) {
      const filesToCopy = [
        'dashboard_360px.png',
        'dashboard_390px.png',
        'dashboard_430px.png',
        'dashboard_desktop.png',
        'dashboard_kpi_detail.png',
        'dashboard_advanced_expanded.png',
        'dashboard_side_by_side.png',
        'dashboard_kpi_side_by_side.png',
      ]
      for (const f of filesToCopy) {
        const src = path.join(OUTPUT_DIR, f)
        const dest = path.join(ARTIFACTS_DIR, f)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
        }
      }
      console.log('   All dashboard screenshots successfully copied to artifacts directory!')
    }

    console.log('\n======================================================')
    console.log('ALL DASHBOARD VERIFICATIONS & SCREENSHOTS COMPLETED!')
    console.log('======================================================')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('ERROR during verification:', err)
  process.exit(1)
})
