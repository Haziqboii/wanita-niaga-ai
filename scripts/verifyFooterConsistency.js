import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = 'C:\\Users\\haxim\\.gemini\\antigravity\\brain\\47654856-1cc5-4831-8489-f0d17b9c4395'
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots', 'footer_redesign')
const BASE_URL = 'http://localhost:5173/'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  console.log('🦋 Testing Panduan Mekara & Chat Page Footer Consistency...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(600)

    // 1. Navigate to Panduan Mekara
    console.log('1. Navigating to Panduan Mekara...')
    const allButtons = await page.$$('button')
    for (const b of allButtons) {
      const txt = await page.evaluate(el => el.innerText, b)
      if (txt.includes('Panduan')) {
        await b.click()
        console.log('   ✓ Clicked Panduan button')
        break
      }
    }
    await sleep(800)

    const guideFooter = await page.evaluate(() => {
      const footers = document.querySelectorAll('footer')
      if (footers.length === 0) return null
      return {
        count: footers.length,
        text: footers[0].textContent?.trim(),
        imgSrc: footers[0].querySelector('img')?.getAttribute('src'),
      }
    })
    console.log('   Panduan Mekara Footer:', guideFooter)
    console.log('   ✓ Matches exact text:', guideFooter?.text === 'SULAM 2.0 | WANITA DAN AI')

    // 2. Navigate to Chat (Mekara AI)
    console.log('\n2. Navigating to Chat Page (Tanya Mekara / Mekara AI)...')
    const chatButtons = await page.$$('button')
    for (const b of chatButtons) {
      const txt = await page.evaluate(el => el.innerText, b)
      if (txt.includes('Mekara (AI)') || txt.includes('Tanya Mekara') || txt.includes('Mekara AI')) {
        await b.click()
        console.log('   ✓ Clicked Chat button:', txt.trim().split('\n')[0])
        break
      }
    }
    await sleep(800)

    const chatFooterCount = await page.evaluate(() => document.querySelectorAll('footer').length)
    console.log('   Chat Page Footer Count (Expected 0):', chatFooterCount)
    console.log('   ✓ Chat page correctly hides footer:', chatFooterCount === 0)

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await browser.close()
    console.log('\nConsistency check finished.')
  }
}

run()
