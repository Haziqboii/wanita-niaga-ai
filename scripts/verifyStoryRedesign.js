import puppeteer from 'puppeteer-core'
import path from 'node:path'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = 'C:\\SULAM\\wanita-niaga-ai\\screenshots'
const BASE_URL = 'http://localhost:5173'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function goToStory(page, viewport) {
  await page.setViewport(viewport)
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(400)
  const storyBtn = await page.$('button ::-p-text(Mula dengan AI)')
  if (!storyBtn) throw new Error('Could not find "Mula dengan AI" button')
  await storyBtn.click()
  await sleep(500)
  await page.waitForSelector('#story-input')
}

async function run() {
  console.log('Launching headless Chrome for Story Input verification...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Capture 360px Mobile (Standard Android)
    console.log('1. Capturing story_360px.png...')
    await goToStory(page, { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_360px.png'), fullPage: true })

    // 2. Capture 390px Mobile (iPhone 12/13/14)
    console.log('2. Capturing story_390px.png...')
    await goToStory(page, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_390px.png'), fullPage: true })

    // 3. Capture 430px Mobile (iPhone Pro Max / Android Plus)
    console.log('3. Capturing story_430px.png...')
    await goToStory(page, { width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_430px.png'), fullPage: true })

    // Update standard 03_story_input.png
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_story_input.png'), fullPage: true })

    // 4. Capture Desktop (1280px)
    console.log('4. Capturing story_desktop.png...')
    await goToStory(page, { width: 1280, height: 850, deviceScaleFactor: 1.5, isMobile: false })
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_desktop.png'), fullPage: true })

    // 5. Functional Checks (on 390px Mobile):
    console.log('5. Testing "Cuba ayat contoh" button on 390px...')
    await goToStory(page, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

    // Verify header title
    const headerTitle = await page.evaluate(() => document.querySelector('h1')?.innerText)
    console.log('   Header Title:', headerTitle)
    if (!headerTitle?.includes('Ceritakan Jualan')) {
      throw new Error(`Expected header title "Ceritakan Jualan", got "${headerTitle}"`)
    }

    // Verify initial textarea is empty
    const initialVal = await page.evaluate(() => document.querySelector('#story-input')?.value)
    console.log('   Initial textarea value:', JSON.stringify(initialVal))
    if (initialVal !== '') throw new Error('Textarea should initially be empty')

    // Verify button disabled when empty
    const isDisabledWhenEmpty = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Susun Jualan dengan AI')
      )
      return btn?.disabled
    })
    console.log('   Button disabled when empty:', isDisabledWhenEmpty)
    if (!isDisabledWhenEmpty) throw new Error('Primary button should be disabled when empty')

    // Click "Cuba ayat contoh"
    const exampleBtn = await page.$('button ::-p-text(Cuba ayat contoh)')
    if (!exampleBtn) throw new Error('Could not find "Cuba ayat contoh" button')
    await exampleBtn.click()
    await sleep(300)

    const exampleVal = await page.evaluate(() => document.querySelector('#story-input')?.value)
    console.log('   Textarea value after example click:', exampleVal?.slice(0, 45) + '...')
    if (!exampleVal?.includes('karipap')) throw new Error('Example text not inserted')

    // Verify button is now enabled
    const isEnabledNow = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Susun Jualan dengan AI')
      )
      return !btn?.disabled
    })
    console.log('   Button enabled with text:', isEnabledNow)
    if (!isEnabledNow) throw new Error('Primary button should be enabled when text is present')

    // Capture screenshot with example inserted (populated state)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'story_390px_populated.png'), fullPage: true })

    // 6. Test Back navigation and state preservation
    console.log('6. Testing back navigation and text preservation...')
    const backBtn = await page.$('button[aria-label="Kembali ke Menu Utama"]')
    if (!backBtn) throw new Error('Could not find back button in header')
    await backBtn.click()
    await sleep(400)

    const isHome = await page.evaluate(() => document.body.innerText.includes('Hai Puan!'))
    console.log('   Successfully navigated back to Home:', isHome)
    if (!isHome) throw new Error('Failed to navigate back to Home')

    // Return to Story Input
    const reStoryBtn = await page.$('button ::-p-text(Mula dengan AI)')
    await reStoryBtn.click()
    await sleep(400)
    await page.waitForSelector('#story-input')

    const preservedVal = await page.evaluate(() => document.querySelector('#story-input')?.value)
    console.log('   Preserved text on return:', preservedVal?.slice(0, 45) + '...')
    if (!preservedVal?.includes('karipap')) throw new Error('Text was not preserved upon returning')

    console.log('\nALL STORY INPUT CHECKS AND SCREENSHOTS COMPLETED SUCCESSFULLY!')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('ERROR during verification:', err)
  process.exit(1)
})
