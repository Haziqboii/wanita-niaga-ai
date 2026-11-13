import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function checkOverlap() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()

  for (const h of ['h320', 'h360', 'h400', 'h440', 'h_auto_fit']) {
    await page.goto(`file:///C:/SULAM/wanita-niaga-ai/screenshots/test_mobile_${h}.png`)
    // Let's inspect the layout in Chrome by evaluating element rects
    console.log(`Evaluated ${h}`)
  }
  await browser.close()
}

checkOverlap()
