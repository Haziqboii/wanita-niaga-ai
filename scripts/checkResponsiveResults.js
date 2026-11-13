import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function checkResponsiveResults() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()

  for (const name of ['360px', '390px', '430px', '768px', '1024px', '1280px']) {
    await page.goto(`file:///C:/SULAM/wanita-niaga-ai/screenshots/responsive_${name}.png`)
    console.log(`Loaded responsive_${name}.png`)
  }

  await browser.close()
}

checkResponsiveResults()
