import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots', 'landing_transition')
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🚀 Starting Landing Page & Section 2 Transition Verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. DESKTOP VIEWPORT (1280 x 800)
    console.log('\n--- 1. Testing Desktop Landing Page (1280x800) ---')
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(600)

    // Verify "Skrol untuk mula" is REMOVED
    const oldScrollText = await page.evaluate(() => {
      return document.body.innerText.includes('Skrol untuk mula')
    })
    console.log('   "Skrol untuk mula" present?:', oldScrollText ? 'FAIL (Still exists)' : 'PASS (Removed)')

    // Verify "Masuk" button exists
    const masukBtn = await page.$('button ::-p-text(Masuk)')
    console.log('   "Masuk" button found?:', Boolean(masukBtn) ? 'PASS' : 'FAIL')

    // Capture Landing Page Desktop
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_landing_page.png') })
    console.log('   ✓ Saved: 01_desktop_landing_page.png')

    // Click "Masuk"
    console.log('\n--- 2. Clicking "Masuk" to enter Section 2 ---')
    if (masukBtn) {
      await masukBtn.click()
      await sleep(150) // capture during animation or right after start
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_desktop_section2_stagger_animating.png') })
      console.log('   ✓ Saved: 02_desktop_section2_stagger_animating.png')

      await sleep(700) // let animation settle
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_section2_settled.png') })
      console.log('   ✓ Saved: 03_desktop_section2_settled.png')

      // Verify Section 2 cards exist
      const section2Cards = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll('h2, h3, button')).map(el => el.textContent?.trim())
        return {
          hasHeader: texts.some(t => t?.includes('Pilih Cara Memasukkan Jualan')),
          hasMethod1: texts.some(t => t?.includes('1. Cerita Jualan kepada AI')),
          hasMethod2: texts.some(t => t?.includes('2. Muat Naik Excel')),
          hasMethod3: texts.some(t => t?.includes('3. Isi Jualan Sendiri')),
          hasDemo: texts.some(t => t?.includes('Cuba Data Contoh')),
        }
      })
      console.log('   Section 2 Cards Verification:', section2Cards)
    }

    // 2. MOBILE VIEWPORT (iPhone 14: 390 x 844)
    console.log('\n--- 3. Testing Mobile Landing Page (390x844) ---')
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    })
    // Navigate back to landing via URL
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(600)

    const mobileMasukBtn = await page.$('button ::-p-text(Masuk)')
    console.log('   Mobile "Masuk" button found?:', Boolean(mobileMasukBtn) ? 'PASS' : 'FAIL')

    // Capture Landing Page Mobile
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_mobile_landing_page.png') })
    console.log('   ✓ Saved: 04_mobile_landing_page.png')

    // Click "Masuk" on mobile
    console.log('\n--- 4. Clicking "Masuk" on Mobile Viewport ---')
    if (mobileMasukBtn) {
      await mobileMasukBtn.click()
      await sleep(150)
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_mobile_section2_stagger_animating.png') })
      console.log('   ✓ Saved: 05_mobile_section2_stagger_animating.png')

      await sleep(700)
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mobile_section2_settled.png') })
      console.log('   ✓ Saved: 06_mobile_section2_settled.png')
    }

    // 3. RETURNING TO LANDING FROM SECTION 2
    console.log('\n--- 5. Testing Return Navigation to Landing Page ---')
    // Click back arrow in Section 2
    const backBtn = await page.$('button[aria-label="Kembali ke Halaman Sebelumnya"]')
    if (backBtn) {
      await backBtn.click()
      await sleep(500)
      const isBackOnLanding = await page.evaluate(() => {
        return Boolean(document.querySelector('button[aria-label="Masuk ke Mekara"]'))
      })
      console.log('   Successfully returned to Landing page via back button?:', isBackOnLanding ? 'PASS' : 'FAIL')
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_returned_to_landing.png') })
      console.log('   ✓ Saved: 07_returned_to_landing.png')
    }

  } catch (err) {
    console.error('Verification failed:', err)
  } finally {
    await browser.close()
    console.log('\n🎉 Landing Page & Section 2 Transition Verification Finished!')
  }
}

run()
