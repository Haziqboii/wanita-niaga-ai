import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function inspectImages() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()

  for (const file of ['test_hero_desktop.png', 'test_hero_mobile_a.png', 'test_hero_mobile_b.png']) {
    await page.goto(`file:///C:/SULAM/wanita-niaga-ai/screenshots/${file}`)
    const info = await page.evaluate(() => {
      const img = document.querySelector('img')
      return { width: img.naturalWidth, height: img.naturalHeight }
    })
    console.log(file, info)
  }

  await browser.close()
}

inspectImages()
