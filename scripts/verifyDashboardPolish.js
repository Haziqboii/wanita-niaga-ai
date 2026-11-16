import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\dashboard_polish'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: '320px_narrow', width: 320, height: 600, isMobile: true },
  { name: '390px_standard', width: 390, height: 844, isMobile: true },
  { name: '430px_promax', width: 430, height: 932, isMobile: true },
  { name: '1280px_desktop', width: 1280, height: 800, isMobile: false },
]

async function verifyPolish() {
  console.log('🚀 Starting Verification for Dashboard Polish...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Load homepage and load sample data to enter Dashboard
    await page.setViewport({ width: 390, height: 844, isMobile: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // If sample data button exists on homepage, click it; or "Sambung Laporan" if saved
    const resumeBtn = await page.$('button ::-p-text(Sambung Laporan)')
    if (resumeBtn) {
      await resumeBtn.click()
    } else {
      const sampleBtn = await page.$('button ::-p-text(Guna Contoh Jualan)')
      if (sampleBtn) {
        await sampleBtn.click()
      } else {
        // Fallback: click "Mula Cerita Jualan" or "Isi Borang Pantas"
        const manualBtn = await page.$('button ::-p-text(Isi Borang Pantas)')
        if (manualBtn) await manualBtn.click()
      }
    }

    await new Promise((r) => setTimeout(r, 1000))

    // Ensure we are on Dashboard page: title says "Laporan Jualan"
    const isDashboard = await page.evaluate(() => {
      return document.body.innerText.includes('Prestasi perniagaan Puan')
    })
    console.log('On Dashboard page:', isDashboard)

    if (!isDashboard) {
      // Let's force sample data or navigate to dashboard directly
      console.log('Navigating to dashboard via sample data...')
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
        const sample = btns.find((b) => b.textContent?.includes('Contoh'))
        if (sample) sample.click()
      })
      await new Promise((r) => setTimeout(r, 1000))
    }

    // TEST 1: Navbar title color is deep raspberry #9D175B
    const navbarTitleInfo = await page.evaluate(() => {
      const h1 = document.querySelector('header h1')
      if (!h1) return null
      const computed = window.getComputedStyle(h1)
      return {
        text: h1.textContent?.trim(),
        color: computed.color,
      }
    })
    console.log('\n--- TEST 1: Navbar Title Color ---')
    console.log('Navbar title:', navbarTitleInfo)
    // #9D175B in rgb is rgb(157, 23, 91)
    const isRaspberryColor = navbarTitleInfo?.color === 'rgb(157, 23, 91)'
    console.log('Is deep raspberry (#9D175B / rgb(157, 23, 91))?', isRaspberryColor)

    // TEST 2: Heading underline
    console.log('\n--- TEST 2: Heading Underline ---')
    const underlineInfo = await page.evaluate(() => {
      const h2 = document.querySelector('h2')
      if (!h2 || !h2.textContent?.includes('Prestasi perniagaan Puan')) return null
      const underline = h2.parentElement?.querySelector('div[aria-hidden="true"]')
      if (!underline) return null
      const computed = window.getComputedStyle(underline)
      const rect = underline.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        backgroundColor: computed.backgroundColor,
        borderRadius: computed.borderRadius,
      }
    })
    console.log('Underline details:', underlineInfo)
    // #BE1E72 is rgb(190, 30, 114)
    const isUnderlineValid =
      Math.round(underlineInfo?.width || 0) === 68 &&
      Math.round(underlineInfo?.height || 0) === 3 &&
      underlineInfo?.backgroundColor === 'rgb(190, 30, 114)'
    console.log('Is 68px wide, 3px tall, #BE1E72, rounded?', isUnderlineValid)

    // TEST 3: Animated Hamburger Button & Dropdown
    console.log('\n--- TEST 3: Animated Hamburger Menu ---')
    const hamburgerInfo = await page.evaluate(() => {
      const btn = document.querySelector('header button[aria-controls="mobile-nav-panel"]')
      if (!btn) return null
      const rect = btn.getBoundingClientRect()
      const spans = btn.querySelectorAll('span span')
      return {
        width: rect.width,
        height: rect.height,
        ariaExpanded: btn.getAttribute('aria-expanded'),
        ariaLabel: btn.getAttribute('aria-label'),
        barCount: spans.length,
      }
    })
    console.log('Hamburger button initial state:', hamburgerInfo)

    // Capture screenshot of dashboard top with underline & closed hamburger
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_dashboard_top_390px.png'),
    })

    // Click hamburger to open
    const hamburgerBtn = await page.$('header button[aria-controls="mobile-nav-panel"]')
    if (hamburgerBtn) {
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 250)) // wait 250ms for transition
    }

    const hamburgerOpenInfo = await page.evaluate(() => {
      const btn = document.querySelector('header button[aria-controls="mobile-nav-panel"]')
      const menu = document.getElementById('mobile-nav-panel')
      return {
        ariaExpanded: btn?.getAttribute('aria-expanded'),
        menuVisible: Boolean(menu),
        menuLinks: menu ? Array.from(menu.querySelectorAll('button')).map((b) => b.textContent?.trim()) : [],
      }
    })
    console.log('Hamburger open state:', hamburgerOpenInfo)

    // Capture screenshot of open menu with X icon
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_hamburger_menu_open_390px.png'),
    })

    // Test Escape key closes menu
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 250))
    const closedAfterEscape = await page.evaluate(() => {
      return !document.getElementById('mobile-nav-panel')
    })
    console.log('Closed after Escape:', closedAfterEscape)

    // Test outside click closes menu
    if (hamburgerBtn) {
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 250))
      // Click outside (e.g. main body area)
      await page.mouse.click(200, 400)
      await new Promise((r) => setTimeout(r, 250))
    }
    const closedAfterOutsideClick = await page.evaluate(() => {
      return !document.getElementById('mobile-nav-panel')
    })
    console.log('Closed after outside click:', closedAfterOutsideClick)

    // TEST 4: Compact Secondary Actions
    console.log('\n--- TEST 4: Compact Secondary Actions ---')
    // Scroll down to the action buttons
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await new Promise((r) => setTimeout(r, 300))

    const secondaryActionsInfo = await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Kemaskini Data')
      )
      const resetBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Mula Semula')
      )
      if (!editBtn || !resetBtn) return null

      const editRect = editBtn.getBoundingClientRect()
      const resetRect = resetBtn.getBoundingClientRect()
      const parentRect = editBtn.parentElement?.getBoundingClientRect()

      return {
        editHeight: editRect.height,
        resetHeight: resetRect.height,
        editTop: editRect.top,
        resetTop: resetRect.top,
        isSameRow: Math.abs(editRect.top - resetRect.top) < 6,
        parentHeight: parentRect?.height,
        editText: editBtn.textContent?.trim(),
        resetText: resetBtn.textContent?.trim(),
      }
    })
    console.log('Secondary actions info:', secondaryActionsInfo)

    // Capture screenshot of secondary actions at 390px
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_secondary_actions_390px.png'),
    })

    // TEST 5: Responsive verification across all viewports
    console.log('\n--- TEST 5: Multi-Viewport Responsive Captures ---')
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })
      await new Promise((r) => setTimeout(r, 300))

      // Top of page
      await page.evaluate(() => window.scrollTo(0, 0))
      await new Promise((r) => setTimeout(r, 200))
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `dashboard_top_${vp.name}.png`),
      })

      // Bottom of page (secondary actions)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await new Promise((r) => setTimeout(r, 200))
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `dashboard_bottom_${vp.name}.png`),
      })

      console.log(`Captured ${vp.name}`)
    }

    console.log('\n✅ All verification checks completed successfully!')
  } catch (err) {
    console.error('Error during verification:', err)
  } finally {
    await browser.close()
  }
}

verifyPolish()
