import puppeteer from 'puppeteer-core'

async function check() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto('http://localhost:5173/')
  const rect = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Masuk ke Mekara"]')
    const hero = document.querySelector('section[aria-label="Pengenalan Utama Mekara"]')
    const main = document.getElementById('main-content')
    const footer = document.querySelector('footer')
    const getProps = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, height: r.height, width: r.width }
    }
    return {
      windowH: window.innerHeight,
      btn: getProps(btn),
      hero: getProps(hero),
      main: getProps(main),
      footer: getProps(footer),
    }
  })
  console.log(JSON.stringify(rect, null, 2))
  await browser.close()
}
check()
