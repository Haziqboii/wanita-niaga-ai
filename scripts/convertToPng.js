import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function convert() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 576, height: 1024, deviceScaleFactor: 1 })
  const base64 = fs.readFileSync('public/images/landing-hero.jpg').toString('base64')
  await page.setContent(`
    <style>body,html{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
    <img id="img" src="data:image/jpeg;base64,${base64}" style="display:block;width:576px;height:1024px;">
  `)
  const el = await page.$('#img')
  if (el) {
    await el.screenshot({ path: 'public/images/landing-hero.png', type: 'png' })
    console.log('Saved true PNG:', fs.statSync('public/images/landing-hero.png').size)
  }
  await browser.close()
}

convert()
