import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\apple_berry'
const PROTO_FILE = 'file:///C:/SULAM/wanita-niaga-ai/prototypes/apple-berry-premium.html'

const VIEWPORTS = [
  { name: 'mobile_320px', width: 320, height: 640, isMobile: true },
  { name: 'mobile_390px', width: 390, height: 844, isMobile: true },
  { name: 'mobile_430px', width: 430, height: 932, isMobile: true },
  { name: 'tablet_768px', width: 768, height: 1024, isMobile: false },
  { name: 'desktop_1280px', width: 1280, height: 800, isMobile: false },
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
    for (const vp of VIEWPORTS) {
      console.log(`Capturing ${vp.name}...`)
      const page = await browser.newPage()
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
      })

      await page.goto(PROTO_FILE, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 600))

      // 1. Fold view (Returning User default)
      const foldPath = path.join(OUTPUT_DIR, `apple_berry_${vp.name}_fold.png`)
      await page.screenshot({ path: foldPath, fullPage: false })

      // 2. Full-page view
      const fullPath = path.join(OUTPUT_DIR, `apple_berry_${vp.name}_full.png`)
      await page.screenshot({ path: fullPath, fullPage: true })

      // 3. New User view (Returning card hidden)
      await page.evaluate(() => {
        const el = document.getElementById('returningSection') || document.getElementById('returningPanel')
        if (el) el.style.display = 'none'
      })
      await new Promise((r) => setTimeout(r, 200))
      const newPath = path.join(OUTPUT_DIR, `apple_berry_${vp.name}_new_user.png`)
      await page.screenshot({ path: newPath, fullPage: false })

      // 4. Capture interactive modal state for 390px and 1280px
      if (vp.name === 'mobile_390px' || vp.name === 'desktop_1280px') {
        await page.evaluate(() => {
          openModal(
            'Sambungan Kunci Gemini AI',
            'Masukkan kunci API Google Gemini Puan untuk analisis perniagaan yang selamat dan percuma.',
            'Simpan Kunci API'
          )
        })
        await new Promise((r) => setTimeout(r, 400))
        const modalPath = path.join(OUTPUT_DIR, `apple_berry_${vp.name}_modal.png`)
        await page.screenshot({ path: modalPath, fullPage: false })
      }

      await page.close()
    }

    console.log('All Apple Berry viewports captured successfully!')
  } catch (err) {
    console.error('Error during capture:', err)
  } finally {
    await browser.close()
  }
}

run()
