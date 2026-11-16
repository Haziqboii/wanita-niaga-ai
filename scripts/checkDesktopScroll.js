import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function check() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800, isMobile: false })
  await page.goto('http://localhost:5173')
  await new Promise((r) => setTimeout(r, 500))

  const scrollBtn = await page.$('section[aria-label="Pengenalan Utama Wanita Niaga AI"] button')
  console.log('Scroll button found:', Boolean(scrollBtn))

  const before = await page.evaluate(() => {
    const landing = document.querySelector('section[aria-label="Pengenalan Utama Wanita Niaga AI"]')
    const header = document.querySelector('header')
    return {
      landingHeight: landing?.getBoundingClientRect().height,
      headerTop: header?.getBoundingClientRect().top,
      scrollY: window.scrollY,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    }
  })
  console.log('Before click:', before)

  await scrollBtn.click()
  await new Promise((r) => setTimeout(r, 1200))

  const after = await page.evaluate(() => {
    const header = document.querySelector('header')
    return {
      scrollY: window.scrollY,
      headerTop: header?.getBoundingClientRect().top,
    }
  })
  console.log('After click:', after)

  await browser.close()
}

check()
