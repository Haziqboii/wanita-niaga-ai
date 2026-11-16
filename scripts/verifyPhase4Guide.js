import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH

const OUTPUT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots\\phase4_guide'
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function run() {
  console.log('🚀 Starting Phase 4 Panduan Mekara Visual Verification...')
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // 1. Mobile 390px - Main Landing
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 600))

  // Open Guide from Hamburger or desktop
  await page.evaluate(() => {
    // Navigate directly to guide
    const guideBtns = Array.from(document.querySelectorAll('button'))
    const target = guideBtns.find(b => b.textContent.includes('Panduan Mekara') || b.textContent.includes('Panduan'))
    if (target) {
      target.click()
    }
  })
  await new Promise(r => setTimeout(r, 400))

  // Screenshot 1: Main Landing (390px)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_guide_main_landing_390px.png'), fullPage: true })
  console.log('   Captured 01_guide_main_landing_390px.png')

  // Screenshot 2: Topic A - Catat Jualan (AI Method)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const catatBtn = btns.find(b => b.textContent.includes('Catat Jualan'))
    if (catatBtn) catatBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_guide_topic_catat_ai_390px.png'), fullPage: true })
  console.log('   Captured 02_guide_topic_catat_ai_390px.png')

  // Screenshot 3: Topic A - Excel Method
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const excelBtn = btns.find(b => b.textContent.includes('Muat Naik Excel'))
    if (excelBtn) excelBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_guide_topic_catat_excel_390px.png'), fullPage: true })
  console.log('   Captured 03_guide_topic_catat_excel_390px.png')

  // Return to Guide Main
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const backBtn = btns.find(b => b.textContent.includes('Kembali ke Panduan'))
    if (backBtn) backBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))

  // Screenshot 4: Topic B - Faham Laporan
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const laporanBtn = btns.find(b => b.textContent.includes('Faham Laporan'))
    if (laporanBtn) laporanBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_guide_topic_faham_laporan_390px.png'), fullPage: true })
  console.log('   Captured 04_guide_topic_faham_laporan_390px.png')

  // Return to Guide Main
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const backBtn = btns.find(b => b.textContent.includes('Kembali ke Panduan'))
    if (backBtn) backBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))

  // Screenshot 5: Topic C - Tanya Mekara
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const tanyaBtn = btns.find(b => b.textContent.includes('Tanya Mekara'))
    if (tanyaBtn) tanyaBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_guide_topic_tanya_mekara_390px.png'), fullPage: true })
  console.log('   Captured 05_guide_topic_tanya_mekara_390px.png')

  // Return to Guide Main
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const backBtn = btns.find(b => b.textContent.includes('Kembali ke Panduan'))
    if (backBtn) backBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))

  // Screenshot 6: Topic D - Bantuan Lain (Gemini Setup)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const bantuanBtn = btns.find(b => b.textContent.includes('Bantuan Lain'))
    if (bantuanBtn) bantuanBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_guide_topic_bantuan_gemini_390px.png'), fullPage: true })
  console.log('   Captured 06_guide_topic_bantuan_gemini_390px.png')

  // Screenshot 7: Topic D - Simpanan Automatik
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const simpananBtn = btns.find(b => b.textContent.includes('Simpanan Automatik'))
    if (simpananBtn) simpananBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_guide_topic_bantuan_simpanan_390px.png'), fullPage: true })
  console.log('   Captured 07_guide_topic_bantuan_simpanan_390px.png')

  // Screenshot 8: Narrow mobile 320px
  await page.setViewport({ width: 320, height: 700, deviceScaleFactor: 2 })
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const backBtn = btns.find(b => b.textContent.includes('Kembali ke Panduan'))
    if (backBtn) backBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_guide_320px_narrow.png'), fullPage: true })
  console.log('   Captured 08_guide_320px_narrow.png')

  // Screenshot 9: Desktop 1280px
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_guide_desktop_1280px.png'), fullPage: true })
  console.log('   Captured 09_guide_desktop_1280px.png')

  // Direct CTA Verification: Click "Catat Jualan" -> "Cuba Catat Jualan"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const catatBtn = btns.find(b => b.textContent.includes('Catat Jualan'))
    if (catatBtn) catatBtn.click()
  })
  await new Promise(r => setTimeout(r, 300))

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const cta = btns.find(b => b.textContent.includes('Cuba Catat Jualan'))
    if (cta) cta.click()
  })
  await new Promise(r => setTimeout(r, 500))

  const pageUrlAfterCta = await page.evaluate(() => {
    const heading = document.querySelector('h1, h2')?.textContent || ''
    return {
      heading,
      hasTextarea: Boolean(document.querySelector('textarea'))
    }
  })
  console.log('   Direct CTA "Cuba Catat Jualan" target page check:', pageUrlAfterCta)

  await browser.close()
  console.log('🎉 Phase 4 Panduan Mekara Verification & Visual Capture completed!')
}

run().catch(err => {
  console.error('Error running verification:', err)
  process.exit(1)
})
