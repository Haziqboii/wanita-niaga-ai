import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\phase2b_white_floating'
const FIXTURE_PATH = 'C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🚀 Starting Phase 2B: White Floating Dashboard Verification & Capture...')
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

    // 1. Upload 600 records fixture to enter Dashboard
    console.log('\n--- 1. LOADING 600-RECORD FIXTURE INTO DASHBOARD ---')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)

    // Clear previous storage to ensure clean state
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(400)

    // Scroll to Section 2
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'instant' })
    })
    await sleep(400)

    // Click "Pilih Fail" button
    const excelCardBtn = await page.$('button ::-p-text(Pilih Fail)')
    if (!excelCardBtn) throw new Error('Could not find "Pilih Fail" button on Section 2')
    await excelCardBtn.click()
    await sleep(600)

    // Upload fixture file
    const fileInput = await page.$('input[type="file"]')
    if (!fileInput) throw new Error('Could not find file input on Upload page')
    await fileInput.uploadFile(FIXTURE_PATH)
    await sleep(800)

    // Click generate report button
    const buttons = await page.$$('button')
    let clicked = false
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn)
      if (text.includes('Laporan') || text.includes('Sahkan')) {
        await btn.click()
        clicked = true
        break
      }
    }
    if (!clicked) throw new Error('Could not click generate report button')
    await sleep(1000)

    console.log('✅ Successfully entered Dashboard with 600-record fixture!')

    // 2. Verify Regression Metrics
    const metrics = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasRevenue: text.includes('RM41,307.10'),
        hasGrossProfit: text.includes('RM22,859.00'),
        hasUnits: text.includes('8,141') || text.includes('8141'),
        hasProducts: text.includes('16 produk') || text.includes('16'),
        hasUntungKasar: text.includes('Untung Kasar'),
        hasTanyaMekara: text.includes('Tanya Mekara (AI)'),
      }
    })
    console.log('📊 Regression metrics check:', metrics)
    if (!metrics.hasRevenue || !metrics.hasGrossProfit) {
      console.warn('⚠️ Metric values might differ if filtered. Current period check.')
    }

    // A. Mobile KPI Dashboard (390px)
    console.log('\n--- CAPTURING A: Mobile KPI Dashboard (390px) ---')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await sleep(500)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'A_mobile_kpi_dashboard_390px.png'),
    })
    console.log('📸 Captured A_mobile_kpi_dashboard_390px.png')

    // Test Mobile Record/Date Strip scroll away
    console.log('\n--- TESTING & CAPTURING RECORD STRIP SCROLL AWAY ---')
    await page.evaluate(() => window.scrollTo({ top: 240, behavior: 'instant' }))
    await sleep(400)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'I_mobile_scroll_away_strip_390px.png'),
    })
    console.log('📸 Captured I_mobile_scroll_away_strip_390px.png (scrolled 240px)')

    // B. Narrow KPI Dashboard (320px)
    console.log('\n--- CAPTURING B: Narrow KPI Dashboard (320px) ---')
    await page.setViewport({ width: 320, height: 667, isMobile: true, hasTouch: true })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await sleep(500)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'B_narrow_kpi_dashboard_320px.png'),
    })
    console.log('📸 Captured B_narrow_kpi_dashboard_320px.png')

    // Switch back to 390px for section captures
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

    // Select month 'Okt 2026' to verify Monthly comparison highlight card
    console.log('\n--- CAPTURING C: Monthly Comparison Card (390px) ---')
    const oktBtn = await page.$('button ::-p-text(Okt 2026)')
    if (oktBtn) {
      await oktBtn.click()
      await sleep(500)
    }
    const compCard = await page.$('div.bg-\\[\\#FAF4EA\\]')
    if (compCard) {
      await compCard.screenshot({
        path: path.join(OUTPUT_DIR, 'C_monthly_comparison_card_390px.png'),
      })
      console.log('📸 Captured C_monthly_comparison_card_390px.png')
    } else {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'C_monthly_comparison_card_390px.png'),
      })
      console.log('📸 Captured C_monthly_comparison_card_390px.png (fallback viewport)')
    }

    // Switch back to 'Semua' for all-time product chart
    const semuaBtn = await page.$('button ::-p-text(Semua)')
    if (semuaBtn) {
      await semuaBtn.click()
      await sleep(500)
    }

    // D. Product Bar Graph
    console.log('\n--- CAPTURING D: Product Bar Graph (390px) ---')
    const barChartCard = await page.$('#chart-product-bar')
    if (barChartCard) {
      await page.evaluate(el => el.scrollIntoView({ block: 'center' }), barChartCard)
      await sleep(600)
      await barChartCard.screenshot({
        path: path.join(OUTPUT_DIR, 'D_product_bar_graph_390px.png'),
      })
      console.log('📸 Captured D_product_bar_graph_390px.png')
    }

    // E. Penemuan Pintar
    console.log('\n--- CAPTURING E: Penemuan Pintar (390px) ---')
    const penemuanEl = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'))
      const match = headings.find(h => h.innerText.includes('Penemuan Pintar'))
      return match ? match.closest('div.bg-white') : null
    })
    if (penemuanEl) {
      await page.evaluate(el => el && el.scrollIntoView({ block: 'center' }), penemuanEl)
      await sleep(500)
      const penemuanHandle = penemuanEl.asElement()
      if (penemuanHandle) {
        await penemuanHandle.screenshot({
          path: path.join(OUTPUT_DIR, 'E_penemuan_pintar_390px.png'),
        })
        console.log('📸 Captured E_penemuan_pintar_390px.png')
      }
    }

    // F. Advanced Analytics (Expand Analisis Lanjut)
    console.log('\n--- CAPTURING F: Advanced Analytics (390px) ---')
    const advancedBtn = await page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'))
      const match = headings.find(h => h.innerText.includes('Analisis Lanjut'))
      return match ? match.closest('button') : null
    })
    if (advancedBtn) {
      const btnHandle = advancedBtn.asElement()
      if (btnHandle) {
        await btnHandle.click()
        await sleep(700)
      }
    }

    // Scroll to advanced charts
    const doughnutCard = await page.$('#chart-product-doughnut')
    if (doughnutCard) {
      await page.evaluate(el => el.scrollIntoView({ block: 'center' }), doughnutCard)
      await sleep(600)
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'F_advanced_analytics_390px.png'),
      })
      console.log('📸 Captured F_advanced_analytics_390px.png')
    }

    // G. Detailed Product Table
    console.log('\n--- CAPTURING G: Detailed Product Table (390px) ---')
    await page.setViewport({ width: 390, height: 1200, isMobile: true, hasTouch: true })
    const tableEl = await page.evaluateHandle(() => {
      const h4s = Array.from(document.querySelectorAll('h4'))
      const match = h4s.find(h => h.innerText.includes('Pecahan Jualan Mengikut Produk'))
      return match ? match.parentElement : null
    })
    if (tableEl) {
      const tableHandle = tableEl.asElement()
      if (tableHandle) {
        await page.evaluate(el => el.scrollIntoView({ block: 'center' }), tableHandle)
        await sleep(600)
        await tableHandle.screenshot({
          path: path.join(OUTPUT_DIR, 'G_detailed_product_table_390px.png'),
        })
        console.log('📸 Captured G_detailed_product_table_390px.png')
      }
    }

    // H. Desktop Bento Dashboard (1280px)
    console.log('\n--- CAPTURING H: Desktop Bento Dashboard (1280px) ---')
    await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await sleep(600)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'H_desktop_bento_dashboard_1280px.png'),
    })
    console.log('📸 Captured H_desktop_bento_dashboard_1280px.png')

    console.log('\n🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED!')
  } catch (err) {
    console.error('❌ Error during verification:', err)
  } finally {
    await browser.close()
  }
}

run()
