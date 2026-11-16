import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\audit'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: '320px_se', width: 320, height: 568 },
  { name: '360px_galaxy', width: 360, height: 740 },
  { name: '390px_iphone14', width: 390, height: 844 },
  { name: '430px_pro_max', width: 430, height: 932 },
  { name: '768px_tablet', width: 768, height: 1024 },
  { name: '1280px_desktop', width: 1280, height: 800 },
]

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const auditFindings = {
    overflows: [],
    tinyText: [],
    smallTouchTargets: [],
    lowContrastSuspects: [],
  }

  try {
    const page = await browser.newPage()

    // Helper: collect DOM technical metrics
    async function collectPageMetrics(pageName, vpName) {
      const metrics = await page.evaluate((pName, vName) => {
        const docWidth = document.documentElement.offsetWidth
        const scrollWidth = document.documentElement.scrollWidth
        const hasHorizontalOverflow = scrollWidth > docWidth + 1

        const elements = Array.from(document.querySelectorAll('*'))
        const smallTexts = []
        const smallTargets = []

        elements.forEach(el => {
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)

          // Check visible text
          if (el.children.length === 0 && el.textContent.trim().length > 0 && rect.width > 0 && rect.height > 0) {
            const fontSize = parseFloat(style.fontSize)
            if (fontSize < 12) {
              smallTexts.push({
                tag: el.tagName,
                text: el.textContent.trim().slice(0, 30),
                fontSize: `${fontSize}px`,
                className: el.className ? String(el.className).slice(0, 40) : '',
              })
            }
          }

          // Check interactive touch targets
          const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.getAttribute('role') === 'button'
          if (isInteractive && rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              smallTargets.push({
                tag: el.tagName,
                text: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 25),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                classes: el.className ? String(el.className).slice(0, 40) : '',
              })
            }
          }
        })

        return {
          hasHorizontalOverflow,
          docWidth,
          scrollWidth,
          smallTexts: smallTexts.slice(0, 10),
          smallTargets: smallTargets.slice(0, 15),
        }
      }, pageName, vpName)

      if (metrics.hasHorizontalOverflow) {
        auditFindings.overflows.push({ page: pageName, viewport: vpName, docWidth: metrics.docWidth, scrollWidth: metrics.scrollWidth })
      }
      if (metrics.smallTexts.length > 0) {
        auditFindings.tinyText.push({ page: pageName, viewport: vpName, samples: metrics.smallTexts })
      }
      if (metrics.smallTargets.length > 0) {
        auditFindings.smallTouchTargets.push({ page: pageName, viewport: vpName, samples: metrics.smallTargets })
      }
    }

    // 1. Audit Homepage across all viewports
    console.log('--- 1. Auditing Homepage across viewports ---')
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.width <= 768, hasTouch: vp.width <= 768 })
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
      await page.screenshot({ path: path.join(OUTPUT_DIR, `home_${vp.name}.png`), fullPage: true })
      await collectPageMetrics('Homepage', vp.name)
    }

    // 2. Load Sample Data & Audit Dashboard
    console.log('--- 2. Loading Sample Data & Auditing Dashboard ---')
    // Click sample data button on 390px
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // Find and click "Guna Data Contoh" button
    const sampleBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find(b => b.textContent && b.textContent.includes('Guna Data Contoh') || b.textContent.includes('Data Contoh'))
    })

    if (sampleBtn && sampleBtn.asElement()) {
      await sampleBtn.asElement().click()
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
      await new Promise(r => setTimeout(r, 1000))
    }

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.width <= 768, hasTouch: vp.width <= 768 })
      await page.screenshot({ path: path.join(OUTPUT_DIR, `dashboard_${vp.name}.png`), fullPage: true })
      await collectPageMetrics('Dashboard', vp.name)
    }

    // 3. Audit Chat Interface
    console.log('--- 3. Auditing Chat Interface ---')
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    // Click "Tanya Pembantu AI" button or navigate
    const chatBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find(b => b.textContent && (b.textContent.includes('Tanya Pembantu AI') || b.textContent.includes('Tanya AI') || b.textContent.includes('Pembantu AI')))
    })

    if (chatBtn && chatBtn.asElement()) {
      await chatBtn.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'chat_390px.png'), fullPage: false })
      await collectPageMetrics('Chat', '390px_iphone14')
    }

    // 4. Audit Forms (Upload, Manual, Story, Guide)
    console.log('--- 4. Auditing Input Modes & User Guide ---')
    // Go home first
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // A. Upload Form
    const uploadCard = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"]'))
      return btns.find(b => b.textContent && b.textContent.includes('Muat Naik'))
    })
    if (uploadCard && uploadCard.asElement()) {
      await uploadCard.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_390px.png'), fullPage: true })
      await collectPageMetrics('UploadForm', '390px_iphone14')
    }

    // B. Manual Entry Form
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    const manualCard = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"]'))
      return btns.find(b => b.textContent && b.textContent.includes('Isi Jualan Manual'))
    })
    if (manualCard && manualCard.asElement()) {
      await manualCard.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_390px.png'), fullPage: true })
      await collectPageMetrics('ManualEntryForm', '390px_iphone14')
    }

    // C. AI Story Input Form
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    const storyCard = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"]'))
      return btns.find(b => b.textContent && (b.textContent.includes('Mula dengan AI') || b.textContent.includes('Ceritakan Jualan')))
    })
    if (storyCard && storyCard.asElement()) {
      await storyCard.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_390px.png'), fullPage: true })
      await collectPageMetrics('StoryInputForm', '390px_iphone14')
    }

    // D. User Guide
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    const guideBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find(b => (b.textContent && b.textContent.includes('Panduan')) || b.getAttribute('title')?.includes('Panduan'))
    })
    if (guideBtn && guideBtn.asElement()) {
      await guideBtn.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'guide_390px.png'), fullPage: true })
      await collectPageMetrics('UserGuide', '390px_iphone14')
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'metrics_summary.json'), JSON.stringify(auditFindings, null, 2))
    console.log('--- AUDIT CAPTURE & METRICS COMPLETE ---')
  } finally {
    await browser.close()
  }
}

run().catch(err => {
  console.error('Audit run error:', err)
  process.exit(1)
})
