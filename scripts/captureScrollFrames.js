import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\fullscreen_landing\\scroll_frames'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function captureScrollFrames() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))

  const scrollSteps = [
    { label: 'frame_1_landing_y0', y: 0 },
    { label: 'frame_2_scrolling_y160', y: 160 },
    { label: 'frame_3_scrolling_y360', y: 360 },
    { label: 'frame_4_scrolling_y560', y: 560 },
    { label: 'frame_5_scrolling_y740', y: 740 },
    { label: 'frame_6_revealed_y844', y: 844 },
  ]

  for (const step of scrollSteps) {
    await page.evaluate((top) => {
      window.scrollTo({ top, behavior: 'instant' })
    }, step.y)
    await new Promise((r) => setTimeout(r, 150))
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${step.label}.png`) })
    console.log(`Saved ${step.label}.png`)
  }

  await browser.close()
  console.log('Done capturing scroll frames!')
}

captureScrollFrames()
