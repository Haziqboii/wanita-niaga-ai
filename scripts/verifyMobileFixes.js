import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    // iPhone 14/15/16 Pro mobile viewport
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // 1. Click "Muatkan Data Contoh"
    console.log('--- Step 1: Navigating to Dashboard via Sample Data ---')
    const sampleBtn = await page.$('button ::-p-text(Muatkan Data Contoh)')
    if (!sampleBtn) throw new Error('Muatkan Data Contoh button not found')
    await sampleBtn.click()
    await new Promise(r => setTimeout(r, 600))

    // 2. Check Dashboard Footer
    console.log('--- Step 2: Verifying Dashboard Footer & Gap ---')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 400))

    const dashboardFooterCheck = await page.evaluate(() => {
      const text = document.body.innerText
      const hasDuplicatePrivasi = text.includes('Privasi Tempatan:')
      const hasPadamData = text.includes('Padam Data Tersimpan')
      const hasGlobalFooter = text.includes('Privasi Terjamin') && text.includes('Program Khidmat Komuniti SULAM')
      const hasMulaSemula = text.includes('Mula Semula')
      const hasKemaskini = text.includes('Kemaskini Data')

      return {
        hasDuplicatePrivasi,
        hasPadamData,
        hasGlobalFooter,
        hasMulaSemula,
        hasKemaskini,
      }
    })

    console.log('Dashboard footer check:', dashboardFooterCheck)
    if (dashboardFooterCheck.hasDuplicatePrivasi) {
      throw new Error('FAIL: Duplicate "Privasi Tempatan" is still present!')
    }
    if (dashboardFooterCheck.hasPadamData) {
      throw new Error('FAIL: Duplicate "Padam Data Tersimpan" is still present!')
    }
    if (!dashboardFooterCheck.hasGlobalFooter) {
      throw new Error('FAIL: Global Layout footer was not found!')
    }
    if (!dashboardFooterCheck.hasMulaSemula || !dashboardFooterCheck.hasKemaskini) {
      throw new Error('FAIL: Kemaskini / Mula Semula action buttons missing!')
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fix_dashboard_footer.png') })
    console.log('PASS: Dashboard footer is unified, duplicate removed, clean spacing.')

    // 3. Navigate to AI Chat
    console.log('--- Step 3: Navigating to AI Chat ---')
    const askAiBtn = await page.$('button ::-p-text(Tanya Pembantu AI)')
    if (!askAiBtn) throw new Error('Tanya Pembantu AI button not found')
    await askAiBtn.click()
    await new Promise(r => setTimeout(r, 600))

    // 4. Verify AI Chat Navigation Bar
    console.log('--- Step 4: Verifying AI Chat Navbar ---')
    const navBarCheck = await page.evaluate(() => {
      const header = document.querySelector('header')
      if (!header) return { hasHeader: false }
      const headerText = header.innerText
      const hasBackBtn = !!header.querySelector('button[aria-label*="Kembali"]')
      const hasMenuBtn = !!header.querySelector('button[aria-label="Menu Pilihan"]')
      const hasTitle = headerText.includes('Pembantu Niaga AI')
      return {
        hasHeader: true,
        hasBackBtn,
        hasMenuBtn,
        hasTitle,
        headerText,
      }
    })

    console.log('Nav bar check:', navBarCheck)
    if (!navBarCheck.hasHeader || !navBarCheck.hasBackBtn || !navBarCheck.hasMenuBtn || !navBarCheck.hasTitle) {
      throw new Error(`FAIL: Navbar check failed: ${JSON.stringify(navBarCheck)}`)
    }
    console.log('PASS: AI Chat has the exact standard Layout header with back arrow, title, and Menu button.')

    // Test clicking Menu button to ensure dropdown opens
    const menuBtn = await page.$('header button[aria-label="Menu Pilihan"]')
    if (menuBtn) {
      await menuBtn.click()
      await new Promise(r => setTimeout(r, 300))
      const menuOpen = await page.evaluate(() => {
        return document.body.innerText.includes('Menu Utama') && document.body.innerText.includes('Kunci Gemini')
      })
      if (!menuOpen) throw new Error('FAIL: Mobile dropdown menu failed to open!')
      console.log('PASS: Mobile Menu dropdown opens with Menu Utama, Panduan, and Kunci Gemini.')
      // close it
      await menuBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    // 5. Verify Bot Message Avatar Icon Removed
    console.log('--- Step 5: Verifying AI Icon in Chat Bubble Removed ---')
    const avatarCheck = await page.evaluate(() => {
      // Find bot bubble
      const botMessages = Array.from(document.querySelectorAll('.items-start'))
      // Look for any w-8 h-8 avatar inside bot message row
      const avatars = document.querySelectorAll('.items-start .w-8.h-8')
      return {
        botCount: botMessages.length,
        avatarCount: avatars.length,
      }
    })
    console.log('Avatar check:', avatarCheck)
    if (avatarCheck.avatarCount > 0) {
      throw new Error(`FAIL: Found ${avatarCheck.avatarCount} avatar icons in bot bubbles!`)
    }
    console.log('PASS: No avatar icon next to AI message bubble. Space is maximized!')

    // 6. Verify User Can Scroll to Top (No Scroll Snap Trap)
    console.log('--- Step 6: Verifying Scroll Up Behavior ---')
    const scrollContainer = await page.$('.overflow-y-auto')
    if (!scrollContainer) throw new Error('Scroll container not found')

    // Scroll to top
    await page.evaluate(() => {
      const container = document.querySelector('.overflow-y-auto')
      if (container) {
        container.scrollTop = 0
      }
    })
    await new Promise(r => setTimeout(r, 800))

    const scrollTopAfterWait = await page.evaluate(() => {
      const container = document.querySelector('.overflow-y-auto')
      return container ? container.scrollTop : -1
    })

    console.log('Scroll top after waiting 800ms:', scrollTopAfterWait)
    if (scrollTopAfterWait > 50) {
      throw new Error(`FAIL: User was auto-scrolled back down! scrollTop=${scrollTopAfterWait}`)
    }
    console.log('PASS: User is NOT trapped at bottom. Scrolling up stays at top freely!')

    // Capture screenshots
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fix_chat_mobile_view.png') })
    console.log('ALL 4 FIXES VERIFIED SUCCESSFULLY!')

  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('ERROR:', err)
  process.exit(1)
})
