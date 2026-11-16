import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH

const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\navbar_styling'
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function run() {
  console.log('🚀 Starting Nav Bar & Dashboard Styling Verification...')
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

  // 1. Guide Nav Bar (Panduan Mekara)
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 400))

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const guideBtn = btns.find(b => b.textContent.includes('Panduan Mekara') || b.textContent.includes('Panduan'))
    if (guideBtn) guideBtn.click()
  })
  await new Promise(r => setTimeout(r, 400))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_navbar_panduan_mekara_390px.png') })
  console.log('   Captured 01_navbar_panduan_mekara_390px.png')

  // 2. Go back to Home and load sample data to go to Dashboard
  await page.evaluate(() => {
    const backBtn = document.querySelector('header button[aria-label="Kembali ke Halaman Sebelumnya"]')
    if (backBtn) backBtn.click()
  })
  await new Promise(r => setTimeout(r, 400))

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const sampleBtn = btns.find(b => b.textContent.includes('Muatkan Data'))
    if (sampleBtn) sampleBtn.click()
  })
  await new Promise(r => setTimeout(r, 600))

  // 3. Dashboard Nav Bar (Laporan Jualan) & CTA Button (Tanya Mekara (AI))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_navbar_laporan_jualan_dashboard_390px.png') })
  console.log('   Captured 02_navbar_laporan_jualan_dashboard_390px.png')

  // 4. Open Chat (Mekara Nav Bar)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const chatBtn = btns.find(b => b.textContent.includes('Tanya Mekara (AI)'))
    if (chatBtn) chatBtn.click()
  })
  await new Promise(r => setTimeout(r, 500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_navbar_chat_mekara_only_390px.png') })
  console.log('   Captured 03_navbar_chat_mekara_only_390px.png')

  // 5. Go back and check Story Entry Nav Bar (Ceritakan Jualan)
  await page.evaluate(() => {
    const backBtn = document.querySelector('header button')
    if (backBtn) backBtn.click()
  })
  await new Promise(r => setTimeout(r, 400))

  await page.evaluate(() => {
    // Navigate to story
    window.location.hash = ''
  })

  await browser.close()
  console.log('🎉 Verification completed!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
