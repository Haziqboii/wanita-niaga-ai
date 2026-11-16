import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const DIAG_DIR = path.join(ARTIFACT_DIR, 'diagnose_mobile_web')
const FIXTURE_PATH = 'C:\\SULAM\\wanita-niaga-ai\\src\\__tests__\\fixtures\\Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(DIAG_DIR)) {
  fs.mkdirSync(DIAG_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('📱 Testing Mobile Web Charts & Advanced Charts...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.on('dialog', async (d) => await d.accept())

    // Emulate iPhone 14 (390 x 844, DPR 3, touch)
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    })

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(500)

    // Upload fixture
    await page.evaluate(() => {
      indexedDB.deleteDatabase('WanitaNiagaAI_DB')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(500)

    await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }))
    await sleep(500)

    const excelCardBtn = await page.$('button ::-p-text(Pilih Fail)')
    if (excelCardBtn) await excelCardBtn.click()
    await sleep(500)

    const fileInput = await page.$('input[type="file"]')
    if (fileInput) await fileInput.uploadFile(FIXTURE_PATH)
    await sleep(1000)

    const buttons = await page.$$('button')
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.innerText, btn)
      if (text.includes('Laporan') || text.includes('Sahkan') || text.includes('Jana')) {
        await btn.click()
        break
      }
    }
    await sleep(2000)

    // Expand "Analisis Lanjut" accordion
    console.log('Expanding "Analisis Lanjut" accordion...')
    const advBtn = await page.$('button ::-p-text(Analisis Lanjut)')
    if (advBtn) {
      await advBtn.scrollIntoView()
      await sleep(400)
      await advBtn.click()
      console.log('   ✓ Clicked "Analisis Lanjut"')
      await sleep(1200)

      // Screenshot the expanded advanced charts
      const doughnut1 = await page.$('#chart-product-doughnut')
      if (doughnut1) {
        await doughnut1.scrollIntoView()
        await sleep(600)
        await doughnut1.screenshot({
          path: path.join(DIAG_DIR, '03_mobile_web_product_doughnut.png'),
        })
        console.log('   ✓ Captured 03_mobile_web_product_doughnut.png')
      }

      // Find Trend Line chart card & Channel Doughnut chart card
      const allCards = await page.$$('.space-y-4 > div, .space-y-5 > div')
      console.log(`Found ${allCards.length} divs inside container`)

      await page.evaluate(() => window.scrollBy(0, 400))
      await sleep(600)
      await page.screenshot({
        path: path.join(DIAG_DIR, '04_mobile_web_trend_line_chart.png'),
      })
      console.log('   ✓ Captured 04_mobile_web_trend_line_chart.png')

      await page.evaluate(() => window.scrollBy(0, 450))
      await sleep(600)
      await page.screenshot({
        path: path.join(DIAG_DIR, '05_mobile_web_channel_doughnut.png'),
      })
      console.log('   ✓ Captured 05_mobile_web_channel_doughnut.png')
    } else {
      console.log('   ❌ Could not find "Analisis Lanjut" button')
    }

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
    console.log('Finished mobile web testing.')
  }
}

run()
