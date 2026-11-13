import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = 'http://localhost:5173'

async function debug() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 850 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  const btn = await page.$('button ::-p-text(Mula dengan AI)')
  await btn.click()
  await new Promise(r => setTimeout(r, 600))
  const info = await page.evaluate(() => {
    const el = document.getElementById('story-input')
    const tag = document.querySelector('textarea')
    return {
      byId: el ? el.tagName : null,
      byTag: tag ? tag.tagName : null,
      val: tag ? tag.value : null
    }
  })
  console.log('Debug result:', info)
  await browser.close()
}

debug()
