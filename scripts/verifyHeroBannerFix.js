import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('Launching Puppeteer to verify mobile hero banner fix...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  // 1. 360px (Standard compact mobile)
  console.log('Capturing 360px viewport...')
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'hero_fixed_360px.png'), fullPage: false })

  // 2. 390px (iPhone 12/13/14/15/16)
  console.log('Capturing 390px viewport (iPhone)...')
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'hero_fixed_390px.png'), fullPage: false })

  // 3. 430px (iPhone Pro Max / Android large)
  console.log('Capturing 430px viewport (iPhone Pro Max)...')
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'hero_fixed_430px.png'), fullPage: false })

  // 4. Desktop (1280px)
  console.log('Capturing 1280px viewport (Desktop)...')
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5, isMobile: false })
  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'hero_fixed_desktop.png'), fullPage: false })

  await browser.close()
  console.log('Verification screenshots captured!')
}

run().catch(console.error)
