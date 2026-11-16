import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = 'http://localhost:5173/'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await sleep(500)

    // Open Guide
    const allButtons = await page.$$('button')
    for (const b of allButtons) {
      const txt = await page.evaluate(el => el.innerText, b)
      if (txt.includes('Panduan')) {
        await b.click()
        break
      }
    }
    await sleep(800)

    // In Guide, find navigation link to Chat
    const chatNavBtn = await page.$('button ::-p-text(Tanya Mekara), button ::-p-text(Cuba Tanya Mekara), button ::-p-text(Buka Mekara AI)')
    if (chatNavBtn) {
      await chatNavBtn.click()
      await sleep(800)

      const isChatVisible = await page.evaluate(() => {
        const composer = document.querySelector('textarea, input[placeholder*="Tanya"], input[placeholder*="Mekara"]')
        const footers = document.querySelectorAll('footer')
        return {
          hasComposer: Boolean(composer),
          footerCount: footers.length,
        }
      })
      console.log('   Chat Page Status:', isChatVisible)
      console.log('   ✓ Chat page footer hidden (count === 0):', isChatVisible.footerCount === 0)
    }
  } finally {
    await browser.close()
  }
}

run()
