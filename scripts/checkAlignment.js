import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = 'http://localhost:5173'

async function checkPreciseAlignment() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const page = await browser.newPage()

  // 1. Mobile 390px
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
  const mobileMetrics = await page.evaluate(() => {
    const hero = document.querySelector('section[aria-label="Bahagian Selamat Datang"]')
    const heroRect = hero.getBoundingClientRect()
    const badge = hero.querySelector('div.inline-flex')
    const heading = hero.querySelector('h1')
    const subtext = hero.querySelector('p')
    const btn = hero.querySelector('button')
    return {
      hero: { width: heroRect.width, height: heroRect.height },
      badge: badge ? badge.getBoundingClientRect() : null,
      heading: heading ? heading.getBoundingClientRect() : null,
      subtext: subtext ? subtext.getBoundingClientRect() : null,
      btn: btn ? btn.getBoundingClientRect() : null,
      btnRelativeTop: btn ? btn.getBoundingClientRect().top - heroRect.top : null,
      btnRelativeBottom: btn ? btn.getBoundingClientRect().bottom - heroRect.top : null,
    }
  })
  console.log('Mobile 390px Metrics:', JSON.stringify(mobileMetrics, null, 2))

  // 2. Desktop 1280px
  await page.setViewport({ width: 1280, height: 850, isMobile: false })
  await page.reload({ waitUntil: 'networkidle2' })
  const desktopMetrics = await page.evaluate(() => {
    const hero = document.querySelector('section[aria-label="Bahagian Selamat Datang"]')
    const heroRect = hero.getBoundingClientRect()
    const btn = hero.querySelector('button')
    const heading = hero.querySelector('h1')
    return {
      hero: { width: heroRect.width, height: heroRect.height },
      heading: heading ? heading.getBoundingClientRect() : null,
      btn: btn ? btn.getBoundingClientRect() : null,
      btnRelativeLeft: btn ? btn.getBoundingClientRect().left - heroRect.left : null,
      btnRelativeTop: btn ? btn.getBoundingClientRect().top - heroRect.top : null,
      btnRelativeRight: btn ? btn.getBoundingClientRect().right - heroRect.left : null,
    }
  })
  console.log('Desktop 1280px Metrics:', JSON.stringify(desktopMetrics, null, 2))

  await browser.close()
}

checkPreciseAlignment()
