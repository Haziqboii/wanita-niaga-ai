import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const REF3_PATH = 'C:/Users/haxim/.gemini/antigravity/brain/47654856-1cc5-4831-8489-f0d17b9c4395/.user_uploaded/media_1794514975904_b20f7acb.png'

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.goto(`file:///${REF3_PATH}`)
  const dims = await page.evaluate(() => {
    const img = document.querySelector('img')
    return { w: img.naturalWidth, h: img.naturalHeight }
  })
  console.log('Reference 3 image dims:', dims)
  await browser.close()
}

inspect()
