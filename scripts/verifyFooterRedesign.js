import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots', 'footer_redesign')
const BASE_URL = 'http://localhost:5173/'

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const VIEWPORTS = [
  { name: '320px_narrow_mobile', width: 320, height: 600, dpr: 2 },
  { name: '390px_standard_mobile', width: 390, height: 844, dpr: 3 },
  { name: '430px_large_mobile', width: 430, height: 932, dpr: 3 },
  { name: '768px_tablet', width: 768, height: 1024, dpr: 2 },
  { name: '1280px_desktop', width: 1280, height: 800, dpr: 2 },
]

async function run() {
  console.log('🦋 Starting Final Footer Redesign Verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`)
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
      })

      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await sleep(600)

      // Check footer existence and text
      const footerInfo = await page.evaluate(() => {
        const footers = document.querySelectorAll('footer')
        if (footers.length === 0) return { count: 0 }
        
        const footer = footers[0]
        const img = footer.querySelector('img')
        const textSpan = footer.querySelector('span')
        const rawText = footer.textContent?.trim()
        const computedStyle = window.getComputedStyle(footer)
        const textStyle = textSpan ? window.getComputedStyle(textSpan) : null

        return {
          count: footers.length,
          text: rawText,
          imgSrc: img ? img.getAttribute('src') : null,
          imgNaturalWidth: img ? img.naturalWidth : 0,
          imgNaturalHeight: img ? img.naturalHeight : 0,
          imgClientWidth: img ? img.clientWidth : 0,
          imgClientHeight: img ? img.clientHeight : 0,
          bgColor: computedStyle.backgroundColor,
          borderTop: computedStyle.borderTop,
          fontFamily: textStyle ? textStyle.fontFamily : '',
          fontWeight: textStyle ? textStyle.fontWeight : '',
          fontSize: textStyle ? textStyle.fontSize : '',
          color: textStyle ? textStyle.color : '',
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
        }
      })

      console.log('   Footer Count:', footerInfo.count)
      console.log('   Footer Text:', footerInfo.text)
      console.log('   Logo src:', footerInfo.imgSrc)
      console.log(`   Logo render size: ${footerInfo.imgClientWidth}x${footerInfo.imgClientHeight}px (Natural: ${footerInfo.imgNaturalWidth}x${footerInfo.imgNaturalHeight}px)`)
      console.log('   Color:', footerInfo.color)
      console.log('   Font size:', footerInfo.fontSize, 'Weight:', footerInfo.fontWeight)
      console.log('   Horizontal Overflow:', footerInfo.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)')

      if (footerInfo.text !== 'SULAM 2.0 | WANITA DAN AI') {
        console.error(`   ❌ Text mismatch! Expected "SULAM 2.0 | WANITA DAN AI", got "${footerInfo.text}"`)
      } else {
        console.log('   ✓ Exact text matches!')
      }

      // Scroll to bottom to view footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await sleep(400)

      // Capture screenshot of footer
      const footerHandle = await page.$('footer')
      if (footerHandle) {
        await footerHandle.screenshot({
          path: path.join(SCREENSHOT_DIR, `footer_${vp.name}.png`),
        })
        console.log(`   ✓ Saved screenshot: footer_${vp.name}.png`)
      }

      // Also capture full page bottom screenshot for 390px and 1280px
      if (vp.width === 390 || vp.width === 1280) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `full_page_${vp.name}.png`),
        })
        console.log(`   ✓ Saved full-page screenshot: full_page_${vp.name}.png`)
      }
    }

    // Check consistency across other pages (Panduan Mekara)
    console.log('\n--- Checking Footer on Panduan Mekara ---')
    await page.setViewport({ width: 1280, height: 800 })
    const guideBtn = await page.$('button ::-p-text(Panduan Mekara), button:has-text("Panduan")')
    if (guideBtn) {
      await guideBtn.click()
      await sleep(600)
      const guideFooterText = await page.evaluate(() => {
        const footers = document.querySelectorAll('footer')
        return footers.length > 0 ? footers[0].textContent?.trim() : null
      })
      console.log('   Guide Page Footer Text:', guideFooterText)
      console.log('   ✓ Matches exact text:', guideFooterText === 'SULAM 2.0 | WANITA DAN AI')
    }

    // Check Chat page: Footer should be hidden
    console.log('\n--- Checking Chat Page: Footer Should Be Hidden ---')
    const chatBtn = await page.$('button ::-p-text(Mekara AI), button ::-p-text(Tanya Mekara), button ::-p-text(Mekara)')
    if (chatBtn) {
      await chatBtn.click()
      await sleep(600)
      const chatFooterCount = await page.evaluate(() => document.querySelectorAll('footer').length)
      console.log('   Chat Page Footer Count (Expected 0):', chatFooterCount)
      console.log('   ✓ Chat page hides footer properly:', chatFooterCount === 0)
    }

  } catch (err) {
    console.error('Verification error:', err)
  } finally {
    await browser.close()
    console.log('\n🦋 Footer Redesign Verification Completed!')
  }
}

run()
