import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const ARTIFACTS_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395\\screenshots'
const BASE_URL = 'http://localhost:5173'

async function captureUpdatedStoryPage() {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true })
  const page = await browser.newPage()

  // 1. Mobile 390px
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  const startBtn = await page.$('button ::-p-text(Mula dengan AI)')
  await startBtn.click()
  await new Promise(r => setTimeout(r, 400))

  const mobilePath = path.join(OUTPUT_DIR, 'story_390px_updated.png')
  await page.screenshot({ path: mobilePath, fullPage: true })
  console.log('Saved story_390px_updated.png')

  // 2. Desktop 1280px
  await page.setViewport({ width: 1280, height: 850 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  const startBtnDesktop = await page.$('button ::-p-text(Mula dengan AI)')
  await startBtnDesktop.click()
  await new Promise(r => setTimeout(r, 400))

  const desktopPath = path.join(OUTPUT_DIR, 'story_desktop_updated.png')
  await page.screenshot({ path: desktopPath, fullPage: true })
  console.log('Saved story_desktop_updated.png')

  // Copy to artifacts
  fs.copyFileSync(mobilePath, path.join(ARTIFACTS_DIR, 'story_390px_updated.png'))
  fs.copyFileSync(desktopPath, path.join(ARTIFACTS_DIR, 'story_desktop_updated.png'))
  console.log('Copied to artifacts')

  await browser.close()
}

captureUpdatedStoryPage().catch(err => {
  console.error(err)
  process.exit(1)
})
