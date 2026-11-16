import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots\\audit'
const BASE_URL = 'http://localhost:5173'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })

    // Clear IndexedDB first to start clean on Home
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases()
      dbs.forEach(db => window.indexedDB.deleteDatabase(db.name))
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // 1. Upload Page
    console.log('Capturing Upload page...')
    const uploadBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Muat Naik'))
    })
    if (uploadBtn.asElement()) {
      await uploadBtn.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'upload_390px.png'), fullPage: true })
    }

    // 2. Manual Entry Page
    console.log('Capturing Manual entry page...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    const manualBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Isi Jualan Manual'))
    })
    if (manualBtn.asElement()) {
      await manualBtn.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'manual_390px.png'), fullPage: true })
    }

    // 3. Story Input Page
    console.log('Capturing Story input page...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    const storyBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Mula dengan AI'))
    })
    if (storyBtn.asElement()) {
      await storyBtn.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_390px.png'), fullPage: true })
    }

    // 4. Sample Data -> Dashboard -> Chat
    console.log('Capturing Chat page...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    const sampleBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cuba Data Contoh'))
    })
    if (sampleBtn.asElement()) {
      await sampleBtn.asElement().click()
      await new Promise(r => setTimeout(r, 800))
    }

    const chatBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Tanya Pembantu AI'))
    })
    if (chatBtn.asElement()) {
      await chatBtn.asElement().click()
      await new Promise(r => setTimeout(r, 600))
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'chat_390px.png'), fullPage: false })
    }

    console.log('ALL REMAINING SCREENS CAPTURED!')
  } finally {
    await browser.close()
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
