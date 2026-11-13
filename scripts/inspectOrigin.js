import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function inspectOrigin() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()
  await page.goto('file:///C:/SULAM/wanita-niaga-ai/src/assets/hero-banner-mobile.jpg')
  
  // Let's inspect Image 2 dimensions and details
  const imgInfo = await page.evaluate(() => {
    const img = document.querySelector('img')
    return {
      w: img.naturalWidth,
      h: img.naturalHeight,
      src: img.src
    }
  })
  console.log('Mobile image info:', imgInfo)
  await browser.close()
}

inspectOrigin()
