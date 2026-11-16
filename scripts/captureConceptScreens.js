import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\audit'

const CONCEPTS = [
  {
    name: 'concept_a',
    file: 'C:\\SULAM\\wanita-niaga-ai\\prototypes\\concept-a.html'
  },
  {
    name: 'concept_b',
    file: 'C:\\SULAM\\wanita-niaga-ai\\prototypes\\concept-b.html'
  }
]

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    for (const c of CONCEPTS) {
      console.log(`Processing ${c.name}...`)
      const fileUrl = 'file:///' + c.file.replace(/\\/g, '/')

      // 1. Mobile 390px
      const pageMobile = await browser.newPage()
      await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
      await pageMobile.goto(fileUrl, { waitUntil: 'networkidle0' })
      // wait a moment for google fonts
      await new Promise(r => setTimeout(r, 1000))
      
      const mobileFull = path.join(OUTPUT_DIR, `${c.name}_mobile_390px_full.png`)
      const mobileFold = path.join(OUTPUT_DIR, `${c.name}_mobile_390px_fold.png`)
      await pageMobile.screenshot({ path: mobileFull, fullPage: true })
      await pageMobile.screenshot({ path: mobileFold, fullPage: false })
      console.log(`Saved: ${mobileFull} & ${mobileFold}`)
      await pageMobile.close()

      // 2. Desktop 1280px
      const pageDesktop = await browser.newPage()
      await pageDesktop.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
      await pageDesktop.goto(fileUrl, { waitUntil: 'networkidle0' })
      await new Promise(r => setTimeout(r, 1000))

      const desktopFull = path.join(OUTPUT_DIR, `${c.name}_desktop_1280px_full.png`)
      const desktopFold = path.join(OUTPUT_DIR, `${c.name}_desktop_1280px_fold.png`)
      await pageDesktop.screenshot({ path: desktopFull, fullPage: true })
      await pageDesktop.screenshot({ path: desktopFold, fullPage: false })
      console.log(`Saved: ${desktopFull} & ${desktopFold}`)
      await pageDesktop.close()
    }

    console.log('All concept screenshots captured successfully.')
  } catch (err) {
    console.error('Error capturing concepts:', err)
  } finally {
    await browser.close()
  }
}

run()
